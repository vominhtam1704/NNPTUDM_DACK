// ============================================
// LOGIN PAGE
// Member B/C - Barber Atelier
// ============================================
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../AuthPage.scss';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  
  const { login, isLoading, error: authError, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        // Default role-based redirect
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'barber') navigate('/barber');
        else navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    try {
      const result = await login(email, password);
      if (!result.success) {
        setLocalError(result.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      setLocalError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">BA</div>
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập để quản lý lịch hẹn của bạn</p>
        </div>

        {displayError && (
          <div className="auth-error">
            {displayError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              placeholder="admin@barber.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? <div className="auth-spinner" /> : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? 
          <Link to="/signup" className="auth-link">Đăng ký ngay</Link>
        </div>
        
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: '#cbd5e1' }}>
          <p>Dùng <strong>admin@barber.com</strong> / <strong>Admin@123456</strong> để thử quyền Admin</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
