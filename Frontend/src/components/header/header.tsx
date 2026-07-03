import React, { useState, useEffect } from 'react'; 
import { Link, useMatch, useNavigate } from 'react-router-dom';
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
    const claimTable = async () => {
      if (!urlTableId) return;

      // Every browser gets one persistent, anonymous id. The backend uses
      // this to tell "same guest reloading the page" apart from "a
      // different device scanning this table's QR code" - so a refresh
      // never gets bounced to the error page, but a real second scan does.
      const sessionId = getSessionId();

      try {
        const response = await axios.put(
          `${API_ENDPOINTS.TABLE_BASE}/${urlTableId}/occupy`,
          { sessionId }
        );

        // 200: table is Available -> now occupied by us, or it was already
        // occupied by this exact session (i.e. this is a refresh).
        const tableInDB: RestaurantTable = response.data?.result;
        localStorage.setItem('bakery_table', String(tableInDB?.tableNumber ?? urlTableId));
        setActiveTable(String(tableInDB?.tableNumber ?? urlTableId));
      } catch (error) {
        localStorage.removeItem('bakery_table');
        setActiveTable(null);
        setMenuOpen(false);

        if (axios.isAxiosError(error) && error.response?.status === 409) {
          // Someone else (a different device/session) already holds this table.
          navigate('/ErrorPage', {
            state: {
              title: "Table Unavailable",
              message: `Table ${urlTableId} is currently in use by another customer. Please ask staff for help.`
            },
            replace: true
          });
          return;
        }

        // 404, or any other failure (network, etc.) - table doesn't exist / can't be verified.
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

  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Employee'].includes(user.role);

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
          
        <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>

        <Link
          to={activeTable ? `/MenuPage/${activeTable}` : "/MenuPage"}
          onClick={() => setMenuOpen(false)}
        >
          Menu
        </Link>

        {hasStaffAccess && (
          <Link to="/DashboardPage" className={styles.staffLink} onClick={() => setMenuOpen(false)}>
            Dashboard
          </Link>
        )}

        {hasStaffAccess && (
          <Link to="/TableManagement" className={styles.staffLink} onClick={() => setMenuOpen(false)}>
            Tables
          </Link>
        )}

        <Link to="/ContactUsPage" onClick={() => setMenuOpen(false)}>Contact Us</Link>
        <Link to="/AboutUsPage" onClick={() => setMenuOpen(false)}>About Us</Link>

        <div className={styles.mobileAuthSection}>
          {!user && !activeTable && (
            <div className={styles.authButtons}>
              <Link to="/LoginPage" className={styles.loginLink} onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/RegisterPage" className={styles.signupBtn} onClick={() => setMenuOpen(false)}>Register</Link>
            </div>
          )}

          {user && (
            <div className={styles.actions}>
              <Link to="/SettingsPage" onClick={() => setMenuOpen(false)}>Settings</Link>
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
                <Link to="/SettingsPage">Settings</Link>
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