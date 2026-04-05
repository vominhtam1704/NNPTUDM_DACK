import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getReservationById } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../BookingCompletePage.scss';

const BookingCompletePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams();
  const [reservation, setReservation] = useState(null);

  // Extract payment info from location state
  const { paymentInfo, selectedPaymentMethod } = location.state || {};
  const isTransfer = selectedPaymentMethod === 'transfer';

  useEffect(() => {
    let active = true;

    const loadReservation = async () => {
      try {
        const response = await getReservationById(appointmentId);
        // Handle standardized response (returns full body)
        const data = response?.data || response;
        if (active) {
          setReservation(data);
        }
      } catch (error) {
        if (active) {
          setReservation(null);
        }
      }
    };

    if (appointmentId) {
      loadReservation();
    }

    return () => {
      active = false;
    };
  }, [appointmentId]);

  const formattedDate = reservation?.appointmentDate
    ? new Date(reservation.appointmentDate).toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: 'long',
      })
    : 'Thu 7, 24 Thang 5';

  return (
    <PageLayout>
      <div className="booking-complete-page">
        <main className="complete-content">
          <section className="complete-stepper">
            <div className="complete-step-track" />
            <div className="complete-step-track active" />

            <div className="complete-step done">
              <div className="complete-step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Dịch vụ</span>
            </div>
            <div className="complete-step done">
              <div className="complete-step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Chon thợ</span>
            </div>
            <div className="complete-step done">
              <div className="complete-step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Thời gian</span>
            </div>
            <div className="complete-step done">
              <div className="complete-step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Thanh toán</span>
            </div>
            <div className="complete-step active">
              <div className="complete-step-circle">5</div>
              <span>Hoàn tất</span>
            </div>
          </section>

          <div className="complete-shell">
            <section className="success-card">
              <div className="success-icon">
                <span className="material-symbols-outlined filled">check_circle</span>
              </div>
              <p className="success-eyebrow">Đặt lịch thành công</p>
              <h2>Lịch hẹn của bạn đã được xác nhận</h2>
              <p className="success-copy">
                Cảm ơn bạn đã tin tưởng The Atelier. Chúng tôi đã gửi thông tin lịch hẹn và
                biên nhận thanh toán đến email của bạn.
              </p>

              {isTransfer && paymentInfo?.qrUrl && (
                <div className="qr-section">
                  <div className="qr-container">
                    <img alt="QR Code SePay" src={paymentInfo.qrUrl} />
                  </div>
                  <div className="qr-instructions">
                    <p>Vui lòng quét mã QR trên để thanh toán.</p>
                    <p>Nội dung: <strong>{paymentInfo.referenceCode}</strong></p>
                    <p>Số tiền: <strong>{Number(paymentInfo.amount).toLocaleString('vi-VN')}đ</strong></p>
                  </div>
                </div>
              )}

              <div className="booking-reference">
                <span>Mã lịch hẹn</span>
                <strong>{appointmentId}</strong>
              </div>

              <div className="success-actions">
                <Link className="primary-link-btn" to="/">
                  Quay về trang chủ
                </Link>
                <Link className="secondary-link-btn" to={`/review/${appointmentId}`}>
                  Gửi đánh giá
                </Link>
                <button className="secondary-link-btn" onClick={() => navigate('/profile')} type="button">
                  Xem lịch của tôi
                </button>
              </div>
            </section>

            <aside className="complete-summary">
              <div className="complete-summary-card">
                <h3>Thông tin lịch hẹn</h3>

                <div className="summary-block">
                  <p className="summary-label">Dịch vụ</p>
                  <div className="summary-row">
                    <div>
                      <strong>{reservation?.serviceId?.name || 'Royal Grooming'}</strong>
                      <span>{reservation?.notes || 'Cắt tóc, cạo mặt và Massage tinh dầu'}</span>
                    </div>
                    <strong>{Number(reservation?.totalPrice || 0).toLocaleString('vi-VN')}đ</strong>
                  </div>
                </div>

                <div className="summary-expert">
                  <img
                    alt="Barber"
                    src={
                      reservation?.barberId?.avatar ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz7fMMzBws3l7xQ7X-ZTqlTrEw6apvwd9eqPOvBZqfzxWGLaJRYe6g5OX1_N08pRREmVkcsPn9TJrH9RroTkDh5m1D47F32HEbOqeesdSqNh1FjowkhEpmNtD-DoSBesg7Am7WXPahd2SqhifrPTQ1QjDx6hlII0gp-m9e226EbVZlXZcidPNE-RA6R2keDJiEW2XS_SpIk1BkJ4kyqK_HDAqS_0Rria3EToYlpNaT-YE074Ve7UJPIsc5tYMwDavk3JLCUwYRjI'
                    }
                  />
                  <div>
                    <p className="summary-label">Chuyên gia</p>
                    <strong>{reservation?.barberId?.name || 'Stylist'}</strong>
                  </div>
                </div>

                <div className="summary-time-grid">
                  <div className="summary-time-card">
                    <p className="summary-label">Ngày</p>
                    <div>
                      <span className="material-symbols-outlined">calendar_today</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="summary-time-card">
                    <p className="summary-label">Giờ</p>
                    <div>
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{reservation?.appointmentTime || 'Giờ hẹn'}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-divider" />

                <div className="payment-status">
                  <div>
                    <p className="summary-label">Thanh toán</p>
                    <strong>{reservation?.status === 'confirmed' ? 'Đã xác nhận lịch hẹn' : 'Đang chờ xử lý'}</strong>
                  </div>
                  <span className="status-chip">
                    {Number(reservation?.totalPrice || 0).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="note-card">
                <p>
                  Bạn cần đổi lịch? Hãy liên hệ với salon trước 24 giờ để được hỗ trợ nhanh nhất.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </PageLayout>
  );
};

export default BookingCompletePage;
