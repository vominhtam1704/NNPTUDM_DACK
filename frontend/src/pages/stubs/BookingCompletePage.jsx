import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getReservationById } from '../../services/reservations';
import '../BookingCompletePage.scss';

const BookingCompletePage = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [reservation, setReservation] = useState(null);

  useEffect(() => {
    let active = true;

    const loadReservation = async () => {
      try {
        const data = await getReservationById(appointmentId);
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
    <div className="booking-complete-page">
      <header className="complete-topbar">
        <div className="complete-topbar-inner">
          <div className="complete-brand-wrap">
            <button className="complete-back-btn" onClick={() => navigate('/')} type="button">
              <span className="material-symbols-outlined">home</span>
            </button>
            <h1 className="complete-brand">The Atelier</h1>
          </div>

          <div className="complete-topbar-actions">
            <span className="support-label">Lich hen da xac nhan</span>
            <div className="support-avatar">
              <img
                alt="Support avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD015R9kLoOrRQ6higld_ViBdSRGeCBmIrSEVo2ZcZLhXkmjIzvejT6b0qRjJPmCl3GRb6E85cco2E6vMPme61NRoFZlfAsvjNryG36HjjO0pWtARsfdS9IAWv5o1jr5dT3eiQG1vLnZT_CMYCDlfTxwsfbdaAy3B_5Rrs1aY_OzhHYTVNebChNqa8OxIlI1h3rO7K5hMaLWyrMQ50l7xGu320xnrOuQSGGTLuesyudCXEwEd7LE0qCGmnDBHOGYOll6o1Wu4i__ek"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="complete-content">
        <section className="complete-stepper">
          <div className="complete-step-track" />
          <div className="complete-step-track active" />

          <div className="complete-step done">
            <div className="complete-step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Dich vu</span>
          </div>
          <div className="complete-step done">
            <div className="complete-step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Chon tho</span>
          </div>
          <div className="complete-step done">
            <div className="complete-step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Thoi gian</span>
          </div>
          <div className="complete-step done">
            <div className="complete-step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Thanh toan</span>
          </div>
          <div className="complete-step active">
            <div className="complete-step-circle">5</div>
            <span>Hoan tat</span>
          </div>
        </section>

        <div className="complete-shell">
          <section className="success-card">
            <div className="success-icon">
              <span className="material-symbols-outlined filled">check_circle</span>
            </div>
            <p className="success-eyebrow">Dat lich thanh cong</p>
            <h2>Lich hen cua ban da duoc xac nhan</h2>
            <p className="success-copy">
              Cam on ban da tin tuong The Atelier. Chung toi da gui thong tin lich hen va
              bien nhan thanh toan den email cua ban.
            </p>

            <div className="booking-reference">
              <span>Ma lich hen</span>
              <strong>{appointmentId}</strong>
            </div>

            <div className="success-actions">
              <Link className="primary-link-btn" to="/">
                Quay ve trang chu
              </Link>
              <Link className="secondary-link-btn" to={`/review/${appointmentId}`}>
                Gui danh gia
              </Link>
              <button className="secondary-link-btn" onClick={() => navigate('/profile')} type="button">
                Xem lich cua toi
              </button>
            </div>
          </section>

          <aside className="complete-summary">
            <div className="complete-summary-card">
              <h3>Thong tin lich hen</h3>

              <div className="summary-block">
                <p className="summary-label">Dich vu</p>
                <div className="summary-row">
                  <div>
                    <strong>{reservation?.serviceId?.name || 'Royal Grooming'}</strong>
                    <span>{reservation?.notes || 'Cat toc, cao mat va Massage tinh dau'}</span>
                  </div>
                  <strong>{Number(reservation?.totalPrice || 450000).toLocaleString('vi-VN')}d</strong>
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
                  <p className="summary-label">Chuyen gia</p>
                  <strong>{reservation?.barberId?.name || 'Alex Nguyen'}</strong>
                </div>
              </div>

              <div className="summary-time-grid">
                <div className="summary-time-card">
                  <p className="summary-label">Ngay</p>
                  <div>
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>

                <div className="summary-time-card">
                  <p className="summary-label">Gio</p>
                  <div>
                    <span className="material-symbols-outlined">schedule</span>
                    <span>{reservation?.appointmentTime || '14:30'}</span>
                  </div>
                </div>
              </div>

              <div className="summary-divider" />

              <div className="payment-status">
                <div>
                  <p className="summary-label">Thanh toan</p>
                  <strong>{reservation?.status === 'confirmed' ? 'Da xac nhan lich hen' : 'Dang cho xu ly'}</strong>
                </div>
                <span className="status-chip">
                  {Number(reservation?.totalPrice || 475000).toLocaleString('vi-VN')}d
                </span>
              </div>
            </div>

            <div className="note-card">
              <p>
                Ban can doi lich? Hay lien he voi salon truoc 24 gio de duoc ho tro nhanh
                nhat.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <nav className="complete-bottom-nav">
        <Link className="complete-bottom-item active" to="/">
          <span className="material-symbols-outlined">home</span>
          <span>Trang chu</span>
        </Link>
        <Link className="complete-bottom-item" to="/booking">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Lich hen</span>
        </Link>
        <Link className="complete-bottom-item" to="/profile">
          <span className="material-symbols-outlined">person</span>
          <span>Ca nhan</span>
        </Link>
      </nav>
    </div>
  );
};

export default BookingCompletePage;
