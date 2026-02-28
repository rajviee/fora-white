import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-th-large' },
  { path: '/tasks', label: 'Task', icon: 'fa-solid fa-clipboard-list' },
  { path: '/chat', label: 'Discussion', icon: 'fa-solid fa-comment-dots' },
  { path: '/reports', label: 'Reports', icon: 'fa-solid fa-file-alt' },
  { path: '/employees', label: 'Employees', icon: 'fa-solid fa-users' },
  { path: '/settings', label: 'Settings', icon: 'fa-solid fa-cog' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/me/userinfo').then(r => setUserInfo(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = userInfo
    ? `${userInfo.firstName?.[0] || ''}${userInfo.lastName?.[0] || ''}`
    : (user?.role?.[0]?.toUpperCase() || 'U');

  return (
    <div className="flex h-screen bg-[#F8FAFC]" data-testid="app-layout">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[200px] bg-primary text-white flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} data-testid="sidebar">
        {/* Logo */}
              <div className="flex items-center justify-center gap-2 px-5 h-16 shrink-0 mt-5 mb-5">
             <img src="/fora-logo-white.svg" alt="Logo"/>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-0.5" data-testid="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} w-5 text-center text-sm`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            data-testid="logout-button"
          >
            <i className="fa-solid fa-right-from-bracket w-5 text-center text-sm" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0 gap-4" data-testid="topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
            data-testid="menu-toggle"
          >
            <i className="fa-solid fa-bars text-lg" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                data-testid="global-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notification bell */}
            <button className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors" data-testid="notification-bell">
              <i className="fa-regular fa-bell text-lg" />
            </button>

            {/* User avatar */}
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-secondary overflow-hidden cursor-pointer" data-testid="user-avatar">
              {userInfo?.avatar?.path ? (
                <img src={userInfo.avatar.path} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
          <Outlet context={{ userInfo }} />
        </main>
      </div>
    </div>
  );
}
