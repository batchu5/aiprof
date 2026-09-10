import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, BarChart3, Shield, Sparkles, X } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Spaces', path: '/spaces', icon: BookOpen },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-100 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Study AI
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border border-indigo-800/30">
            <p className="text-xs font-semibold text-indigo-300">Gemini Flash AI</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active Study Assistant</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
