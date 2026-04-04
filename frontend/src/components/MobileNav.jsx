import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './MobileNav.scss';

const bottomNavItems = [
  { icon: 'home', label: 'Trang chủ', to: '/' },
  { icon: 'content_cut', label: 'Đặt chỗ', to: '/booking' },
  { icon: 'event_note', label: 'Lịch hẹn', to: '/profile' },
  { icon: 'person', label: 'Hồ sơ', to: '/account' },
];

function MobileNav() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/home') return true;
    return location.pathname === path;
  };

  return (
    <nav className="mobile-bottom-nav">
      {bottomNavItems.map((item) => (
        <Link 
          className={`mobile-bottom-nav-item${isActive(item.to) ? ' active' : ''}`} 
          key={item.label} 
          to={item.to}
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default MobileNav;
