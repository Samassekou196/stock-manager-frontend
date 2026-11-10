import React from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

function Layout({ children, user, onLogout }) {
  return (
    <div className="layout">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;