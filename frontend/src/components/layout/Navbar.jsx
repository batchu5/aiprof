import React from 'react';
import { Menu, Bell, LogOut, User } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userEmail = user?.email || 'user@example.com';
  const fullName = user?.user_metadata?.full_name || userEmail.split('@')[0];
  const initials = getInitials(fullName);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Hamburger for mobile */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-medium text-slate-400">Welcome back,</h2>
          <p className="text-base font-semibold text-slate-100">{fullName}</p>
        </div>
      </div>

      {/* Right section: Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-800"></div>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-indigo-500/20">
            {initials}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-2 p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
