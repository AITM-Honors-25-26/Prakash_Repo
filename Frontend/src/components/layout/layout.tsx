import React from 'react';
import Header from './../header/header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../Footer/footer';

interface LayoutProps {
  children: React.ReactNode;
}
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div>
      <Header />
      <main>
        {children}
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
      <Footer />
    </div>
  );
};
export default Layout;


// import React from 'react';
// import Header from './../header/header';
// import ProfileBar from '../ProfileBar/profilebar'; 
// import { ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import Footer from '../Footer/footer';
// import styles from './layout.module.scss'; 

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   return (
//     <div className={styles.layoutWrapper}>
//       <Header />
//       <div className={styles.layoutBody}>
//         <aside className={styles.sidebarSection}>
//           <ProfileBar />
//         </aside>

//         <main className={styles.mainContent}>
//           <div className={styles.container}>
//             {children}
//           </div>
//         </main>
//       </div>

//       <ToastContainer position="top-right" autoClose={3000} />
//       <Footer />
//     </div>
//   );
// };

// export default Layout;