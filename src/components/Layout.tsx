import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AppShell, Text, NavLink as MantineNavLink } from '@mantine/core';
import { useUIStore } from '@/store/ui';
import classes from './Layout.module.css';

const Layout: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  const navItems = [
    { to: '/', label: 'Мониторинг', ariaLabel: 'Monitoring' },
    { to: '/servers', label: 'Серверы', ariaLabel: 'Servers' },
    { to: '/users', label: 'Пользователи', ariaLabel: 'Users' },
    { to: '/map', label: 'Карта', ariaLabel: 'Map' },
    { to: '/groups', label: 'Группы', ariaLabel: 'Groups' },
    { to: '/notifications', label: 'Уведомления', ariaLabel: 'Notifications' },
    { to: '/settings', label: 'Настройки', ariaLabel: 'Settings' }
  ];

  return (
    <AppShell
      navbar={{
        width: { base: 200, md: 250, lg: 300 },
        breakpoint: 'sm',
        collapsed: { mobile: !sidebarOpen }
      }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <Text fw={600} size="lg" mb="md">Admin</Text>
        <nav className={classes.nav}>
          {navItems.map((item) => (
            <MantineNavLink
              key={item.to}
              component={NavLink}
              to={item.to}
              label={item.label}
              aria-label={item.ariaLabel}
              active
              variant="filled"
            />
          ))}
        </nav>
      </AppShell.Navbar>
      
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
};

export default Layout;
