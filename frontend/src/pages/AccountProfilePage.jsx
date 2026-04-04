import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMyReservations, cancelReservation } from '../services/reservations';
import PageLayout from '../components/PageLayout';
import './AccountProfilePage.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1FkXI9Y5wO1hAhzI_oxmjvGnVLGzzkrmk2t6ZHCKTY1ghBq6aiiMf5CoOo8FNnY-zJnlkmZjXe-K1LzDrfow44W_amPhRamYOQiEgh16KmBgJrjggjuOxubwOr_tM7rsb_1GiKPblr7U4F8e58DCLZWkcg1Qa45wHrdLnH8nhT9KJYZOox2zirx0V7wVdBs2KrAeMN75msKWwfk90KxBmvSSk69mEBUohb409E0KTdd3wlWIYLcbP_CiD8-c0Rj8OjnnUWM7Im0c';

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatMemberSince = (value) => {
  if (!value) return 'Thanh vien moi';
  return `Thanh vien tu ${new Date(value).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}`;
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const tierLabels = {
  Standard: 'Hang Bac',
  Gold: 'Hang Vang',
  Diamond: 'Hang Kim Cuong',
};

const statusLabels = {
  pending: 'Cho xac nhan',
  confirmed: 'Da xac nhan',
  done: 'Hoan thanh',
  cancelled: 'Da huy'
};

const statusAccents = {
  pending: 'warning',
  confirmed: 'info',
  done: 'success',
  cancelled: 'danger'
};

function AccountProfilePage() {
  const { user, updateProfile, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      birthDate: formatDateInput(user.birthDate),
      gender: user.gender || 'male',
    });
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadAppointments = async () => {
      setAppointmentsLoading(true);
      setAppointmentsError('');

      try {
        const data = await getMyReservations({ limit: 5 });
        if (active) {
          setAppointments(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        if (active) {
          setAppointmentsError('Khong the tai lich hen');
          console.error('Load appointments error:', err);
        }
      } finally {
        if (active) {
          setAppointmentsLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      active = false;
    };
  }, []);

  const loyaltyProgress = useMemo(() => {
    const points = user?.loyaltyPoints || 0;
    const nextTarget = 3000;
    return {
      points,
      progress: Math.min((points / nextTarget) * 100, 100),
      remaining: Math.max(nextTarget - points, 0),
    };
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleReset = () => {
    if (!user) return;
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      address: user.address || '',
      birthDate: formatDateInput(user.birthDate),
      gender: user.gender || 'male',
    });
    setMessage('');
    setError('');
  };

  const handleViewDetails = (appointmentId) => {
    navigate(`/account/appointment/${appointmentId}`);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Ban co chac chan muon huy lich hen nay?')) {
      return;
    }

    try {
      await cancelReservation(appointmentId, { reason: 'Huy boi khach hang' });
      setMessage('Lich hen da duoc huy thanh cong');
      // Reload appointments
      const data = await getMyReservations({ limit: 5 });
      setAppointments(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError('Khong the huy lich hen: ' + (err.message || 'Co loi xay ra'));
    }
  };

  const handleRebookService = (appointment) => {
    if (!appointment.serviceId) return;
    navigate('/booking', {
      state: {
        selectedBarberId: appointment.barberId,
        selectedBarberName: appointment.barberId?.name,
      },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?._id) return;

    setMessage('');
    setError('');

    const result = await updateProfile(user._id, {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      birthDate: formData.birthDate || null,
      gender: formData.gender,
    });

    if (result.success) {
      setMessage('Thong tin da duoc cap nhat thanh cong.');
    } else {
      setError(result.message || 'Khong the cap nhat thong tin.');
    }
  };

  return (
    <PageLayout>
      <div className="account-page">
        <nav className="account-topbar">
          <div className="account-topbar-brand">Cat Toc Pro</div>
          <div className="account-topbar-links">
            <Link to="/profile">Lich Hen</Link>
            <Link to="/">Khach Hang</Link>
            <Link to="/admin">Bao Cao</Link>
          </div>
          <div className="account-topbar-actions">
            <button type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="account-mini-avatar">
              <img alt={user?.name || 'Avatar'} src={user?.avatar || fallbackAvatar} />
            </div>
          </div>
        </nav>

        <main className="account-shell">
          <div className="account-grid">
            <section className="account-sidebar">
            <div className="identity-card">
              <div className="identity-accent" />
              <div className="identity-inner">
                <div className="identity-avatar-wrap">
                  <div className="identity-avatar-ring">
                    <img alt={user?.name || 'Avatar'} src={user?.avatar || fallbackAvatar} />
                  </div>
                  <button className="identity-edit-btn" type="button">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>

                <h1>{user?.name || 'Khach hang'}</h1>
                <p className="identity-member-since">{formatMemberSince(user?.createdAt)}</p>

                <div className="identity-info">
                  <div className="identity-row">
                    <span className="material-symbols-outlined">call</span>
                    <div>
                      <p>So dien thoai</p>
                      <strong>{user?.phone || 'Chua cap nhat'}</strong>
                    </div>
                  </div>
                  <div className="identity-row">
                    <span className="material-symbols-outlined">mail</span>
                    <div>
                      <p>Email</p>
                      <strong>{user?.email || 'Chua cap nhat'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="loyalty-card">
              <div className="loyalty-bg" />
              <div className="loyalty-content">
                <div className="loyalty-head">
                  <span className="material-symbols-outlined filled">loyalty</span>
                  <span>{tierLabels[user?.membershipTier] || 'Hang Bac'}</span>
                </div>
                <p>Diem thuong tich luy</p>
                <h2>{loyaltyProgress.points.toLocaleString('vi-VN')}</h2>
                <div className="loyalty-progress">
                  <div style={{ width: `${loyaltyProgress.progress}%` }} />
                </div>
                <small>Can them {loyaltyProgress.remaining.toLocaleString('vi-VN')} diem de len hang tiep theo</small>
              </div>
            </div>
          </section>

          <section className="account-main">
            <div className="section-header">
              <h2>Lich su dat lich gan day</h2>
              <Link to="/profile">Xem tat ca</Link>
            </div>

            {appointmentsError && <div style={{ color: '#d32f2f', padding: '1rem', marginBottom: '1rem' }}>{appointmentsError}</div>}

            <div className="appointment-grid">
              {appointmentsLoading ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Dang tai lich hen...
                </div>
              ) : appointments.length > 0 ? (
                appointments.map((appointment) => {
                  const statusLabel = statusLabels[appointment.status] || appointment.status;
                  const accentClass = statusAccents[appointment.status] || 'primary';
                  const isCompleted = appointment.status === 'done';

                  return (
                    <article className={`history-card ${accentClass}`} key={appointment._id}>
                      <div className="history-head">
                        <div>
                          <span className="history-status">{statusLabel}</span>
                          <h3>{appointment.serviceId?.name || 'Dich vu'}</h3>
                        </div>
                        <strong>{formatCurrency(appointment.totalPrice)}</strong>
                      </div>

                      <div className="history-meta">
                        <div>
                          <span className="material-symbols-outlined">event</span>
                          <span>{new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div>
                          <span className="material-symbols-outlined">schedule</span>
                          <span>{appointment.appointmentTime}</span>
                        </div>
                        <div>
                          <span className="material-symbols-outlined">person</span>
                          <span>Stylist: {appointment.barberId?.name || 'Dang cap nhat'}</span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <button
                          className="history-secondary-btn"
                          onClick={() => handleRebookService(appointment)}
                          type="button"
                        >
                          Dat lai dich vu nay
                        </button>
                      ) : appointment.status === 'cancelled' ? (
                        <div style={{ textAlign: 'center', padding: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                          Lich hen da bi huy
                        </div>
                      ) : (
                        <div className="history-actions">
                          <button
                            className="history-primary-btn"
                            onClick={() => handleViewDetails(appointment._id)}
                            type="button"
                          >
                            Chi tiet
                          </button>
                          <button
                            className="history-danger-btn"
                            onClick={() => handleCancelAppointment(appointment._id)}
                            type="button"
                          >
                            Huy
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#999' }}>
                  Khong co lich hen nao. <Link to="/booking">Dat lich ngay!</Link>
                </div>
              )}
            </div>

            <div className="account-form-card">
              <div className="account-form-header">
                <span className="material-symbols-outlined">manage_accounts</span>
                <h2>Cap nhat thong tin ca nhan</h2>
              </div>

              {message ? <div className="account-message success">{message}</div> : null}
              {error ? <div className="account-message error">{error}</div> : null}

              <form className="account-form" onSubmit={handleSubmit}>
                <label>
                  <span>Ho va ten</span>
                  <input name="name" onChange={handleChange} type="text" value={formData.name} />
                </label>

                <label>
                  <span>So dien thoai</span>
                  <input name="phone" onChange={handleChange} type="tel" value={formData.phone} />
                </label>

                <label className="full-width">
                  <span>Dia chi thuong tru</span>
                  <input
                    name="address"
                    onChange={handleChange}
                    placeholder="Nhap dia chi cua ban"
                    type="text"
                    value={formData.address}
                  />
                </label>

                <label>
                  <span>Ngay sinh</span>
                  <input name="birthDate" onChange={handleChange} type="date" value={formData.birthDate} />
                </label>

                <label>
                  <span>Gioi tinh</span>
                  <select name="gender" onChange={handleChange} value={formData.gender}>
                    <option value="male">Nam</option>
                    <option value="female">Nu</option>
                    <option value="other">Khac</option>
                  </select>
                </label>

                <div className="account-form-actions">
                  <button className="secondary" onClick={handleReset} type="button">
                    Huy bo
                  </button>
                  <button className="primary" disabled={authIsLoading} type="submit">
                    {authIsLoading ? 'Dang luu...' : 'Luu thay doi'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
        </main>

        <div className="account-bottom-nav">
        <Link to="/">
          <span className="material-symbols-outlined">dashboard</span>
          <span>Trang chu</span>
        </Link>
        <Link to="/profile">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Lich hen</span>
        </Link>
        <Link className="active" to="/account">
          <span className="material-symbols-outlined filled">person</span>
          <span>Ho so</span>
        </Link>
        <Link to="/account">
          <span className="material-symbols-outlined">settings</span>
          <span>Cai dat</span>
        </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export default AccountProfilePage;
