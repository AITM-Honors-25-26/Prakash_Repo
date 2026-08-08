import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useMatch, useNavigate } from 'react-router-dom';
import axios from 'axios';

import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

import { API_ENDPOINTS } from '../../constants/constants.js';
import { getSessionId } from '../../utils/session.js';

export interface RestaurantTable {
  _id: string;
  tableNumber: number;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'NotAvailable';
  location: 'Indoor' | 'Outdoor' | 'Window' | 'Balcony';
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const menuMatch = useMatch("/MenuPage/:tableId");
  const urlTableId = menuMatch?.params.tableId;

  const [activeTable, setActiveTable] = useState<string | null>(
    localStorage.getItem('bakery_table')
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState<{
    name: string;
    role: string;
    image?: { url: string }
  } | null>(() => {
    const savedUser = localStorage.getItem('qr_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Error parsing user data", e);
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const savedUser = localStorage.getItem('qr_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    };

    // Keep the header avatar in sync when the profile photo is changed
    window.addEventListener('qr_user_updated', handleUserUpdate);
    return () => window.removeEventListener('qr_user_updated', handleUserUpdate);
  }, []);

  useEffect(() => {
    const claimTable = async () => {
      if (!urlTableId) return;
      const sessionId = getSessionId();

      try {
        const response = await axios.put(
          `${API_ENDPOINTS.TABLE_BASE}/${urlTableId}/occupy`,
          { sessionId }
        );
        const tableInDB: RestaurantTable = response.data?.result;
        localStorage.setItem('bakery_table', String(tableInDB?.tableNumber ?? urlTableId));
        setActiveTable(String(tableInDB?.tableNumber ?? urlTableId));
      } catch (error) {
        localStorage.removeItem('bakery_table');
        setActiveTable(null);
        setMenuOpen(false);

        if (axios.isAxiosError(error) && error.response?.status === 409) {
          navigate('/ErrorPage', {
            state: {
              title: "Table Unavailable",
              message: `Table ${urlTableId} is currently in use by another customer. Please ask staff for help.`
            },
            replace: true
          });
          return;
        }

        navigate('/ErrorPage', {
          state: {
            title: "Table Not Found",
            message: `Table ${urlTableId} is not recognized. Please scan a valid QR code at your table.`
          },
          replace: true
        });
      }
    };

    claimTable();
  }, [urlTableId, navigate]);

  const location = useLocation();
  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Reception', 'Employee'].includes(user.role);
  const isMenuActive = location.pathname.startsWith('/MenuPage');

  const handleLogout = () => {
    localStorage.removeItem('qr_accessToken');
    localStorage.removeItem('qr_refreshToken');
    localStorage.removeItem('qr_user');
    localStorage.removeItem('bakery_table');
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logoLink} onClick={() => setMenuOpen(false)}>
        <img src={logowhite} className={styles.logo} alt="logo" />
      </Link>

      <button
        className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>

        {activeTable && (
          <div className={styles.sidebarTableBadge}>
            Table {activeTable}
          </div>
        )}

        {user && (
          <div className={styles.mobileUserInfo}>
            <img src={user.image?.url || profile} className={styles.profileMobile} alt="Profile" />
            <div className={styles.nameAndRole}>
              <p>{user.name}</p>
              <small>{user.role}</small>
            </div>
          </div>
        )}

        <NavLink
          to="/"
          end
          className={({ isActive }) => isActive ? styles.activeLink : ''}
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>

        <NavLink
          to={activeTable ? `/MenuPage/${activeTable}` : "/MenuPage"}
          className={({ isActive }) => isMenuActive || isActive ? styles.activeLink : ''}
          onClick={() => setMenuOpen(false)}
        >
          Menu
        </NavLink>

        {hasStaffAccess && (
          <NavLink
            to="/DashboardPage"
            className={({ isActive }) => isActive ? styles.activeLink : ''}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
        )}

        {hasStaffAccess && (
          <NavLink
            to="/TableManagement"
            className={({ isActive }) => isActive ? styles.activeLink : ''}
            onClick={() => setMenuOpen(false)}
          >
            Tables
          </NavLink>
        )}

        {user && ['Admin', 'Waiter', 'Reception'].includes(user.role) && (
          <NavLink
            to="/ReceptionBilling"
            className={({ isActive }) => isActive ? styles.activeLink : ''}
            onClick={() => setMenuOpen(false)}
          >
            Billing
          </NavLink>
        )}

        {user?.role === 'Admin' && (
          <NavLink
            to="/StaffManagement"
            className={({ isActive }) => isActive ? styles.activeLink : ''}
            onClick={() => setMenuOpen(false)}
          >
            Staff
          </NavLink>
        )}

        {user?.role === 'Admin' && (
          <NavLink
            to="/BillingSettings"
            className={({ isActive }) => isActive ? styles.activeLink : ''}
            onClick={() => setMenuOpen(false)}
          >
            Billing Setup
          </NavLink>
        )}

        <NavLink
          to="/MembershipPage"
          className={({ isActive }) => isActive ? styles.activeLink : ''}
          onClick={() => setMenuOpen(false)}
        >
          Membership
        </NavLink>

        <NavLink
          to="/ContactUsPage"
          className={({ isActive }) => isActive ? styles.activeLink : ''}
          onClick={() => setMenuOpen(false)}
        >
          Contact Us
        </NavLink>
        <NavLink
          to="/AboutUsPage"
          className={({ isActive }) => isActive ? styles.activeLink : ''}
          onClick={() => setMenuOpen(false)}
        >
          About Us
        </NavLink>

        <div className={styles.mobileAuthSection}>
          {!user && !activeTable && (
            <div className={styles.authButtons}>
              <Link to="/LoginPage" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/RegisterPage" className={styles.signupBtn} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}

          {user && (
            <div className={styles.actions}>
              <Link to="/ProfilePage" onClick={() => setMenuOpen(false)}>My Profile</Link>
              <Link to="/SettingsPage" onClick={() => setMenuOpen(false)}>Settings</Link>
              {user?.role === 'Admin' && (
                <Link to="/Analytics" onClick={() => setMenuOpen(false)}>Analytics</Link>
              )}
              <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

      <div className={styles.authSection}>
        {!user && activeTable && (
          <div className={styles.tableBadge}>
            <span>Table {activeTable}</span>
          </div>
        )}

        {user ? (
          <div className={styles.profileWrapper}>
            <img
              src={user.image?.url || profile}
              className={styles.profile}
              alt="Profile"
            />
            <div className={styles.DropdownBar}>
              <div className={styles.userInfo}>
                <img
                  src={user.image?.url || profile}
                  className={styles.dropdownProfileImg}
                  alt="Profile"
                />
                <div>
                  <p>{user.name}</p>
                  <small className={styles.userRole}>{user.role}</small>
                </div>
              </div>
              <hr />
              <div className={styles.actions}>
                <Link to="/ProfilePage">My Profile</Link>
                <Link to="/SettingsPage">Settings</Link>
                {user?.role === 'Admin' && (
                  <Link to="/Analytics">Analytics</Link>
                )}
                <button className={styles.logoutBtn} onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          !activeTable && (
            <div className={styles.authButtons}>
              <Link to="/LoginPage" className={styles.loginLink}>Login</Link>
              <Link to="/RegisterPage" className={styles.signupBtn}>Register</Link>
            </div>
          )
        )}
      </div>
    </header>
  );
};

export default Header;