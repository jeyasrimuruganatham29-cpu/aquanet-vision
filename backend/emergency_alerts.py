import logging
import os
import re
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path

from flask import Blueprint, g, jsonify, request


logger = logging.getLogger("AquaNetVisionEmergencyAlerts")
emergency_alerts_bp = Blueprint("emergency_alerts", __name__, url_prefix="/api/v1/emergency")

EMERGENCY_TYPES = {
    "water_contamination", "flood_contamination", "drought_water_quality",
    "industrial_pollution", "sewage_contamination", "other",
    "contamination", "flooding", "extreme_rainfall", "drought",
}
SEVERITIES = {"low", "medium", "high", "critical", "info", "warning"}
PHONE_PATTERN = re.compile(r"^\+91[6-9]\d{9}$")


def _now():
    return datetime.now(timezone.utc).isoformat()


def _database_path():
    return Path(os.environ.get(
        "AQUANET_EMERGENCY_DB_PATH",
        Path(__file__).parent / "outputs" / "emergency_alerts.sqlite3",
    ))


def _initialize_database(connection):
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS emergency_alerts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL DEFAULT '',
            emergency_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            water_body TEXT,
            message TEXT NOT NULL,
            precautions TEXT NOT NULL,
            expires_at TEXT,
            status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'simulated', 'cancelled')),
            created_by_role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            approved_by_role TEXT,
            approved_at TEXT,
            verified_by_role TEXT,
            verified_at TEXT,
            recipient_count INTEGER NOT NULL DEFAULT 0,
            delivery_status TEXT,
            provider_response TEXT,
            processed_at TEXT,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS emergency_recipients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            state TEXT NOT NULL,
            district TEXT NOT NULL,
            consent INTEGER NOT NULL CHECK (consent = 1),
            consent_recorded_at TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_emergency_recipients_area
            ON emergency_recipients(state, district, consent);
        CREATE TABLE IF NOT EXISTS emergency_alert_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alert_id TEXT NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            from_status TEXT,
            to_status TEXT NOT NULL,
            actor_role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(alert_id, event_type, created_at)
        );
        """
    )
    alert_columns = {
        row["name"] for row in connection.execute("PRAGMA table_info(emergency_alerts)")
    }
    if "title" not in alert_columns:
        connection.execute("ALTER TABLE emergency_alerts ADD COLUMN title TEXT NOT NULL DEFAULT ''")
    if "water_body" not in alert_columns:
        connection.execute("ALTER TABLE emergency_alerts ADD COLUMN water_body TEXT")
    if "expires_at" not in alert_columns:
        connection.execute("ALTER TABLE emergency_alerts ADD COLUMN expires_at TEXT")

    existing_columns = {
        row["name"] for row in connection.execute("PRAGMA table_info(emergency_alerts)")
    }
    if "verified_by_role" not in existing_columns:
        connection.execute("ALTER TABLE emergency_alerts ADD COLUMN verified_by_role TEXT")
    if "verified_at" not in existing_columns:
        connection.execute("ALTER TABLE emergency_alerts ADD COLUMN verified_at TEXT")

    connection.execute(
        """
        INSERT OR IGNORE INTO emergency_alert_events (
            alert_id, event_type, from_status, to_status, actor_role, created_at
        )
        SELECT id, 'created', NULL, 'draft', created_by_role, created_at
        FROM emergency_alerts
        """
    )
    connection.execute(
        """
        INSERT OR IGNORE INTO emergency_alert_events (
            alert_id, event_type, from_status, to_status, actor_role, created_at
        )
        SELECT id, 'approved', 'draft', 'approved', COALESCE(approved_by_role, created_by_role), approved_at
        FROM emergency_alerts WHERE approved_at IS NOT NULL
        """
    )
    connection.execute(
        """
        INSERT OR IGNORE INTO emergency_alert_events (
            alert_id, event_type, from_status, to_status, actor_role, created_at
        )
        SELECT id, 'simulated', 'approved', 'simulated', COALESCE(verified_by_role, approved_by_role, created_by_role), processed_at
        FROM emergency_alerts WHERE status = 'simulated' AND processed_at IS NOT NULL
        """
    )
    connection.execute(
        """
        INSERT OR IGNORE INTO emergency_alert_events (
            alert_id, event_type, from_status, to_status, actor_role, created_at
        )
        SELECT id, 'cancelled', NULL, 'cancelled', 'unrecorded', updated_at
        FROM emergency_alerts WHERE status = 'cancelled'
        """
    )


@contextmanager
def _database():
    path = _database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    connection.execute("PRAGMA busy_timeout = 5000")
    try:
        _initialize_database(connection)
        connection.commit()
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def require_demo_role(*allowed_roles):
    """Enforce the UI's demo role header; this is not authentication."""
    def decorate(handler):
        @wraps(handler)
        def guarded(*args, **kwargs):
            role = request.headers.get("X-AquaNet-Demo-Role", "").strip().lower()
            if role not in {"admin", "analyst"}:
                return jsonify({
                    "success": False,
                    "error": "A valid demo role is required. This role header is not authentication.",
                }), 401
            if role not in allowed_roles:
                return jsonify({"success": False, "error": "This action requires an administrator demo role."}), 403
            g.demo_role = role
            return handler(*args, **kwargs)
        return guarded
    return decorate


