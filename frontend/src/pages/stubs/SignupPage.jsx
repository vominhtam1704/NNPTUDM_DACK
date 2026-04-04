import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../styles/auth.css';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, isLoading, error: authError } = useAuth();
  const navigate = useNavigate();

  // Password strength checker
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    return {
      hasMinLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd)
    };
  }, [formData.password]);

  const isPasswordStrong = Object.values(passwordStrength).every(v => v);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password;

  // Validate form
  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (!isPasswordStrong) {
      setFormError('Mật khẩu không đủ mạnh');
      return false;
    }

    if (!passwordsMatch) {
      setFormError('Mật khẩu không trùng khớp');
      return false;
    }

    if (!agreeTerms) {
      setFormError('Vui lòng đồng ý với điều khoản sử dụng');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Email không hợp lệ');
      return false;
    }

    return true;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) return;

    const result = await register(formData);

    if (result.success) {
      setFormSuccess('Đăng ký thành công! Bạn sẽ được chuyển hướng đến đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setFormError(result.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Tạo Tài Khoản</h1>
          <p>
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </div>

        {formError && <div className="form-error">{formError}</div>}
        {formSuccess && <div className="form-success">{formSuccess}</div>}
        {authError && <div className="form-error">{authError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Họ và tên</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              placeholder="+84 9xx xxx xxx"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group password-toggle">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={handleInputChange}
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

          {formData.password && (
            <div className="password-requirements">
              <h4>Yêu cầu mật khẩu:</h4>
              <ul>
                <li className={passwordStrength.hasMinLength ? 'met' : ''}>
                  Tối thiểu 8 ký tự
                </li>
                <li className={passwordStrength.hasUpperCase ? 'met' : ''}>
                  Ít nhất 1 chữ hoa (A-Z)
                </li>
                <li className={passwordStrength.hasLowerCase ? 'met' : ''}>
                  Ít nhất 1 chữ thường (a-z)
                </li>
                <li className={passwordStrength.hasNumber ? 'met' : ''}>
                  Ít nhất 1 chữ số (0-9)
                </li>
                <li className={passwordStrength.hasSpecialChar ? 'met' : ''}>
                  Ít nhất 1 ký tự đặc biệt (@$!%*?&)
                </li>
              </ul>
            </div>
          )}

          <div className="form-group password-toggle">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            {formData.confirmPassword && (
              <div className={`form-help ${passwordsMatch ? 'success' : 'error'}`}>
                {passwordsMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
              </div>
            )}
          </div>

          <div className="checkbox-group">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <label htmlFor="agreeTerms">
              Tôi đồng ý với <a href="#terms">Điều khoản sử dụng</a> và{' '}
              <a href="#privacy">Chính sách bảo mật</a>
            </label>
          </div>

          <button
            type="submit"
            className="btn-auth btn-auth-primary"
            disabled={isLoading || !agreeTerms}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner"></span>
                Đang xử lý...
              </span>
            ) : (
              'Tạo Tài Khoản'
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-gray)' }}>
          <p>Lưu ý: Tài khoản của bạn sẽ được phân quyền (Khách hàng/Thợ cắt) bởi quản lý hệ thống.</p>
        </div>
      </div>
    </div>
  );
}
