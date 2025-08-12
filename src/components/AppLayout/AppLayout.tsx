import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ActionIcon, Flex, Tooltip } from '@mantine/core';
import {
  IconBell,
  IconChartHistogram,
  IconFolders,
  IconLogout,
  IconMap2,
  IconNotification,
  IconServer,
  IconSettings,
  IconUsers
} from '@tabler/icons-react';
import classes from './AppLayout.module.css';
import { useUIStore } from '@/store/ui';
import { useAuthStore } from '@/store/auth';

const AppLayout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
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
    { to: '/settings', label: 'Настройки аккаунта', icon: <IconSettings size={24} /> }
  ];

  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOverlayClick = () => {
    if (sidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className={classes.wrapper}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className={classes.mobileOverlay} 
          onClick={handleOverlayClick}
          aria-label="Close menu"
        />
      )}
      <aside className={`${classes.sidebar} ${sidebarOpen ? classes.sidebarOpen : ''}`}>
        <div className={classes.logo} />
        <nav className={classes.menu}>
          <ul className={classes.menuList}>
            {mainItems.map((item) => (
              <li key={item.to} className={classes.menuItem}>
                <NavLink to={item.to} className={({ isActive }) => `${classes.menuButton} ${isActive ? classes.active : ''}`}>
                  <div className={classes.menuButtonInner}>
                    <div className={classes.menuButtonIcon}>{item.icon}</div>
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
                  <div className={classes.menuButtonIcon}>{item.icon}</div>
                  <span className={classes.menuText}>{item.label}</span>
                </div>
              </NavLink>
            ))}
            {/* <Tooltip label="Выйти из аккаунта" position="right" offset={8}> */}
              <button className={classes.menuButton} onClick={handleLogout} aria-label="Logout">
                <div className={classes.menuButtonInner}>
                  <div className={classes.menuButtonIcon}>
                    <div className={classes.menuButtonIcon}>
                      <IconLogout size={24} />
                    </div>
                  </div>
                  <span className={classes.menuText}>Выйти из аккаунта</span>
                </div>
              </button>
            {/* </Tooltip> */}
          </div>
        </nav>
      </aside>
      <header className={classes.header}>
        <div className={classes.headerBrand}>Line Monitoring Service</div>
        <Flex>
          <IconNotification size={24} />
          <button aria-label="Toggle sidebar" className={classes.burger} onClick={toggleSidebar}>
            ☰
          </button>
        </Flex>
      </header>

      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