def _alert_dict(row):
    return dict(row)


def _recipient_dict(row):
    recipient = dict(row)
    phone = recipient.get("phone", "")
    recipient["phone"] = f"{phone[:3]}******{phone[-4:]}" if len(phone) > 4 else "****"
    return recipient


def _record_event(connection, alert_id, event_type, from_status, to_status, actor_role, timestamp):
    connection.execute(
        """
        INSERT OR IGNORE INTO emergency_alert_events (
            alert_id, event_type, from_status, to_status, actor_role, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        """,
        (alert_id, event_type, from_status, to_status, actor_role, timestamp),
    )


def _parse_expiry(value):
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise ValueError("Alert expiry must be an ISO 8601 date and time.")
    try:
        expiry = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Enter a valid alert expiry date and time.") from exc
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    expiry = expiry.astimezone(timezone.utc)
    if expiry <= datetime.now(timezone.utc):
        raise ValueError("Alert expiry must be in the future.")
    return expiry.isoformat()


def _parse_expiry_allow_past(value):
    if not value:
        return False
    expiry = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry.astimezone(timezone.utc) <= datetime.now(timezone.utc)


def _validated_alert_fields(payload, current=None):
    current = current or {}
    fields = {
        key: str(payload.get(key, current.get(key) or "")).strip()
        for key in ("title", "emergency_type", "severity", "state", "district", "water_body", "message", "precautions")
    }
    fields["emergency_type"] = fields["emergency_type"].lower()
    fields["severity"] = fields["severity"].lower()
    if not fields["title"] and fields["emergency_type"]:
        fields["title"] = f"{fields['emergency_type'].replace('_', ' ').title()} alert"
    if not fields["title"] or len(fields["title"]) > 150:
        raise ValueError("Alert title is required and must be 150 characters or fewer.")
    if fields["emergency_type"] not in EMERGENCY_TYPES:
        raise ValueError("Choose a supported emergency type.")
    if fields["severity"] not in SEVERITIES:
        raise ValueError("Choose a supported severity.")
    if not fields["state"] or len(fields["state"]) > 100 or not fields["district"] or len(fields["district"]) > 100:
        raise ValueError("Affected state and district (or *) are required.")
    if len(fields["water_body"]) > 200:
        raise ValueError("Affected water body must be 200 characters or fewer.")
    if not fields["message"] or len(fields["message"]) > 500:
        raise ValueError("Warning message is required and must be 500 characters or fewer.")
    if not fields["precautions"] or len(fields["precautions"]) > 1000:
        raise ValueError("Recommended precautions are required and must be 1000 characters or fewer.")
    fields["expires_at"] = _parse_expiry(payload.get("expires_at", current.get("expires_at")))
    return fields


def _recipient_count(connection, alert):
    row = connection.execute(
        """
        SELECT COUNT(*) AS count
        FROM emergency_recipients
        WHERE consent = 1
          AND lower(state) = lower(?)
          AND (
              lower(district) = '*'
              OR ? = '*'
              OR lower(district) = lower(?)
          )
        """,
        (alert["state"], alert["district"], alert["district"]),
    ).fetchone()
    return row["count"]


def _max_recipients():
    raw_value = os.environ.get("AQUANET_SMS_MAX_RECIPIENTS", "100")
    try:
        limit = int(raw_value)
    except ValueError as exc:
        raise ValueError("AQUANET_SMS_MAX_RECIPIENTS must be a positive integer.") from exc
    if limit < 1:
        raise ValueError("AQUANET_SMS_MAX_RECIPIENTS must be a positive integer.")
    return limit


