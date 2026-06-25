import React from 'react';
import Header from './../header/header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from '../Footer/footer';
import FloatingCart from '../FloatingCart/FloatingCart.page';

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
      <FloatingCart />
      <Footer />
    </div>
  );
};
export default Layout;

