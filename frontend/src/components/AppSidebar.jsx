import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AppSidebar.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCD1VZI9vpwZKFSj9GOgeEek9r7CCKhjRA3qHB3y3PBjWxXEjsbXe3RFR6QWaLaVNOpQNQBQ7QBUAZnyze7yEAWMzf-VA6A9OG-S5kCO-c2SBRd-E2shWgZcZPpMaaE0as_UTEQBn9K5lt2hZYrHTpCMCUDlTLn9F0_Nub0iIbNUYxLFu0Jejh3wXdcY3VWXreY54O9k1jl-f4Re874BT-7v2XJjpR1VcxmUpLR0fDwlSJlxJpp76spU4TuG62kQLfiPGniBRZTbwQ';

const getNavItems = (role) => {
  const common = [
    { icon: 'home', label: 'Trang chủ', to: '/home' },
    { icon: 'groups', label: 'Thợ cắt tóc', to: '/barbers' },
  ];

  if (role === 'admin') {
    return [
      ...common,
      { icon: 'dashboard', label: 'CMS Admin', to: '/admin' },
      { icon: 'content_cut', label: 'Dịch vụ', to: '/booking' },
      { icon: 'event_note', label: 'Lịch hẹn', to: '/profile' },
      { icon: 'manage_accounts', label: 'Tài khoản', to: '/account' },
    ];
  }

  if (role === 'barber') {
    return [
      ...common,
      { icon: 'dashboard', label: 'Dashboard', to: '/barber' },
      { icon: 'account_circle', label: 'Hồ sơ', to: '/account' },
    ];
  }

  return [
    ...common,
    { icon: 'content_cut', label: 'Đặt chỗ', to: '/booking' },
    { icon: 'event_note', label: 'Lịch hẹn', to: '/profile' },
    { icon: 'person', label: 'Hồ sơ', to: '/account' },
  ];
};

function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const items = getNavItems(user?.role);

  const isActive = (path) => {
    if (path === '/home' && (location.pathname === '/' || location.pathname === '/home')) return true;
    return location.pathname === path;
  };

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <span className="brand-primary">Artisan Ledger</span>
        <span className="brand-secondary">The Artistic Lounge</span>
      </div>

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
        {items.map((item) => (
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
        <button className="logout-btn" onClick={handleLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;