def _error(message, status):
    return jsonify({"success": False, "error": message}), status


@emergency_alerts_bp.get("/alerts")
@require_demo_role("admin", "analyst")
def list_emergency_alerts():
    try:
        with _database() as connection:
            rows = connection.execute(
                "SELECT * FROM emergency_alerts ORDER BY created_at DESC"
            ).fetchall()
        return jsonify({"success": True, "alerts": [_alert_dict(row) for row in rows]}), 200
    except sqlite3.Error:
        logger.exception("Could not read emergency alert history")
        return _error("Emergency alert history is unavailable.", 500)


@emergency_alerts_bp.get("/alerts/<alert_id>")
@require_demo_role("admin", "analyst")
def get_emergency_alert(alert_id):
    try:
        with _database() as connection:
            alert = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            if alert is None:
                return _error("Emergency alert not found.", 404)
            events = connection.execute(
                """
                SELECT event_type, from_status, to_status, actor_role, created_at
                FROM emergency_alert_events WHERE alert_id = ? ORDER BY created_at, id
                """,
                (alert_id,),
            ).fetchall()
        return jsonify({
            "success": True,
            "alert": _alert_dict(alert),
            "status_history": [dict(event) for event in events],
        }), 200
    except sqlite3.Error:
        logger.exception("Could not read emergency alert details")
        return _error("Emergency alert details are unavailable.", 500)


@emergency_alerts_bp.post("/alerts")
@require_demo_role("admin", "analyst")
def create_emergency_alert():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error("A JSON request body is required.", 400)

    try:
        fields = _validated_alert_fields(payload)
    except ValueError as exc:
        return _error(str(exc), 422)

    timestamp = _now()
    alert_id = str(uuid.uuid4())
    try:
        with _database() as connection:
            connection.execute(
                """
                INSERT INTO emergency_alerts (
                    id, title, emergency_type, severity, state, district, water_body,
                    message, precautions, expires_at,
                    status, created_by_role, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)
                """,
                (
                    alert_id, fields["title"], fields["emergency_type"], fields["severity"],
                    fields["state"], fields["district"], fields["water_body"],
                    fields["message"], fields["precautions"], fields["expires_at"],
                    g.demo_role, timestamp, timestamp,
                ),
            )
            _record_event(connection, alert_id, "created", None, "draft", g.demo_role, timestamp)
            row = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
        return jsonify({"success": True, "alert": _alert_dict(row)}), 201
    except sqlite3.Error:
        logger.exception("Could not save emergency alert draft")
        return _error("Emergency alert draft could not be saved.", 500)


