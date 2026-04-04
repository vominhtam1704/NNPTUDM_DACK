import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AppSidebar.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCD1VZI9vpwZKFSj9GOgeEek9r7CCKhjRA3qHB3y3PBjWxXEjsbXe3RFR6QWaLaVNOpQNQBQ7QBUAZnyze7yEAWMzf-VA6A9OG-S5kCO-c2SBRd-E2shWgZcZPpMaaE0as_UTEQBn9K5lt2hZYrHTpCMCUDlTLn9F0_Nub0iIbNUYxLFu0Jejh3wXdcY3VWXreY54O9k1jl-f4Re874BT-7v2XJjpR1VcxmUpLR0fDwlSJlxJpp76spU4TuG62kQLfiPGniBRZTbwQ';

const navItems = [
  { icon: 'home', label: 'Trang chu', to: '/' },
  { icon: 'content_cut', label: 'Dat cho', to: '/booking' },
  { icon: 'event_note', label: 'Lich hen', to: '/profile' },
  { icon: 'person', label: 'Ho so', to: '/account' },
];

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="app-sidebar">
      {/* Profile Header */}
      <div className="sidebar-profile" onClick={() => navigate('/account')} style={{ cursor: 'pointer' }}>
        <div className="profile-avatar">
          <img alt={user?.name || 'User'} src={user?.avatar || fallbackAvatar} />
        </div>
        <div className="profile-info">
          <h3>{user?.name || 'The Atelier'}</h3>
          <p className="role-badge">Premium Management</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            className={`sidebar-nav-item${isActive(item.to) ? ' active' : ''}`}
            key={item.to}
            to={item.to}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="sidebar-footer">
        <Link className="sidebar-footer-btn" to="/account">
          <span className="material-symbols-outlined">person</span>
          <span>Thong tin tai khoan</span>
        </Link>
        <Link className="sidebar-footer-btn" to="/profile">
          <span className="material-symbols-outlined">reviews</span>
          <span>Lich hen cua toi</span>
        </Link>
      </div>
    </aside>
  );
}

export default AppSidebar;
