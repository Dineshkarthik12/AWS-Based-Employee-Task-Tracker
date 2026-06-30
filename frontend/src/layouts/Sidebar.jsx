import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  HiOutlineViewGrid,
  HiOutlineClipboardList,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUserCircle,
} from 'react-icons/hi';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManager = user?.role === 'Manager';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const managerLinks = [
    { to: '/manager/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/manager/assign-task', icon: HiOutlinePlusCircle, label: 'Assign Task' },
    { to: '/manager/tasks', icon: HiOutlineClipboardList, label: 'Tasks' },
  ];

  const employeeLinks = [
    { to: '/employee/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/employee/tasks', icon: HiOutlineClipboardList, label: 'My Tasks' },
  ];

  const links = isManager ? managerLinks : employeeLinks;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-200">
              <HiOutlineClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">TaskTracker</h1>
              <p className="text-xs text-slate-400 font-medium">Employee Management</p>
            </div>
            <button
              className="ml-auto lg:hidden text-slate-400 hover:text-slate-600"
              onClick={() => setSidebarOpen(false)}
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <p className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </p>
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`
                }
              >
                <link.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="px-4 py-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.role || 'Employee'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 mt-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-danger-50 hover:text-danger-600 transition-all duration-200"
            >
              <HiOutlineLogout className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 lg:px-8">
          <button
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
              <HiOutlineUserCircle className="w-4 h-4" />
              <span>{user?.role}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
