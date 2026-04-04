import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getReservationById, cancelReservation } from '../services/reservations';
import PageLayout from '../components/PageLayout';
import './BookingDetailsPage.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCD1VZI9vpwZKFSj9GOgeEek9r7CCKhjRA3qHB3y3PBjWxXEjsbXe3RFR6QWaLaVNOpQNQBQ7QBUAZnyze7yEAWMzf-VA6A9OG-S5kCO-c2SBRd-E2shWgZcZPpMaaE0as_UTEQBn9K5lt2hZYrHTpCMCUDlTLn9F0_Nub0iIbNUYxLFu0Jejh3wXdcY3VWXreY54O9k1jl-f4Re874BT-7v2XJjpR1VcxmUpLR0fDwlSJlxJpp76spU4TuG62kQLfiPGniBRZTbwQ';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy'
};

const statusColors = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  done: '#4caf50',
  cancelled: '#f44336'
};

const BookingDetailsPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!appointmentId) {
        setError('Không tìm thấy ID lịch hẹn');
        setLoading(false);
        return;
      }

      try {
        const data = await getReservationById(appointmentId);
        setAppointment(data);
      } catch (err) {
        console.error('Load appointment error:', err);
        setError('Không thể tải thông tin lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId]);

  const handleCancelAppointment = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelReservation(appointmentId, { reason: 'Hủy bởi khách hàng' });
      // Reload appointment data
      const data = await getReservationById(appointmentId);
      setAppointment(data);
    } catch (err) {
      setError('Không thể hủy lịch hẹn: ' + (err.message || 'Có lỗi xảy ra'));
    } finally {
      setCancelling(false);
    }
  };

  const handleRebook = () => {
    if (!appointment?.serviceId) return;
    navigate('/booking', {
      state: {
        selectedBarberId: appointment.barberId?._id,
        selectedBarberName: appointment.barberId?.name,
      },
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="booking-details-page">
          <div className="loading">Đang tải thông tin lịch hẹn...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !appointment) {
    return (
      <PageLayout>
        <div className="booking-details-page">
          <div className="error">
            <h2>Lỗi</h2>
            <p>{error || 'Không tìm thấy lịch hẹn'}</p>
            <Link to="/account" className="btn btn-primary">Quay lại</Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const statusLabel = statusLabels[appointment.status] || appointment.status;
  const statusColor = statusColors[appointment.status] || '#666';
  const isCompleted = appointment.status === 'done';
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <PageLayout>
      <div className="booking-details-page">
        <div className="page-header">
          <button
            className="back-btn"
            onClick={() => navigate('/account')}
            type="button"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>
          <h1>Chi tiết lịch hẹn</h1>
        </div>

        <div className="booking-details-content">
          <div className="booking-card">
            <div className="booking-header">
              <div className="status-badge" style={{ backgroundColor: statusColor }}>
                {statusLabel}
              </div>
              <div className="booking-id">
                Mã lịch hẹn: {appointment._id}
              </div>
            </div>

            <div className="booking-info">
              <div className="info-section">
                <h3>Thông tin dịch vụ</h3>
                <div className="service-info">
                  <div className="service-name">
                    <span className="material-symbols-outlined">content_cut</span>
                    {appointment.serviceId?.name || 'Dịch vụ'}
                  </div>
                  <div className="service-price">
                    {formatCurrency(appointment.totalPrice)}
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Thời gian & địa điểm</h3>
                <div className="datetime-info">
                  <div className="date">
                    <span className="material-symbols-outlined">event</span>
                    {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="time">
                    <span className="material-symbols-outlined">schedule</span>
                    {appointment.appointmentTime}
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Stylist</h3>
                <div className="barber-info">
                  <img
                    src={appointment.barberId?.avatar || fallbackAvatar}
                    alt={appointment.barberId?.name || 'Stylist'}
                    className="barber-avatar"
                  />
                  <div className="barber-details">
                    <div className="barber-name">{appointment.barberId?.name || 'Đang cập nhật'}</div>
                    <div className="barber-specialty">Chuyên gia cắt tóc</div>
                  </div>
                </div>
              </div>

              {appointment.note && (
                <div className="info-section">
                  <h3>Ghi chú</h3>
                  <p className="note">{appointment.note}</p>
                </div>
              )}

              <div className="info-section">
                <h3>Thông tin khách hàng</h3>
                <div className="customer-info">
                  <div className="info-row">
                    <span>Họ tên:</span>
                    <span>{appointment.customerName || user?.name}</span>
                  </div>
                  <div className="info-row">
                    <span>Số điện thoại:</span>
                    <span>{appointment.customerPhone || user?.phone}</span>
                  </div>
                  <div className="info-row">
                    <span>Email:</span>
                    <span>{appointment.customerEmail || user?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-actions">
              {canCancel && (
                <button
                  className="btn btn-danger"
                  onClick={handleCancelAppointment}
                  disabled={cancelling}
                  type="button"
                >
                  {cancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
                </button>
              )}

              {isCompleted && (
                <button
                  className="btn btn-primary"
                  onClick={handleRebook}
                  type="button"
                >
                  Đặt lại dịch vụ này
                </button>
              )}

              <Link to="/account" className="btn btn-secondary">
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default BookingDetailsPage;