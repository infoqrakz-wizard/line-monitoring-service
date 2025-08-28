import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router";
import { Flex } from "@mantine/core";
import classes from "./AppLayout.module.css";
import { useAuthStore } from "@/store/auth";
import monitoringIconUrl from "../../assets/icons/monitoring.svg";
import serversIconUrl from "../../assets/icons/servers.svg";
import usersIconUrl from "../../assets/icons/users.svg";
import mapIconUrl from "../../assets/icons/map.svg";
import dashboardIconUrl from "../../assets/icons/dashboard.svg";
// import groupsIconUrl from "../../assets/icons/groups.svg";
import notificationsIconUrl from "../../assets/icons/notifications.svg";
import settingsIconUrl from "../../assets/icons/settings.svg";
import logoutIconUrl from "../../assets/icons/logout.svg";
import burgerIconUrl from "../../assets/icons/burger.svg";

const AppLayout: React.FC = () => {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainItems = [
    {
      to: "/",
      label: "Дашборд",
      icon: (
        <img
          src={dashboardIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
    {
      to: "/monitoring",
      label: "Мониторинг",
      icon: (
        <img
          src={monitoringIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },

    {
      to: "/servers",
      label: "Серверы",
      icon: (
        <img
          src={serversIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
    {
      to: "/users",
      label: "Пользователи",
      icon: (
        <img
          src={usersIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
    {
      to: "/map",
      label: "Карта",
      icon: (
        <img
          src={mapIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
    // {
    //   to: "/groups",
    //   label: "Группы",
    //   icon: (
    //     <img
    //       src={groupsIconUrl}
    //       className={classes.menuIcon}
    //       width={24}
    //       height={24}
    //       alt=""
    //       aria-hidden="true"
    //     />
    //   ),
    // },
  ];

  const bottomItems = [
    {
      to: "/notifications",
      label: "Уведомления",
      icon: (
        <img
          src={notificationsIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
    {
      to: "/admins",
      label: "Администраторы",
      icon: (
        <img
          src={settingsIconUrl}
          className={classes.menuIcon}
          width={24}
          height={24}
          alt=""
          aria-hidden="true"
        />
      ),
    },
  ];

  const toggleSidebar = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    try {
      void logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      void navigate("/login");
    }
  };

  const handleOverlayClick = () => {
    if (mobileMenuOpen) {
      toggleSidebar();
    }
  };

  const handleNavItemClick = () => {
    if (mobileMenuOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className={classes.wrapper}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className={classes.mobileOverlay}
          onClick={handleOverlayClick}
          aria-label="Close menu"
        />
      )}
      <aside id="app-sidebar" className={`${classes.sidebar}`}>
        <div className={classes.logo} />
        <nav className={classes.menu}>
          <ul className={classes.menuList}>
            {mainItems.map((item) => {
              if (item.to === "/dashboard") {
                return (
                  <li key={item.to} className={classes.menuItem}>
                    <NavLink
                      to={item.to}
                      onClick={handleNavItemClick}
                      key={item.to}
                      className={`${classes.menuButton} ${location.pathname === "/dashboard" ? classes.active : ""}`}
                    >
                      <div className={classes.menuButtonInner}>
                        <div className={classes.menuButtonIcon}>
                          {item.icon}
                        </div>
                        <span
                          className={`${classes.menuText} ${classes.dashboardMenuText}`}
                        >
                          <div className={classes.dashboardMenuTextInner}>
                            <span>{item.label}</span>
                            <div className={classes.dashboardFilter}>
                              <div className={classes.dashboardFilterItem}>
                                <NavLink
                                  className={`${classes.dashboardFilterItemText} ${classes.dashboardFilterItemGreen}`}
                                  to="/dashboard?filter=available"
                                />
                              </div>
                              <div className={classes.dashboardFilterItem}>
                                <NavLink
                                  className={`${classes.dashboardFilterItemText} ${classes.dashboardFilterItemRed}`}
                                  to="/dashboard?filter=unavailable"
                                />
                              </div>
                            </div>
                          </div>
                        </span>
                      </div>
                    </NavLink>
                  </li>
                );
              }
              return (
                <li key={item.to} className={classes.menuItem}>
                  <NavLink
                    to={item.to}
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `${classes.menuButton} ${isActive ? classes.active : ""}`
                    }
                  >
                    <div className={classes.menuButtonInner}>
                      <div className={classes.menuButtonIcon}>{item.icon}</div>
                      <span className={classes.menuText}>{item.label}</span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className={classes.bottomMenu}>
            {bottomItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavItemClick}
                className={({ isActive }) =>
                  `${classes.menuButton} ${isActive ? classes.active : ""}`
                }
              >
                <div className={classes.menuButtonInner}>
                  <div className={classes.menuButtonIcon}>{item.icon}</div>
                  <span className={classes.menuText}>{item.label}</span>
                </div>
              </NavLink>
            ))}
            {/* <Tooltip label="Выйти из аккаунта" position="right" offset={8}> */}
            <button
              className={classes.menuButton}
              onClick={() => {
                handleLogout();
                handleNavItemClick();
              }}
              aria-label="Logout"
            >
              <div className={classes.menuButtonInner}>
                <div className={classes.menuButtonIcon}>
                  <img
                    src={logoutIconUrl}
                    width={24}
                    height={24}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <span className={classes.menuText}>Выйти из аккаунта</span>
              </div>
            </button>
            {/* </Tooltip> */}
          </div>
        </nav>
      </aside>

      <aside
        id="app-mobile-menu"
        className={`${classes.mobileMenuContainer} ${mobileMenuOpen ? classes.mobileMenuOpen : ""}`}
      >
        <nav className={classes.mobileMenu}>
          <ul className={classes.menuList}>
            {mainItems.map((item) => {
              if (item.to === "/dashboard") {
                return (
                  <div key={item.to} className={classes.menuItem}>
                    <div
                      key={item.to}
                      className={`${classes.menuButton} ${location.pathname === "/dashboard" ? classes.active : ""}`}
                    >
                      <div className={classes.menuButtonInner}>
                        <div className={classes.menuButtonIcon}>
                          {item.icon}
                        </div>
                        <span
                          className={`${classes.menuText} ${classes.dashboardMenuText}`}
                        >
                          {item.label}
                          <div className={classes.dashboardFilter}>
                            <div className={classes.dashboardFilterItem}>
                              <NavLink
                                className={classes.dashboardFilterItemText}
                                to="/dashboard?filter=all"
                              >
                                Все
                              </NavLink>
                            </div>
                            <div className={classes.dashboardFilterItem}>
                              <NavLink
                                className={classes.dashboardFilterItemText}
                                to="/dashboard?filter=available"
                              >
                                Доступные
                              </NavLink>
                            </div>
                            <div className={classes.dashboardFilterItem}>
                              <NavLink
                                className={classes.dashboardFilterItemText}
                                to="/dashboard?filter=unavailable"
                              >
                                Недоступные
                              </NavLink>
                            </div>
                          </div>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <li key={item.to} className={classes.menuItem}>
                  <NavLink
                    to={item.to}
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `${classes.menuButton} ${isActive ? classes.active : ""}`
                    }
                  >
                    <div className={classes.menuButtonInner}>
                      <div className={classes.menuButtonIcon}>{item.icon}</div>
                      <span className={classes.menuText}>{item.label}</span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <div className={classes.bottomMenu}>
            {bottomItems.map((item) => {
              return (
                <div key={item.to} className={classes.menuItem}>
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavItemClick}
                    className={({ isActive }) =>
                      `${classes.menuButton} ${isActive ? classes.active : ""}`
                    }
                  >
                    <div className={classes.menuButtonInner}>
                      <div className={classes.menuButtonIcon}>{item.icon}</div>
                      <span className={classes.menuText}>{item.label}</span>
                    </div>
                  </NavLink>
                </div>
              );
            })}
            {/* <Tooltip label="Выйти из аккаунта" position="right" offset={8}> */}
            <button
              className={classes.menuButton}
              onClick={() => {
                handleLogout();
                handleNavItemClick();
              }}
              aria-label="Logout"
            >
              <div className={classes.menuButtonInner}>
                <div className={classes.menuButtonIcon}>
                  <img
                    src={logoutIconUrl}
                    width={24}
                    height={24}
                    alt=""
                    aria-hidden="true"
                  />
                </div>
                <span className={classes.menuText}>Выйти из аккаунта</span>
              </div>
            </button>
            {/* </Tooltip> */}
          </div>
        </nav>
      </aside>

      <header className={classes.header}>
        <div className={classes.logo} aria-label="Logo" />
        <Flex gap={16}>
          <button
            // className={classes.burger}
            // onClick={toggleSidebar}
            type="button"
          >
            <img
              src={notificationsIconUrl}
              width={24}
              height={24}
              alt="Notifications"
            />
          </button>
          <button
            aria-label="Toggle sidebar"
            aria-expanded={mobileMenuOpen}
            aria-controls="app-sidebar"
            className={classes.burger}
            onClick={toggleSidebar}
            type="button"
          >
            <img
              src={burgerIconUrl}
              width={24}
              height={24}
              alt=""
              aria-hidden="true"
            />
          </button>
        </Flex>
      </header>

      <main
        className={`${location.pathname === "/map" ? "" : classes.content}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
