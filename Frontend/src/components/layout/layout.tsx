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
      {/* The Header stays at the top of every page */}
      <Header />
      
      {/* The page content gets injected here */}
      <main>
        {children}
      </main>

      {/* You could even add a reusable Footer here! */}
    </div>
  );
};

export default Layout;