// ============================================
// SIGNUP PAGE
// Member B/C - Barber Atelier
// ============================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../AuthPage.scss';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { register, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải chứa ít nhất 6 ký tự');
      return;
    }

    try {
      const result = await register(formData);
      if (result.success) {
        setSuccessMsg('Đăng ký thành công! Đang chuyển đến trang đăng nhập...');
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setLocalError(result.message || 'Đăng ký thất bại');
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
          <h1 className="auth-title">Tạo tài khoản</h1>
          <p className="auth-subtitle">Gia nhập cộng đồng Barber Atelier</p>
        </div>

        {displayError && (
          <div className="auth-error">
            {displayError}
          </div>
        )}

        {successMsg && (
          <div className="auth-error" style={{ background: '#f0fdf4', color: '#15803d', borderColor: 'rgba(21, 128, 61, 0.1)' }}>
            {successMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Họ và tên</label>
            <input
              id="name"
              className="auth-input"
              type="text"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="auth-field">
              <label htmlFor="phone">Số điện thoại</label>
              <input
                id="phone"
                className="auth-input"
                type="tel"
                placeholder="0912..."
                value={formData.phone}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={isLoading}
          >
            {isLoading ? <div className="auth-spinner" /> : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? 
          <Link to="/login" className="auth-link">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
