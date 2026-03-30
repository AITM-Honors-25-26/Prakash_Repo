import React from 'react';
import Header from './../header/header';

// In TypeScript, we have to define what type "children" is.
// React.ReactNode means "any valid React content" (text, HTML, or other components).
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
    </div>
  );
};

export default Layout;