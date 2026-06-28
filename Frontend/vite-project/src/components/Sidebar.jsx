import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Map,
  BarChart3,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Globe,
} from 'lucide-react';
import { NAUTIX_BRAND, DEFAULT_AVATAR } from '../constants/ocean';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat Assistant', path: '/chat', icon: MessageSquare },
    { name: 'Map Explorer', path: '/map', icon: Map },
    { name: 'Ocean Explorer 3D', path: '/ocean-3d', icon: Globe },
    { name: 'Visualizations', path: '/visualizations', icon: BarChart3 },
    { name: 'Query History', path: '/history', icon: History },
    { name: 'Profile Settings', path: '/profile', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`relative h-screen glass-panel border-r border-cyan-500/10 text-slate-200 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-cyan-500/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center p-2 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-cyan-400">
            <Anchor className="h-6 w-6" />
          </div>
          {!collapsed && (
            <span className="font-heading text-xl font-bold tracking-wider text-cyan-400">
              {NAUTIX_BRAND}
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 py-4 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 pl-2.5'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cyan-500/10">
        {!collapsed && user && (
          <NavLink
            to="/profile"
            className="mb-4 flex items-center gap-3 px-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img
              src={user.avatar_url || DEFAULT_AVATAR}
              alt={user.name}
              className="h-9 w-9 rounded-full object-cover border-2 border-cyan-400/30"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3 h-6 w-6 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors duration-200"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default Sidebar;

