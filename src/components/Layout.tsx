import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useUIStore } from '@/store/ui';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-200' : 'hover:bg-gray-100'}`;

const Layout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className={`col-span-12 md:col-span-3 lg:col-span-2 border-r ${sidebarOpen ? '' : 'hidden md:block'}`}>
        <div className="p-4 font-semibold">Admin</div>
        <nav className="flex flex-col gap-1 p-2">
          <NavLink to="/" className={navLinkClass} aria-label="Monitoring">Мониторинг</NavLink>
          <NavLink to="/servers" className={navLinkClass} aria-label="Servers">Серверы</NavLink>
          <NavLink to="/users" className={navLinkClass} aria-label="Users">Пользователи</NavLink>
          <NavLink to="/map" className={navLinkClass} aria-label="Map">Карта</NavLink>
          <NavLink to="/groups" className={navLinkClass} aria-label="Groups">Группы</NavLink>
          <NavLink to="/notifications" className={navLinkClass} aria-label="Notifications">Уведомления</NavLink>
          <NavLink to="/settings" className={navLinkClass} aria-label="Settings">Настройки</NavLink>
        </nav>
      </aside>
      <main className="col-span-12 md:col-span-9 lg:col-span-10">
        <header className="flex items-center justify-between border-b p-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="px-2 py-1 border rounded"
          >
            ☰
          </button>
          <div className="text-sm text-gray-500">Line Monitoring Service</div>
        </header>
        <div className="p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
