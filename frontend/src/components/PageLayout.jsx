import React from 'react';
import AppSidebar from './AppSidebar';
import './PageLayout.scss';

function PageLayout({ children }) {
  return (
    <div className="page-layout">
      <AppSidebar />
      <main className="page-layout-content">
        {children}
      </main>
    </div>
  );
}

export default PageLayout;
