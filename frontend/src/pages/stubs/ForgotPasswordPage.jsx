import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../styles/auth.css';

export default function ForgotPasswordPage() {
  const { token } = useParams();
  const step = token ? 2 : 1; // Step 1: Email, Step 2: Reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { forgotPassword, resetPassword, isLoading } = useAuth();

  // Password strength checker
  const passwordStrength = useMemo(() => {
    const pwd = password;
    return {
      hasMinLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd)
    };
  }, [password]);

  const isPasswordStrong = Object.values(passwordStrength).every(v => v);
  const passwordsMatch = password === confirmPassword && password;

  // Handle step 1 - Send reset link
  const handleSendResetLink = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!email) {
      setFormError('Vui lòng nhập email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Email không hợp lệ');
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      setFormSuccess(
        'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra email.'
      );
      setTimeout(() => {
        setEmail('');
        setFormSuccess('');
      }, 3000);
    } else {
      setFormError(result.message);
    }
  };

  // Handle step 2 - Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!password || !confirmPassword) {
      setFormError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!isPasswordStrong) {
      setFormError('Mật khẩu không đủ mạnh');
      return;
    }

    if (!passwordsMatch) {
      setFormError('Mật khẩu không trùng khớp');
      return;
    }

    const result = await resetPassword(token, password, confirmPassword);
    if (result.success) {
      setFormSuccess('Mật khẩu của bạn đã được đặt lại. Bạn sẽ được chuyển hướng đến đăng nhập...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      setFormError(result.message || 'Đặt lại mật khẩu thất bại');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Quên Mật Khẩu</h1>
          <p>
            Bạn nhớ lại mật khẩu? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>

        {formError && <div className="form-error">{formError}</div>}
        {formSuccess && <div className="form-success">{formSuccess}</div>}

        {/* STEP 1: Email Entry */}
        {step === 1 && (
          <form onSubmit={handleSendResetLink}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>
                Nhập email tài khoản của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
                để xác nhận quyền sở hữu email của bạn.
              </p>
            </div>

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

            <button type="submit" className="btn-auth btn-auth-primary" disabled={isLoading}>
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Đang gửi...
                </span>
              ) : (
                'Gửi Hướng Dẫn Đặt Lại'
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Password Reset */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--text-gray)', marginBottom: '1rem' }}>
                Nhập mật khẩu mới của bạn. Đảm bảo mật khẩu đủ mạnh để bảo vệ tài khoản.
              </p>
            </div>

            <div className="form-group password-toggle">
              <label htmlFor="password">Mật khẩu mới</label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
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

            {password && (
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
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              {confirmPassword && (
                <div className={`form-help ${passwordsMatch ? 'success' : 'error'}`}>
                  {passwordsMatch ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn-auth btn-auth-primary"
              disabled={isLoading || !isPasswordStrong || !passwordsMatch}
            >
              {isLoading ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Đang xử lý...
                </span>
              ) : (
                'Đặt Lại Mật Khẩu'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ fontSize: '0.9rem' }}>
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
