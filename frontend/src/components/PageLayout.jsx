import React from 'react';
import AppSidebar from './AppSidebar';
import GlobalTopbar from './GlobalTopbar';
import MobileNav from './MobileNav';
import './PageLayout.scss';

function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <AppSidebar />
      <div className="page-layout-main">
        <GlobalTopbar />
        <main className="page-layout-content">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}

export default PageLayout;
