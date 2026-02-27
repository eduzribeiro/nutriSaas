
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Menu, X, Apple } from 'lucide-react';
import { useAuth } from '../src/context';
import { MENU_ITEMS, COLORS } from '../constants';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!user) return null;

  const menu = MENU_ITEMS[user.role] || [];

  return (
    <div className="min-h-screen flex print:block print:bg-white">
      {/* Sidebar Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className={`w-10 h-10 bg-${COLORS.primary} rounded-lg flex items-center justify-center text-white`}>
              <Apple size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800">NutriSaaS</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? `bg-${COLORS.accent} text-${COLORS.primary} font-medium`
                    : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase">
                {user.profile.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.profile.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 print:bg-white print:overflow-visible print:block">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 md:hidden print:hidden">
          <div className="flex items-center gap-3">
            <Apple size={24} className={`text-${COLORS.primary}`} />
            <span className="font-bold text-slate-800">NutriSaaS</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          <div className="max-w-7xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none print:w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;
