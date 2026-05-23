import React, { useState, useEffect } from 'react'; 
import { Link, useMatch, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Import your toaster library here
import styles from './header.module.scss';
import profile from './../../../img/profile.png';
import logowhite from './../../../img/log.white.png';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const menuMatch = useMatch("/MenuPage/:tableId");
  const urlTableId = menuMatch?.params.tableId;

  // 1. Change activeTable to state so we can update it after validation
  const [activeTable, setActiveTable] = useState<string | null>(
    localStorage.getItem('bakery_table')
  );

  const [user, setUser] = useState<{ 
    name: string; 
    role: string; 
    image?: { url: string }
  } | null>(() => {
    const savedUser = localStorage.getItem('user');
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

  // 2. Validate the table whenever the URL changes
  useEffect(() => {
    const verifyTable = async () => {
      if (urlTableId) {
        try {
          // Replace this URL with your actual backend API endpoint!
          const response = await fetch(`/api/tables/${urlTableId}`);
          
          if (response.ok) {
            // Table exists in the backend -> Save it
            localStorage.setItem('bakery_table', urlTableId);
            setActiveTable(urlTableId);
          } else {
            // Table does NOT exist -> Show toast and clear invalid data
            toast.error(`Table ${urlTableId} is not available.`);
            localStorage.removeItem('bakery_table');
            setActiveTable(null);
            
            // Optional: Redirect them to the general menu page
            navigate('/MenuPage', { replace: true });
          }
        } catch (error) {
          console.error("Failed to verify table status", error);
          toast.error("Could not verify table. Please try again.");
        }
      }
    };

    verifyTable();
  }, [urlTableId, navigate]); // Rerun if the URL table ID changes

  const hasStaffAccess = user && ['Admin', 'Chef', 'Waiter', 'Employee'].includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('bakery_table'); 
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className={styles.header}>
      <Link to="/">
        <img src={logowhite} className={styles.logo} alt="logo" />
      </Link>
      
      <nav className={styles.navLinks}>
        <Link to="/">Home</Link>
        
        <Link to={activeTable ? `/MenuPage/${activeTable}` : "/MenuPage"}>
          Menu {activeTable && `(Table ${activeTable})`}
        </Link>
        
        {hasStaffAccess && (
          <Link to="/TableManagement" className={styles.staffLink}>
            Tables
          </Link>
        )}

        <Link to="/ContactUsPage">Contact Us</Link>
        <Link to="/AboutUsPage">About Us</Link>
      </nav>

      <div className={styles.authSection}>
        {/* Table badge only shows if NO user is logged in AND a valid table exists */}
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
                <p>{user.name}</p>
                <small className={styles.userRole}>{user.role}</small>
              </div>
              <hr />
              <div className={styles.actions}>
                <Link to="/ProfilePage">Profile</Link>
                <hr />
                <Link to="/SettingsPage">Settings</Link>
                <hr />
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