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