@emergency_alerts_bp.patch("/alerts/<alert_id>")
@require_demo_role("admin")
def update_emergency_alert(alert_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error("A JSON request body is required.", 400)
    timestamp = _now()
    try:
        with _database() as connection:
            existing = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            if existing is None:
                return _error("Emergency alert not found.", 404)
            if existing["status"] != "draft":
                return _error("Only draft alerts can be edited.", 409)
            try:
                fields = _validated_alert_fields(payload, dict(existing))
            except ValueError as exc:
                return _error(str(exc), 422)
            connection.execute(
                """
                UPDATE emergency_alerts
                SET title = ?, emergency_type = ?, severity = ?, state = ?, district = ?,
                    water_body = ?, message = ?, precautions = ?, expires_at = ?, updated_at = ?
                WHERE id = ? AND status = 'draft'
                """,
                (
                    fields["title"], fields["emergency_type"], fields["severity"],
                    fields["state"], fields["district"], fields["water_body"],
                    fields["message"], fields["precautions"], fields["expires_at"],
                    timestamp, alert_id,
                ),
            )
            _record_event(connection, alert_id, "edited", "draft", "draft", g.demo_role, timestamp)
            row = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
        return jsonify({"success": True, "alert": _alert_dict(row)}), 200
    except sqlite3.Error:
        logger.exception("Could not update emergency alert draft")
        return _error("Emergency alert draft could not be updated.", 500)


@emergency_alerts_bp.post("/alerts/<alert_id>/preview")
@require_demo_role("admin", "analyst")
def preview_emergency_alert(alert_id):
    try:
        with _database() as connection:
            alert = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            if alert is None:
                return _error("Emergency alert not found.", 404)
            if alert["status"] not in {"draft", "approved"}:
                return _error("Only draft or approved alerts can be previewed.", 409)
            count = _recipient_count(connection, alert)
            limit = _max_recipients()
        return jsonify({
            "success": True,
            "alert_id": alert_id,
            "message": alert["message"],
            "state": alert["state"],
            "district": alert["district"],
            "recipient_count": count,
            "max_recipients": limit,
            "exceeds_limit": count > limit,
            "sms_mode": os.environ.get("AQUANET_SMS_MODE", "simulation").strip().lower(),
            "live_sms_available": False,
            "expired": bool(alert["expires_at"] and _parse_expiry_allow_past(alert["expires_at"])),
        }), 200
    except ValueError as exc:
        return _error(str(exc), 500)
    except sqlite3.Error:
        logger.exception("Could not preview emergency alert")
        return _error("Emergency alert preview could not be generated.", 500)


@emergency_alerts_bp.post("/alerts/<alert_id>/approve")
@require_demo_role("admin")
def approve_emergency_alert(alert_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or payload.get("verified") is not True:
        return _error("An administrator must confirm independent verification before approval.", 400)
    timestamp = _now()
    try:
        with _database() as connection:
            existing = connection.execute(
                "SELECT status, expires_at FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            if existing is None:
                return _error("Emergency alert not found.", 404)
            if existing["status"] != "draft":
                return _error("Only a draft can be approved.", 409)
            if existing["expires_at"] and _parse_expiry_allow_past(existing["expires_at"]):
                return _error("This alert has expired and cannot be approved.", 409)
            result = connection.execute(
                """
                UPDATE emergency_alerts
                SET status = 'approved', approved_by_role = ?, approved_at = ?,
                    verified_by_role = ?, verified_at = ?, updated_at = ?
                WHERE id = ? AND status = 'draft'
                """,
                (g.demo_role, timestamp, g.demo_role, timestamp, timestamp, alert_id),
            )
            if result.rowcount == 0:
                exists = connection.execute(
                    "SELECT 1 FROM emergency_alerts WHERE id = ?", (alert_id,)
                ).fetchone()
                if exists is None:
                    return _error("Emergency alert not found.", 404)
                return _error("Only a draft can be approved.", 409)
            _record_event(connection, alert_id, "approved", "draft", "approved", g.demo_role, timestamp)
            row = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
        return jsonify({"success": True, "alert": _alert_dict(row)}), 200
    except sqlite3.Error:
        logger.exception("Could not approve emergency alert")
        return _error("Emergency alert approval failed.", 500)


@emergency_alerts_bp.post("/alerts/<alert_id>/send")
@require_demo_role("admin")
def simulate_emergency_alert_send(alert_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or payload.get("confirmed") is not True:
        return _error("Explicit administrator confirmation is required.", 400)
    if os.environ.get("AQUANET_SMS_MODE", "simulation").strip().lower() != "simulation":
        return _error("Live SMS dispatch is not implemented; no messages were sent.", 503)

    timestamp = _now()
    try:
        with _database() as connection:
            connection.execute("BEGIN IMMEDIATE")
            alert = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            if alert is None:
                return _error("Emergency alert not found.", 404)
            if alert["status"] != "approved":
                return _error("Only an approved alert can be processed.", 409)
            if alert["expires_at"] and _parse_expiry_allow_past(alert["expires_at"]):
                return _error("This alert has expired and cannot be processed.", 409)

            count = _recipient_count(connection, alert)
            limit = _max_recipients()
            if count == 0:
                return _error("No consented recipients match this affected area.", 409)
            if count > limit:
                return _error(f"Recipient count exceeds the configured limit of {limit}.", 409)
            if payload.get("confirmed_message") != alert["message"]:
                return _error("The confirmed warning message does not match the saved alert.", 409)
            if type(payload.get("confirmed_recipient_count")) is not int or payload["confirmed_recipient_count"] != count:
                return _error("The recipient count changed; preview and confirm the alert again.", 409)

            connection.execute(
                """
                UPDATE emergency_alerts
                SET status = 'simulated', recipient_count = ?, delivery_status = 'not_sent_simulation',
                    provider_response = ?, processed_at = ?, updated_at = ?
                WHERE id = ? AND status = 'approved'
                """,
                (
                    count,
                    "Simulation only. No SMS provider was contacted and no messages were sent.",
                    timestamp,
                    timestamp,
                    alert_id,
                ),
            )
            _record_event(connection, alert_id, "simulated", "approved", "simulated", g.demo_role, timestamp)
            row = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
        return jsonify({"success": True, "alert": _alert_dict(row)}), 200
    except ValueError as exc:
        return _error(str(exc), 500)
    except sqlite3.Error:
        logger.exception("Could not process emergency alert simulation")
        return _error("Emergency alert could not be processed.", 500)


@emergency_alerts_bp.post("/alerts/<alert_id>/cancel")
@require_demo_role("admin")
def cancel_emergency_alert(alert_id):
    timestamp = _now()
    try:
        with _database() as connection:
            existing = connection.execute(
                "SELECT status FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
            result = connection.execute(
                """
                UPDATE emergency_alerts
                SET status = 'cancelled', updated_at = ?
                WHERE id = ? AND status IN ('draft', 'approved')
                """,
                (timestamp, alert_id),
            )
            if result.rowcount == 0:
                exists = connection.execute(
                    "SELECT 1 FROM emergency_alerts WHERE id = ?", (alert_id,)
                ).fetchone()
                if exists is None:
                    return _error("Emergency alert not found.", 404)
                return _error("Only draft or approved alerts can be cancelled.", 409)
            _record_event(connection, alert_id, "cancelled", existing["status"], "cancelled", g.demo_role, timestamp)
            row = connection.execute(
                "SELECT * FROM emergency_alerts WHERE id = ?", (alert_id,)
            ).fetchone()
        return jsonify({"success": True, "alert": _alert_dict(row)}), 200
    except sqlite3.Error:
        logger.exception("Could not cancel emergency alert")
        return _error("Emergency alert could not be cancelled.", 500)


@emergency_alerts_bp.get("/recipients")
@require_demo_role("admin")
def list_emergency_recipients():
    try:
        with _database() as connection:
            rows = connection.execute(
                """
                SELECT id, name, phone, state, district, consent, consent_recorded_at, created_at
                FROM emergency_recipients ORDER BY state, district, name
                """
            ).fetchall()
        return jsonify({"success": True, "recipients": [_recipient_dict(row) for row in rows]}), 200
    except sqlite3.Error:
        logger.exception("Could not read emergency recipients")
        return _error("Emergency recipient list is unavailable.", 500)


@emergency_alerts_bp.post("/recipients")
@require_demo_role("admin")
def add_emergency_recipient():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return _error("A JSON request body is required.", 400)
    name = str(payload.get("name", "")).strip()
    phone = str(payload.get("phone", "")).strip()
    state = str(payload.get("state", "")).strip()
    district = str(payload.get("district", "")).strip()
    if not name or len(name) > 100 or not state or len(state) > 100 or not district or len(district) > 100:
        return _error("Name, state and district are required.", 422)
    if not PHONE_PATTERN.fullmatch(phone):
        return _error("Use an Indian mobile number in +91XXXXXXXXXX format.", 422)
    if payload.get("consent") is not True:
        return _error("Recorded recipient consent is required before registration.", 422)

    timestamp = _now()
    try:
        with _database() as connection:
            cursor = connection.execute(
                """
                INSERT INTO emergency_recipients (
                    name, phone, state, district, consent, consent_recorded_at, created_at
                ) VALUES (?, ?, ?, ?, 1, ?, ?)
                """,
                (name, phone, state, district, timestamp, timestamp),
            )
            row = connection.execute(
                """
                SELECT id, name, phone, state, district, consent, consent_recorded_at, created_at
                FROM emergency_recipients WHERE id = ?
                """,
                (cursor.lastrowid,),
            ).fetchone()
        return jsonify({"success": True, "recipient": _recipient_dict(row)}), 201
    except sqlite3.IntegrityError:
        return _error("That phone number is already registered.", 409)
    except sqlite3.Error:
        logger.exception("Could not register emergency recipient")
        return _error("Emergency recipient could not be registered.", 500)


@emergency_alerts_bp.delete("/recipients/<int:recipient_id>")
@require_demo_role("admin")
def delete_emergency_recipient(recipient_id):
    try:
        with _database() as connection:
            result = connection.execute(
                "DELETE FROM emergency_recipients WHERE id = ?", (recipient_id,)
            )
        if result.rowcount == 0:
            return _error("Emergency recipient not found.", 404)
        return jsonify({"success": True, "deleted": True}), 200
    except sqlite3.Error:
        logger.exception("Could not remove emergency recipient")
        return _error("Emergency recipient could not be removed.", 500)
