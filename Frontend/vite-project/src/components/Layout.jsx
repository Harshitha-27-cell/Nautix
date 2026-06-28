import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import OceanBackground from './ocean/OceanBackground';
import DolphinMascot from './ocean/DolphinMascot';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_AVATAR } from '../constants/ocean';

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard Overview';
      case '/chat': return 'AI Chat Assistant';
      case '/map': return 'Geographical Map Explorer';
      case '/ocean-3d': return 'Ocean Explorer 3D';
      case '/visualizations': return 'Data Visualization Dashboard';
      case '/history': return 'Query & Audit History';
      case '/profile': return 'Profile Settings';
      default: return 'Nautix';
    }
  };

  const avatarSrc = user?.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-[#070d19] text-slate-100 font-sans">
      <OceanBackground density="light" />

      <div className="hidden md:flex shrink-0 relative z-10">
        <Sidebar />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="relative flex w-full max-w-xs animate-fade-in">
            <Sidebar />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-cyan-500/10 glass-panel px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700 md:hidden cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-heading text-lg md:text-xl font-semibold text-slate-100">
              {getPageTitle(location.pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              API Connected
            </span>
            <div className="h-8 w-px bg-slate-700/50" />
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group"
              title="Profile Settings"
            >
              <img
                src={avatarSrc}
                alt={user?.name || 'Profile'}
                className="h-9 w-9 rounded-full object-cover border-2 border-cyan-400/40 group-hover:border-cyan-400 transition-colors"
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
              <span className="hidden md:inline text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                {user?.name}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      <DolphinMascot />
    </div>
  );
};

export default Layout;

