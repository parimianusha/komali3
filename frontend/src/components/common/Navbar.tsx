// ==============================================================================
// AgriSage AI: Main Navigation Bar with Multilingual & Demo Mode Controls
// ==============================================================================

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  Tractor,
  Sparkles,
  Bug,
  Compass,
  FileText,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  Database,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiClient } from '../../lib/apiClient';
import { SupportedLanguage } from '../../shared/agriculture';

export const Navbar: React.FC = () => {
  const { user, signOut, token, isDemoMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast({
        type: 'info',
        title: 'Signed Out',
        message: 'You have been safely signed out.',
      });
      navigate('/login');
    } catch {
      showToast({
        type: 'error',
        title: 'Sign Out Error',
        message: 'Failed to sign out properly.',
      });
    }
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await apiClient.post<any>('/demo/load', {}, token);
      showToast({
        type: 'success',
        title: 'Demo Records Loaded!',
        message:
          res.data?.message ||
          'Loaded Krishna Valley Organic Farm, Chilli & Cotton crops, Chilli Thrips diagnosis, and Soil Health Card!',
      });
      // Navigate to dashboard or reload state
      if (location.pathname === '/') {
        window.location.reload();
      } else {
        navigate('/');
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Load Demo Data',
        message: err.message || 'Could not load sample records.',
      });
    } finally {
      setLoadingDemo(false);
    }
  };

  const navLinks = [
    { label: t('nav_dashboard'), path: '/', icon: LayoutDashboard },
    { label: t('nav_farms'), path: '/farms', icon: Tractor },
    { label: t('nav_advisory'), path: '/advisory', icon: Sparkles },
    { label: t('nav_diagnosis'), path: '/pest-diagnosis', icon: Bug },
    { label: t('nav_suitability'), path: '/crop-suitability', icon: Compass },
    { label: t('nav_documents'), path: '/documents', icon: FileText },
    { label: t('nav_history'), path: '/history', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-900/40 bg-slate-950/90 backdrop-blur-xl">
      {/* College Hackathon Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-800/30 text-emerald-200 text-xs py-1 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
              {t('demo_badge')}
            </span>
            <span className="hidden sm:inline text-slate-300 text-[11px]">
              AI-Powered Agriculture Decision Support & Intelligent Document Processor
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 transition-colors disabled:opacity-50"
              title="Loads sample farm, crops, disease diagnosis & soil health card for instant demonstration"
            >
              {loadingDemo ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              ) : (
                <Database className="w-3 h-3 text-emerald-400" />
              )}
              <span>{t('load_demo_btn')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white hover:opacity-95 transition-opacity focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-white flex items-center gap-1.5">
                AgriSage <span className="text-emerald-400 font-semibold">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Crop Advisory & IDP
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Controls (Language, Settings, Sign Out) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  language === 'te'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                తెలుగు
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-1 rounded-lg font-medium transition-colors ${
                  language === 'hi'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* Settings link */}
            <Link
              to="/settings"
              title={t('nav_settings')}
              className={`p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors ${
                location.pathname === '/settings' ? 'text-emerald-400 bg-slate-900' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* User & Sign Out */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="text-xs text-slate-300 font-medium max-w-[120px] truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  title={t('nav_sign_out')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile language switch */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select preferred language"
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="en">EN</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिन्दी</option>
            </select>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path);

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900"
          >
            <Settings className="w-4 h-4" />
            <span>{t('nav_settings')}</span>
          </Link>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleSignOut();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('nav_sign_out')}</span>
          </button>
        </div>
      )}
    </header>
  );
};
