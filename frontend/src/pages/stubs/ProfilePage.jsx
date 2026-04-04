import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cancelReservation, getMyReservations } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../ProfilePage.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuARl1M_Zng5PLZFLH7ed48VeWCDsTYp1p5F2T2Eg_V_44bKI0zkCyteC2tI59YxBmy1BPh4X6-mxB0Je3iHoRbPi1xurikEhBvp_dR1ejKGxvIg6UaRHpAVELalHCjNHpj6ysW9z6HlZDkJk8WxMSm1L-DwiMSQgyvDHg3pENM7DrIFL8wE4POiH-htu-fpZCkk91fPYwIFW9oYrdqzsRzlsAR3nnwIrxmILbjvt5WjBxMP9OzWBPUaNkgPegqjE20NPkkZ1efDI88';

const isUpcomingStatus = (status) => ['pending', 'confirmed'].includes(status);
const isCompletedStatus = (status) => status === 'done';
const canReviewReservation = (status) => status === 'done' || status === 'confirmed';
const canCancelReservation = (status) => status === 'pending' || status === 'confirmed';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const formatDateParts = (dateValue) => {
  const date = new Date(dateValue);
  return {
    monthLabel: `TH ${String(date.getMonth() + 1).padStart(2, '0')}`,
    day: String(date.getDate()).padStart(2, '0'),
    year: date.getFullYear(),
    fullLabel: date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };
};

const getStatusMeta = (status) => {
  switch (status) {
    case 'confirmed':
      return { label: 'Da xac nhan', className: 'confirmed' };
    case 'pending':
      return { label: 'Cho thanh toan', className: 'pending' };
    case 'done':
      return { label: 'Da xong', className: 'done' };
    case 'cancelled':
      return { label: 'Da huy', className: 'cancelled' };
    default:
      return { label: status, className: '' };
  }
};

