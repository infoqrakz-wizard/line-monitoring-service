import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ActionIcon, Tooltip } from '@mantine/core';
import {
  IconBell,
  IconChartHistogram,
  IconFolders,
  IconLogout,
  IconMap2,
  IconServer,
  IconSettings,
  IconUsers
} from '@tabler/icons-react';
import classes from './AppLayout.module.css';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';

const AppLayout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const mainItems = [
    { to: '/', label: 'Мониторинг', icon: <IconChartHistogram size={24} /> },
    { to: '/servers', label: 'Серверы', icon: <IconServer size={24} /> },
    { to: '/users', label: 'Пользователи', icon: <IconUsers size={24} /> },
    { to: '/map', label: 'Карта', icon: <IconMap2 size={24} /> },
    { to: '/groups', label: 'Группы', icon: <IconFolders size={24} /> }
  ];

  const bottomItems = [
    { to: '/notifications', label: 'Уведомления', icon: <IconBell size={24} /> },
    { to: '/settings', label: 'Настройки', icon: <IconSettings size={24} /> }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={classes.wrapper}>
      <aside className={`${classes.sidebar} ${sidebarOpen ? classes.sidebarOpen : ''}`}>
        <div className={classes.logo}>LM</div>
        <nav className={classes.menu}>
          <ul className={classes.menuList}>
            {mainItems.map((item) => (
              <li key={item.to} className={classes.menuItem}>
                <NavLink to={item.to} className={({ isActive }) => `${classes.menuButton} ${isActive ? classes.active : ''}`}>
                  <div className={classes.menuButtonInner}>
                    {item.icon}
                    <span className={classes.menuText}>{item.label}</span>
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className={classes.bottomMenu}>
            {bottomItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `${classes.menuButton} ${isActive ? classes.active : ''}`}>
                <div className={classes.menuButtonInner}>
                  {item.icon}
                  <span className={classes.menuText}>{item.label}</span>
                </div>
              </NavLink>
            ))}
            <Tooltip label="Выйти из аккаунта" position="right" offset={8}>
              <ActionIcon variant="subtle" className={classes.menuButton} onClick={handleLogout} aria-label="Logout">
                <div className={classes.menuButtonInner}>
                  <IconLogout size={24} />
                  <span className={classes.menuText}>Выйти из аккаунта</span>
                </div>
              </ActionIcon>
            </Tooltip>
          </div>
        </nav>
      </aside>

      <header className={classes.header}>
        <button aria-label="Toggle sidebar" className={classes.burger} onClick={toggleSidebar}>
          ☰
        </button>
        <div className={classes.headerBrand}>Line Monitoring Service</div>
      </header>

      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
