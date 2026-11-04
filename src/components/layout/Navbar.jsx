import React, { useState } from 'react';
import {
  Droplets,
  Sun,
  Moon,
  Bell,
  Radio,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Search
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function Navbar({ onToggleMobileNav, isMobileNavOpen, activeRoute, onNavigate }) {
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const {
    activeStation,
    stations,
    setActiveStationId,
    unreadAlertCount,
    liveFeedActive,
    setLiveFeedActive,
    currentUser,
    userRole
  } = useApp();

  const [stationDropdownOpen, setStationDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-3 sm:px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-y-2 mx-auto max-w-[1600px]">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onToggleMobileNav()}
            className="lg:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            aria-label="Toggle Navigation"
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 sm:space-x-3 group text-left"
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-ocean-800 via-ocean-600 to-brand-500 shadow-glass-sm group-hover:shadow-glass-md transition-shadow duration-200 p-2">
              <Droplets className="w-6 h-6 text-cyan-200 group-hover:scale-110 transition-transform duration-300" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300" />
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 via-ocean-600 to-brand-700 dark:from-white dark:via-cyan-200 dark:to-cyan-400 bg-clip-text text-transparent">
                  AquaNet Vision
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-neon border border-cyan-500/20">
                  DL 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight hidden sm:block">
                Water Quality Intelligence
              </p>
            </div>
          </button>
        </div>

        {/* Center: Live Station Switcher & Status */}
        <div className="hidden md:flex md:order-3 md:w-full md:justify-center md:space-x-3 lg:order-2 lg:w-auto">
          {/* Live Feed Ticker Toggle */}
          <button
            onClick={() => setLiveFeedActive(!liveFeedActive)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              liveFeedActive
                ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
            title="Toggle Live Telemetry Simulation"
          >
            <span className="relative flex h-2 w-2">
              {liveFeedActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveFeedActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            </span>
            <span className="font-mono tracking-wide uppercase text-[10px]">
              {liveFeedActive ? 'Live Telemetry' : 'Telemetry Paused'}
            </span>
          </button>

          {/* Station Quick Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setStationDropdownOpen(!stationDropdownOpen)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl glass-card text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-cyan-500/40 transition"
              aria-expanded={stationDropdownOpen}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[160px] truncate">{activeStation.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {stationDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-72 glass-card rounded-2xl p-2 z-50 shadow-glass-lg border border-slate-200/50 dark:border-slate-800/80 max-h-80 overflow-y-auto"
                onMouseLeave={() => setStationDropdownOpen(false)}
              >
                <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200/40 dark:border-slate-800/40">
                  Select Monitoring Node
                </div>
                {stations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveStationId(s.id);
                      setStationDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition ${
                      s.id === activeStation.id
                        ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate font-medium">{s.name}</div>
                      <div className="text-[10px] text-slate-400">{s.type} • {s.region}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      s.status === 'safe'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : s.status === 'moderate'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}>
                      WQI {s.wqi}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Theme, Notifications & User */}
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2.5 md:order-2 md:flex-nowrap md:gap-1.5 lg:order-3 lg:gap-3">
          {/* Quick AI Predict CTA */}
          <button
            onClick={() => onNavigate('predict')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-700 to-ocean-600 text-white font-medium text-xs shadow-glass-sm hover:shadow-glass-md transition-shadow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('aiPredict') || 'AI Predict'}</span>
          </button>

          <button
            onClick={() => onNavigate('india')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-cyan-500/10 transition"
            title="India Overview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>{t('india') || 'India'}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl glass-card text-slate-600 dark:text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-ocean-600" />}
          </button>

          {/* Language Selector */}
          <div className="hidden sm:flex items-center">
            <select
              aria-label={t('language') || 'Language'}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-xs bg-white/70 dark:bg-ocean-900/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 mr-1 text-slate-700 dark:text-slate-300"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="ta">TA</option>
              <option value="te">TE</option>
              <option value="kn">KN</option>
              <option value="ml">ML</option>
              <option value="bn">BN</option>
              <option value="mr">MR</option>
            </select>
          </div>

          {/* Alert Bell */}
          <button
            onClick={() => onNavigate('alerts')}
            className="relative p-2 rounded-xl glass-card text-slate-600 dark:text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition"
            title="View Real-Time Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-2xl glass-card hover:border-cyan-500/40 transition"
              aria-expanded={profileDropdownOpen}
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-ocean-700 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                JS
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden lg:inline-block max-w-[110px] truncate">
                {currentUser.name}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 glass-card rounded-2xl p-3 z-50 shadow-glass-lg border border-slate-200/50 dark:border-slate-800/80 text-left"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="flex items-center space-x-3 mb-2.5 pb-2.5 border-b border-slate-200/40 dark:border-slate-800/40">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ocean-700 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                    JS
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{userRole === 'admin' ? 'Administrator demo role' : 'Analyst demo role'}</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                  {currentUser.institution}
                </p>

                <button
                  onClick={() => {
                    onNavigate('settings');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full text-center py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-cyan-500/20 text-slate-700 dark:text-slate-200 text-xs font-medium transition"
                >
                  Manage Account & Roles
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