function ProfilePage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [processingId, setProcessingId] = useState('');

  useEffect(() => {
    let active = true;

    const loadReservations = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getMyReservations({ limit: 50 });
        if (active) {
          setReservations(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Khong the tai danh sach lich hen');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadReservations();
    return () => {
      active = false;
    };
  }, []);

  const sortedReservations = useMemo(
    () =>
      [...reservations].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      ),
    [reservations]
  );

  const upcomingReservations = useMemo(
    () => sortedReservations.filter((item) => isUpcomingStatus(item.status)),
    [sortedReservations]
  );

  const completedReservations = useMemo(
    () => sortedReservations.filter((item) => isCompletedStatus(item.status)),
    [sortedReservations]
  );

  const recentReservations = useMemo(
    () => sortedReservations.filter((item) => isCompletedStatus(item.status)).slice(0, 2),
    [sortedReservations]
  );

  const displayedReservations = activeTab === 'upcoming' ? upcomingReservations : completedReservations;

  const handleCancelReservation = async (reservationId) => {
    setProcessingId(reservationId);
    try {
      const updatedReservation = await cancelReservation(reservationId, { reason: 'Cancelled from customer dashboard' });
      setReservations((current) =>
        current.map((item) => (item._id === reservationId ? { ...item, ...updatedReservation } : item))
      );
    } catch (err) {
      setError(err.message || 'Khong the huy lich hen');
    } finally {
      setProcessingId('');
    }
  };

  return (
    <PageLayout>
      <div className="appointments-page">
        <aside className="appointments-sidebar">
          <div className="appointments-sidebar-brand">
            <h1>The Atelier</h1>
            <p>Premium Management</p>
          </div>

          <nav className="appointments-sidebar-nav">
            <Link to="/">Trang chu</Link>
            <Link className="active" to="/profile">
              Lich hen
            </Link>
            <Link to="/profile">Ho so</Link>
          </nav>

          <div className="appointments-sidebar-footer">
            <a href="/#">Cai dat</a>
            <div className="appointments-user-card">
              <div className="appointments-user-avatar">
                <img alt={user?.name || 'Customer avatar'} src={user?.avatar || fallbackAvatar} />
              </div>
              <div>
                <p>{user?.name || 'Khach hang'}</p>
                <span>Khach hang V.I.P</span>
              </div>
            </div>
          </div>
        </aside>

      <main className="appointments-main">
        <header className="appointments-topbar">
          <div className="appointments-topbar-brand">Artisan Ledger</div>
          <div className="appointments-topbar-actions">
            <button type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        <div className="appointments-content">
          <section className="appointments-heading">
            <div>
              <span>Quan ly lich trinh</span>
              <h2>Lich hen cua toi</h2>
            </div>

            <div className="appointments-tabs">
              <button
                className={activeTab === 'upcoming' ? 'active' : ''}
                onClick={() => setActiveTab('upcoming')}
                type="button"
              >
                Sap toi
              </button>
              <button
                className={activeTab === 'completed' ? 'active' : ''}
                onClick={() => setActiveTab('completed')}
                type="button"
              >
                Da hoan thanh
              </button>
            </div>
          </section>

          {isLoading ? <div className="appointments-state">Dang tai lich hen...</div> : null}
          {!isLoading && error ? <div className="appointments-state error">{error}</div> : null}

          {!isLoading && !error ? (
            <div className="appointments-grid">
              <section className="appointments-list">
                <p className="appointments-section-label">
                  {activeTab === 'upcoming' ? 'Lich hen sap toi' : 'Lich hen da hoan thanh'}
                </p>

                {displayedReservations.length === 0 ? (
                  <div className="appointments-empty-card">
                    Ban chua co lich hen nao trong nhom nay.
                  </div>
                ) : (
                  displayedReservations.map((reservation) => {
                    const dateParts = formatDateParts(reservation.appointmentDate);
                    const statusMeta = getStatusMeta(reservation.status);
                    const duration = reservation.serviceId?.duration || 60;

                    return (
                      <article className="appointment-card" key={reservation._id}>
                        <div className={`appointment-accent ${statusMeta.className}`} />
                        <div className="appointment-card-body">
                          <div className="appointment-card-main">
                            <div className={`appointment-date-badge ${statusMeta.className}`}>
                              <span>{dateParts.monthLabel}</span>
                              <strong>{dateParts.day}</strong>
                              <span>{dateParts.year}</span>
                            </div>

                            <div className="appointment-copy">
                              <div className={`appointment-status ${statusMeta.className}`}>{statusMeta.label}</div>
                              <h3>{reservation.serviceId?.name || 'Dich vu'}</h3>
                              <div className="appointment-meta">
                                <span className="material-symbols-outlined">person</span>
                                <span>
                                  Tho cat: <strong>{reservation.barberId?.name || 'Chua ro'}</strong>
                                </span>
                              </div>
                              <div className="appointment-meta">
                                <span className="material-symbols-outlined">schedule</span>
                                <span>
                                  {reservation.appointmentTime} ({duration} phut)
                                </span>
                              </div>
                              <div className="appointment-submeta">{dateParts.fullLabel}</div>
                            </div>
                          </div>

                          <div className="appointment-card-side">
                            <div className={`appointment-price ${statusMeta.className}`}>
                              {formatCurrency(reservation.totalPrice)}
                            </div>
                            <div className="appointment-actions">
                              {canCancelReservation(reservation.status) ? (
                                <button
                                  className="ghost-btn"
                                  disabled={processingId === reservation._id}
                                  onClick={() => handleCancelReservation(reservation._id)}
                                  type="button"
                                >
                                  {processingId === reservation._id ? 'Dang huy' : 'Huy'}
                                </button>
                              ) : null}
                              <Link className="solid-btn" to={`/payment/${reservation._id}/done`}>
                                Chi tiet
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>

              <aside className="appointments-sidepanel">
                <p className="appointments-section-label">Gan day</p>

                <div className="appointments-recent-panel">
                  {recentReservations.length === 0 ? (
                    <div className="recent-empty">Chua co lich hen da hoan thanh.</div>
                  ) : (
                    recentReservations.map((reservation) => {
                      const dateParts = formatDateParts(reservation.appointmentDate);
                      const statusMeta = getStatusMeta(reservation.status);

                      return (
                        <article className="recent-card" key={reservation._id}>
                          <div className="recent-icon">
                            <span className="material-symbols-outlined filled">check_circle</span>
                          </div>
                          <div className="recent-copy">
                            <div className="recent-head">
                              <span>{dateParts.fullLabel}</span>
                              <strong>{statusMeta.label}</strong>
                            </div>
                            <h4>{reservation.serviceId?.name || 'Dich vu'}</h4>
                            <p>
                              Tho: {reservation.barberId?.name || 'Chua ro'} •{' '}
                              {formatCurrency(reservation.totalPrice)}
                            </p>
                            {canReviewReservation(reservation.status) ? (
                              <Link className="recent-review-btn" to={`/review/${reservation._id}`}>
                                Danh gia
                              </Link>
                            ) : (
                              <div className="recent-stars">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <span className="material-symbols-outlined filled" key={index}>
                                    star
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })
                  )}

                  <button
                    className="history-btn"
                    onClick={() => setActiveTab('completed')}
                    type="button"
                  >
                    Xem tat ca lich su
                  </button>
                </div>

                <div className="appointments-promo-card">
                  <img
                    alt="Barber shop interior"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUJTGk0STN46tjw5crBF-uvWuFf_i7Jk__Pkg-1QU5vLJhNVckC7zs8XSxGp-DrE6x9SuW3OkdTgkCwKrLxuu2DeUNU8WDPSVDfCnwZtCtTuKwNkyPOcgt1oDGm_zfs4Rc0NTd-275Zq15NeMWcWzUlMA5X-mfFh69zpcI5caI9AX_SEAR4rPpwBgwhfqd5Ms2Olbka9wRGd2jwkoliLM9lIWQQPOWEb4OglKXwHzqdsJha398g6gdcIQFvuiQpSrfP8T_wMeaSiE"
                  />
                  <div className="appointments-promo-overlay">
                    <p>Uu dai thanh vien</p>
                    <h4>Giam 20% cho lich hen tiep theo vao ngay thuong</h4>
                    <Link to="/booking">Dat lich ngay</Link>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </main>

      <nav className="appointments-bottom-nav">
        <Link to="/">
          <span className="material-symbols-outlined">home</span>
          <span>Trang chu</span>
        </Link>
        <Link className="active" to="/profile">
          <span className="material-symbols-outlined">event_note</span>
          <span>Lich hen</span>
        </Link>
        <Link to="/booking">
          <span className="material-symbols-outlined">content_cut</span>
          <span>Dat cho</span>
        </Link>
        <Link to="/profile">
          <span className="material-symbols-outlined">person</span>
          <span>Ho so</span>
        </Link>
      </nav>
    </div>
    </PageLayout>
  );
}

export default ProfilePage;
