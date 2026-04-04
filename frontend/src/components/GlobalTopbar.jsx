import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './GlobalTopbar.scss';

function GlobalTopbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <header className="global-topbar">
      <div className="topbar-content">
        <div className="topbar-brand-mobile" onClick={() => navigate('/')}>
          <span className="brand-title">Artisan Ledger</span>
        </div>

        <div className="topbar-actions">
          {/* Notifications */}
          <div className="action-wrapper">
            <button 
              className={`action-btn${showNotifications ? ' active' : ''}`}
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              type="button"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="notification-badge" />
            </button>
            
            {showNotifications && (
              <div className="action-dropdown notifications-dropdown">
                <div className="dropdown-header">Thông báo</div>
                <div className="dropdown-body">
                  <div className="dropdown-item unread">
                    <span className="material-symbols-outlined">event_available</span>
                    <div>
                      <p>Lịch hẹn đã được xác nhận</p>
                      <span>2 giờ trước</span>
                    </div>
                  </div>
                </div>
                <button className="dropdown-footer" onClick={() => setShowNotifications(false)}>Xem tất cả thông báo</button>
              </div>
            )}
          </div>

          {/* User Account */}
          <div className="action-wrapper">
            <button 
              className={`action-btn profile-trigger${showProfileMenu ? ' active' : ''}`}
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              type="button"
            >
              <img 
                src={user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCD1VZI9vpwZKFSj9GOgeEek9r7CCKhjRA3qHB3y3PBjWxXEjsbXe3RFR6QWaLaVNOpQNQBQ7QBUAZnyze7yEAWMzf-VA6A9OG-S5kCO-c2SBRd-E2shWgZcZPpMaaE0as_UTEQBn9K5lt2hZYrHTpCMCUDlTLn9F0_Nub0iIbNUYxLFu0Jejh3wXdcY3VWXreY54O9k1jl-f4Re874BT-7v2XJjpR1VcxmUpLR0fDwlSJlxJpp76spU4TuG62kQLfiPGniBRZTbwQ'} 
                alt="Profile" 
                className="topbar-avatar"
              />
            </button>

            {showProfileMenu && (
              <div className="action-dropdown profile-dropdown">
                <div className="profile-summary">
                  <p className="user-name">{user?.name || 'Quý khách'}</p>
                  <p className="user-role">Quản lý Premium</p>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item" onClick={() => { navigate('/account'); setShowProfileMenu(false); }}>
                  <span className="material-symbols-outlined">person</span>
                  Thông tin tài khoản
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}>
                  <span className="material-symbols-outlined">calendar_month</span>
                  Lịch hẹn của tôi
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout-link" onClick={handleLogout}>
                  <span className="material-symbols-outlined">logout</span>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default GlobalTopbar;
