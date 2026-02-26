import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Building2, CreditCard, LogOut, Menu } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Layout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/companies', icon: Building2, label: 'Companies' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]" data-testid="admin-layout">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[200px] bg-primary text-white flex flex-col transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} data-testid="admin-sidebar">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 shrink-0">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <span className="font-bold text-base">ForaTask</span>
            <span className="text-white/60 text-[10px] block -mt-0.5">Admin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-0.5" data-testid="admin-sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.path) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section at bottom */}
        <div className="p-3 mt-auto border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-white truncate">{admin?.firstName} {admin?.lastName}</p>
            <p className="text-xs text-white/60 truncate">{admin?.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            data-testid="logout-btn"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0 gap-4" data-testid="admin-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
            data-testid="admin-menu-toggle"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1">
            <h2 className="text-base font-semibold text-secondary hidden sm:block">
              {location.pathname === '/' ? 'Dashboard' :
               location.pathname.startsWith('/companies') ? 'Companies' :
               location.pathname.startsWith('/payments') ? 'Payments' : ''}
            </h2>
          </div>

          {/* Admin info */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-sm font-semibold text-primary">
              {admin?.firstName?.[0] || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
