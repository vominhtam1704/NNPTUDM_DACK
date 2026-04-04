import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { login, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Validation
  const validateForm = () => {
    if (!email || !password) {
      setFormError('Vui lòng nhập email và mật khẩu');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Email không hợp lệ');
      return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) return;

    const result = await login(email, password);

    if (result.success) {
      setFormSuccess('Đăng nhập thành công!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } else {
      setFormError(result.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng Nhập</h1>
          <p>
            Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link>
          </p>
        </div>

        {formError && <div className="form-error">{formError}</div>}
        {formSuccess && <div className="form-success">{formSuccess}</div>}
        {authError && <div className="form-error">{authError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group password-toggle">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <button type="submit" className="btn-auth btn-auth-primary" disabled={isLoading}>
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Đang xử lý...
              </span>
            ) : (
              'Đăng Nhập'
            )}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem' }}>
              Quên mật khẩu?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
