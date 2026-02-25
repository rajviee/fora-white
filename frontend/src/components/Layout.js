import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-pie' },
  { path: '/tasks', label: 'Tasks', icon: 'fa-solid fa-list-check' },
  { path: '/chat', label: 'Chat', icon: 'fa-solid fa-comments' },
  { path: '/attendance', label: 'Attendance', icon: 'fa-solid fa-clock' },
  { path: '/team', label: 'Team', icon: 'fa-solid fa-users' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC]" data-testid="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-60 bg-secondary text-white transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm">F</div>
          <span className="font-semibold text-lg tracking-tight">ForaTask</span>
        </div>

        <nav className="mt-4 px-3 space-y-1" data-testid="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <i className={`${item.icon} w-5 text-center`} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-75 flex items-center justify-center text-sm font-semibold">
              {user?.role?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.role || 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            data-testid="logout-button"
          >
            <i className="fa-solid fa-right-from-bracket w-5 text-center" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 text-gray-600 hover:text-gray-900"
            data-testid="menu-toggle"
          >
            <i className="fa-solid fa-bars text-lg" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
