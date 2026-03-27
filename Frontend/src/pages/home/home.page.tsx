import styles from './homepage.module.css';

const Homepage = () => {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>🍴 Resto<span>Flow</span></div>
        <ul className={styles.navLinks}>
          <li><a href="#menu">Digital Menu</a></li>
          <li><a href="#dashboard">Dashboard</a></li>
          <li><a href="#orders">Live Orders</a></li>
        </ul>
        <button className={styles.loginBtn}>Staff Login</button>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Smart Dining <br />Starts with a <span className={styles.accent}>QR Code</span></h1>
          <p className={styles.subtitle}>
            Revolutionize your restaurant experience. Real-time menu updates, 
            instant ordering, and seamless kitchen management.
          </p>
          <div className={styles.btnGroup}>
            <button className={styles.primary}>View Live Menu</button>
            <button className={styles.secondary}>Manage Tables</button>
          </div>
        </div>
      </header>

      {/* Quick Stats / Management Overview */}
      <section id="dashboard" className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.icon}>📋</span>
          <h4>Active Orders</h4>
          <p className={styles.statNumber}>12</p>
        </div>
        <div className={styles.statCard}>
          <span className={styles.icon}>🪑</span>
          <h4>Occupied Tables</h4>
          <p className={styles.statNumber}>8 / 20</p>
        </div>
        <div className={styles.statCard}>
          <span className={styles.icon}>💰</span>
          <h4>Today's Sales</h4>
          <p className={styles.statNumber}>Rs. 14,500</p>
        </div>
      </section>

      {/* Features Specific to Restaurant Management */}
      <section className={styles.features}>
        <div className={styles.featureItem}>
          <h3>QR Code Generator</h3>
          <p>Automatically generate unique QR codes for every table in your restaurant.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>Kitchen Display System</h3>
          <p>Orders fly straight from the customer's phone to your chef's screen.</p>
        </div>
        <div className={styles.featureItem}>
          <h3>Inventory Tracking</h3>
          <p>Get notified when ingredients for your best-selling dishes are running low.</p>
        </div>
      </section>
    </div>
  );
};

export default Homepage;