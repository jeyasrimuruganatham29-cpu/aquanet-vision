import os
import re
import sqlite3
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from backend.app import app
from backend import emergency_alerts


ADMIN = {"X-AquaNet-Demo-Role": "admin"}
ANALYST = {"X-AquaNet-Demo-Role": "analyst"}
TEST_PHONE_PATTERN = re.compile(r"^TEST-RECIPIENT-\d{3}$")


class EmergencyAlertApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.previous_database_path = os.environ.get("AQUANET_EMERGENCY_DB_PATH")
        os.environ["AQUANET_EMERGENCY_DB_PATH"] = os.path.join(self.temp_dir.name, "alerts.sqlite3")
        self.client = app.test_client()

    def tearDown(self):
        if self.previous_database_path is None:
            os.environ.pop("AQUANET_EMERGENCY_DB_PATH", None)
        else:
            os.environ["AQUANET_EMERGENCY_DB_PATH"] = self.previous_database_path

    def add_recipient(self, phone="TEST-RECIPIENT-001"):
        with patch.object(emergency_alerts, "PHONE_PATTERN", TEST_PHONE_PATTERN):
            return self.client.post(
                "/api/v1/emergency/recipients",
                headers=ADMIN,
                json={
                    "name": "Test recipient",
                    "phone": phone.strip(),
                    "state": "Tamil Nadu",
                    "district": "Chennai",
                    "consent": True,
                },
            )

    def create_draft(self, role_headers=ANALYST, overrides=None):
        payload = {
            "title": "Test water-quality warning",
            "emergency_type": "contamination",
            "severity": "warning",
            "state": "Tamil Nadu",
            "district": "Chennai",
            "water_body": "Cooum River",
            "message": "Test warning: follow verified local authority guidance.",
            "precautions": "Use official advisories and avoid affected water.",
        }
        payload.update(overrides or {})
        response = self.client.post(
            "/api/v1/emergency/alerts",
            headers=role_headers,
            json=payload,
        )
        self.assertEqual(response.status_code, 201)
        return response.get_json()["alert"]

    def test_role_required_and_analyst_cannot_access_recipients_or_approve(self):
        self.assertEqual(self.client.get("/api/v1/emergency/alerts").status_code, 401)
        self.assertEqual(self.client.get("/api/v1/emergency/recipients", headers=ANALYST).status_code, 403)
        self.assertEqual(
            self.client.post("/api/v1/emergency/recipients", headers=ANALYST, json={}).status_code,
            403,
        )
        draft = self.create_draft()
        response = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/approve",
            headers=ANALYST,
            json={"verified": True},
        )
        self.assertEqual(response.status_code, 403)

    def test_alert_details_edit_expiry_and_persisted_history(self):
        draft = self.create_draft()
        self.assertEqual(draft["title"], "Test water-quality warning")
        self.assertEqual(draft["water_body"], "Cooum River")

        details = self.client.get(
            f"/api/v1/emergency/alerts/{draft['id']}", headers=ANALYST
        ).get_json()
        self.assertEqual(details["status_history"][0]["event_type"], "created")

        denied_edit = self.client.patch(
            f"/api/v1/emergency/alerts/{draft['id']}", headers=ANALYST,
            json={"title": "Changed title"},
        )
        self.assertEqual(denied_edit.status_code, 403)

        edited = self.client.patch(
            f"/api/v1/emergency/alerts/{draft['id']}", headers=ADMIN,
            json={"title": "Updated river warning", "severity": "high"},
        )
        self.assertEqual(edited.status_code, 200)
        self.assertEqual(edited.get_json()["alert"]["title"], "Updated river warning")
        self.assertEqual(edited.get_json()["alert"]["severity"], "high")

        past_expiry = self.client.post(
            "/api/v1/emergency/alerts", headers=ADMIN,
            json={
                "title": "Expired warning", "emergency_type": "water_contamination",
                "severity": "critical", "state": "Tamil Nadu", "district": "Chennai",
                "message": "Avoid the affected water.", "precautions": "Follow local guidance.",
                "expires_at": "2000-01-01T00:00:00Z",
            },
        )
        self.assertEqual(past_expiry.status_code, 422)

        history = self.client.get(
            f"/api/v1/emergency/alerts/{draft['id']}", headers=ADMIN
        ).get_json()["status_history"]
        self.assertEqual([event["event_type"] for event in history], ["created", "edited"])

    def test_legacy_draft_request_shape_remains_supported(self):
        response = self.client.post(
            "/api/v1/emergency/alerts",
            headers=ANALYST,
            json={
                "emergency_type": "contamination",
                "severity": "warning",
                "state": "Tamil Nadu",
                "district": "Chennai",
                "message": "Legacy API request.",
                "precautions": "Follow local authority guidance.",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["alert"]["title"], "Contamination alert")

    def test_existing_database_is_upgraded_and_legacy_history_is_marked_truthfully(self):
        legacy_path = os.path.join(self.temp_dir.name, "legacy.sqlite3")
        connection = sqlite3.connect(legacy_path)
        connection.execute(
            """
            CREATE TABLE emergency_alerts (
                id TEXT PRIMARY KEY, emergency_type TEXT NOT NULL, severity TEXT NOT NULL,
                state TEXT NOT NULL, district TEXT NOT NULL, message TEXT NOT NULL,
                precautions TEXT NOT NULL, status TEXT NOT NULL, created_by_role TEXT NOT NULL,
                created_at TEXT NOT NULL, approved_by_role TEXT, approved_at TEXT,
                verified_by_role TEXT, verified_at TEXT, recipient_count INTEGER NOT NULL DEFAULT 0,
                delivery_status TEXT, provider_response TEXT, processed_at TEXT, updated_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            INSERT INTO emergency_alerts (
                id, emergency_type, severity, state, district, message, precautions,
                status, created_by_role, created_at, approved_by_role, approved_at,
                verified_by_role, verified_at, updated_at
            ) VALUES ('legacy-1', 'contamination', 'warning', 'approved', 'Tamil Nadu', 'Notice',
                'Avoid contact', 'approved', 'analyst', '2026-10-28T10:00:00+00:00',
                'admin', '2026-10-28T10:05:00+00:00', 'admin', '2026-10-28T10:05:00+00:00',
                '2026-10-28T10:05:00+00:00')
            """
        )
        connection.commit()
        connection.close()
        os.environ["AQUANET_EMERGENCY_DB_PATH"] = legacy_path

        response = self.client.get("/api/v1/emergency/alerts/legacy-1", headers=ANALYST)
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(result["alert"]["title"], "")
        self.assertIsNone(result["alert"]["water_body"])
        self.assertEqual(
            [event["event_type"] for event in result["status_history"]],
            ["created", "approved"],
        )

    def test_expired_alert_preview_cannot_be_simulated(self):
        self.assertEqual(self.add_recipient().status_code, 201)
        expiry = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        expired_draft = self.create_draft(ADMIN, {"expires_at": expiry})
        connection = sqlite3.connect(os.environ["AQUANET_EMERGENCY_DB_PATH"])
        connection.execute(
            "UPDATE emergency_alerts SET expires_at = ? WHERE id = ?",
            ("2000-01-01T00:00:00+00:00", expired_draft["id"]),
        )
        connection.commit()
        connection.close()
        expired_approval = self.client.post(
            f"/api/v1/emergency/alerts/{expired_draft['id']}/approve",
            headers=ADMIN,
            json={"verified": True},
        )
        self.assertEqual(expired_approval.status_code, 409)

        draft = self.create_draft(ADMIN, {"expires_at": expiry})
        approved = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/approve",
            headers=ADMIN,
            json={"verified": True},
        )
        self.assertEqual(approved.status_code, 200)

        connection = sqlite3.connect(os.environ["AQUANET_EMERGENCY_DB_PATH"])
        connection.execute(
            "UPDATE emergency_alerts SET expires_at = ? WHERE id = ?",
            ("2000-01-01T00:00:00+00:00", draft["id"]),
        )
        connection.commit()
        connection.close()

        preview = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/preview", headers=ADMIN, json={}
        ).get_json()
        self.assertTrue(preview["expired"])
        response = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/send",
            headers=ADMIN,
            json={
                "confirmed": True,
                "confirmed_message": draft["message"],
                "confirmed_recipient_count": 1,
            },
        )
        self.assertEqual(response.status_code, 409)

    def test_preview_confirmation_simulation_and_duplicate_send_safeguard(self):
        self.assertEqual(self.add_recipient().status_code, 201)
        draft = self.create_draft()
        preview = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/preview", headers=ANALYST, json={}
        ).get_json()
        self.assertEqual(preview["recipient_count"], 1)

        missing_verification = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/approve", headers=ADMIN, json={}
        )
        self.assertEqual(missing_verification.status_code, 400)
        approved = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/approve",
            headers=ADMIN,
            json={"verified": True},
        )
        self.assertEqual(approved.status_code, 200)

        no_confirmation = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/send",
            headers=ADMIN,
            json={},
        )
        self.assertEqual(no_confirmation.status_code, 400)

        changed_count = self.add_recipient("TEST-RECIPIENT-002")
        self.assertEqual(changed_count.status_code, 201)
        stale_confirmation = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/send",
            headers=ADMIN,
            json={
                "confirmed": True,
                "confirmed_message": draft["message"],
                "confirmed_recipient_count": 1,
            },
        )
        self.assertEqual(stale_confirmation.status_code, 409)

        fresh_preview = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/preview", headers=ADMIN, json={}
        ).get_json()
        simulated = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/send",
            headers=ADMIN,
            json={
                "confirmed": True,
                "confirmed_message": fresh_preview["message"],
                "confirmed_recipient_count": fresh_preview["recipient_count"],
            },
        )
        self.assertEqual(simulated.status_code, 200)
        result = simulated.get_json()["alert"]
        self.assertEqual(result["status"], "simulated")
        self.assertEqual(result["delivery_status"], "not_sent_simulation")
        self.assertIn("no messages were sent", result["provider_response"])
        details = self.client.get(
            f"/api/v1/emergency/alerts/{draft['id']}", headers=ANALYST
        ).get_json()
        self.assertEqual(
            [event["event_type"] for event in details["status_history"]],
            ["created", "approved", "simulated"],
        )
        duplicate = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/send",
            headers=ADMIN,
            json={
                "confirmed": True,
                "confirmed_message": fresh_preview["message"],
                "confirmed_recipient_count": fresh_preview["recipient_count"],
            },
        )
        self.assertEqual(duplicate.status_code, 409)

        analyst_history = self.client.get("/api/v1/emergency/alerts", headers=ANALYST).get_json()
        self.assertNotIn("phone", analyst_history["alerts"][0])

    def test_live_sms_mode_is_rejected_without_sending(self):
        self.assertEqual(self.add_recipient().status_code, 201)
        draft = self.create_draft(ADMIN)
        self.assertEqual(
            self.client.post(
                f"/api/v1/emergency/alerts/{draft['id']}/approve",
                headers=ADMIN,
                json={"verified": True},
            ).status_code,
            200,
        )
        previous_mode = os.environ.get("AQUANET_SMS_MODE")
        os.environ["AQUANET_SMS_MODE"] = "live"
        try:
            response = self.client.post(
                f"/api/v1/emergency/alerts/{draft['id']}/send",
                headers=ADMIN,
                json={
                    "confirmed": True,
                    "confirmed_message": draft["message"],
                    "confirmed_recipient_count": 1,
                },
            )
        finally:
            if previous_mode is None:
                os.environ.pop("AQUANET_SMS_MODE", None)
            else:
                os.environ["AQUANET_SMS_MODE"] = previous_mode
        self.assertEqual(response.status_code, 503)

    def test_recipient_consent_validation_and_no_matching_area(self):
        with patch.object(emergency_alerts, "PHONE_PATTERN", TEST_PHONE_PATTERN):
            denied = self.client.post(
                "/api/v1/emergency/recipients",
                headers=ADMIN,
                json={
                    "name": "No consent",
                    "phone": "TEST-RECIPIENT-001",
                    "state": "Tamil Nadu",
                    "district": "Chennai",
                    "consent": False,
                },
            )
        self.assertEqual(denied.status_code, 422)
        self.assertEqual(self.add_recipient("123").status_code, 422)
        draft = self.create_draft()
        preview = self.client.post(
            f"/api/v1/emergency/alerts/{draft['id']}/preview", headers=ADMIN, json={}
        ).get_json()
        self.assertEqual(preview["recipient_count"], 0)

    def test_recipient_phone_numbers_are_masked_in_api_responses(self):
        added = self.add_recipient()
        self.assertEqual(added.get_json()["recipient"]["phone"], "TES******-001")
        listed = self.client.get("/api/v1/emergency/recipients", headers=ADMIN)
        self.assertEqual(listed.get_json()["recipients"][0]["phone"], "TES******-001")

    def test_existing_dataset_and_telemetry_write_routes_require_admin_demo_role(self):
        self.assertEqual(
            self.client.post("/api/v1/datasets/upload", headers=ANALYST).status_code,
            403,
        )
        self.assertEqual(
            self.client.post("/api/v1/telemetry/ingest", headers=ANALYST, json={}).status_code,
            403,
        )
        self.assertEqual(
            self.client.post("/api/v1/telemetry/ingest", json={}).status_code,
            401,
        )


if __name__ == "__main__":
    unittest.main()
