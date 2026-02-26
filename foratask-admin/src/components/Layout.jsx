import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Building2, CreditCard, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-[200px] bg-[#1360C6] text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-4 h-16 flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="ForaTask" className="h-8 w-auto brightness-0 invert" />
          </div>

          <nav className="flex-1 px-3 mt-2 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 mt-auto border-t border-white/10">
            <div className="px-3 py-2 mb-2">
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
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3 text-gray-600 hover:text-gray-900">
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-secondary lg:hidden">ForaTask Admin</h1>
          <div className="flex-1" />
        </header>

        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
