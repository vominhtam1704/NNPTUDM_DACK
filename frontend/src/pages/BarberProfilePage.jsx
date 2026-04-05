import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPublicBarberProfile } from '../services/barbers';
import PageLayout from '../components/PageLayout';
import './BarberProfilePage.scss';

const fallbackAvatar =
  'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}k`.replace(',000', '');

const getAvatarUrl = (path) => {
  if (!path) return fallbackAvatar;
  if (path.startsWith('http')) return path;
  const baseUrl = '';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

function BarberProfilePage() {
  const navigate = useNavigate();
  const { barberId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getPublicBarberProfile(barberId);
        if (active && data.success) {
          setProfile(data.data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Khong the tai ho so tho cat toc');
          console.error('Barber profile error:', err);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (barberId) {
      loadProfile();
    }
    
    return () => {
      active = false;
    };
  }, [barberId]);

  if (isLoading) {
    return (
      <div className="barber-profile-page">
        <main className="barber-profile-shell state-shell">
          <section className="state-card">Dang tai ho so tho cat toc...</section>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="barber-profile-page">
        <main className="barber-profile-shell state-shell">
          <section className="state-card">
            <h1>Khong tim thay ho so</h1>
            <p>{error || 'Du lieu barber hien khong kha dung.'}</p>
            <Link className="hero-primary-btn" to="/">
              Ve trang chu
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const { barber = {}, stats = {}, specialties = [], services = [], reviews: recentReviews = [], schedule = [] } = profile || {};

  return (
    <PageLayout>
      <div className="barber-profile-page">
        <main className="barber-profile-shell">
        <section className="hero-section">
          <div className="hero-media">
            <div className="hero-image-wrap">
              <img alt={barber?.name || 'Barber'} src={getAvatarUrl(barber?.avatar)} />
            </div>

            <div className="hero-stats-card">
              <div>
                <strong>{stats?.averageRating?.toFixed(1) || '0.0'}</strong>
                <span>Danh gia</span>
              </div>
              <div className="divider" />
              <div>
                <strong>{stats?.yearsActive || 1}+</strong>
                <span>Nam EXP</span>
              </div>
            </div>
          </div>

          <div className="hero-copy">
            <div className="hero-copy-head">
              <span className="role-chip">Master Barber</span>
              <h2>{barber?.name || 'Barber Name'}</h2>
              <p className="hero-quote">
                {barber?.bio ||
                  'Nghe thuat khong chi nam o duong keo, ma con o cach chung toi lang nghe cau chuyen cua khach hang.'}
              </p>
            </div>

            <div className="hero-details-grid">
              <div>
                <p className="section-kicker">Chuyen mon</p>
                <ul>
                  {specialties && specialties.length > 0
                    ? specialties.map((specialty) => <li key={specialty}>{specialty}</li>)
                    : ['Fade & Taper', 'Pompadour Classic', 'Beard Sculpting'].map((specialty) => (
                        <li key={specialty}>{specialty}</li>
                      ))}
                </ul>
              </div>

              <div>
                <p className="section-kicker">Kinh nghiem</p>
                <p>
                  Da phuc vu {stats?.completedAppointments || 0} luot hen. Hoat dong tren he thong tu{' '}
                  {barber?.createdAt ? new Date(barber.createdAt).getFullYear() : 'nam khong xac dinh'} va duy tri chat luong on dinh cho khach hang.
                </p>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                className="hero-primary-btn" 
                onClick={() => navigate(`/booking?barberId=${barber._id}`, { 
                  state: { 
                    selectedBarberId: barber._id, 
                    selectedBarberName: barber.name, 
                    selectedBarberAvatar: barber.avatar 
                  } 
                })} 
                type="button"
              >
                Dat lich ngay
              </button>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="services-card">
            <div className="section-header">
              <h3>Danh muc dich vu</h3>
              <span>{services?.length || 0} Dich vu</span>
            </div>

            <div className="service-grid">
              {services && services.length > 0 ? (
                services.map((service) => (
                  <article className="service-item" key={service._id || service.name}>
                    <div className="service-accent" />
                    <div className="service-content">
                      <h4>{service.name || 'Service'}</h4>
                      <p>
                        {service.duration || '--'} phut
                        {service.description ? ` • ${service.description}` : ''}
                      </p>
                      <strong>{formatCurrency(service.price)}</strong>
                    </div>
                    <button 
                      className="service-book-btn" 
                      onClick={() => navigate(`/booking?barberId=${barber._id}&serviceId=${service._id}`, { 
                        state: { 
                          selectedBarberId: barber._id, 
                          selectedBarberName: barber.name, 
                          selectedBarberAvatar: barber.avatar,
                          selectedServiceIds: [service._id]
                        } 
                      })}
                    >
                      Dat cho
                    </button>
                  </article>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <p>Chua co dich vu nao duoc them</p>
                </div>
              )}
            </div>
          </div>

          <div className="schedule-card">
            <h3>Lich lam viec</h3>
            <div className="schedule-list">
              {schedule && schedule.length > 0 ? (
                schedule.map((item) => (
                  <div className={`schedule-row${item.isOff ? ' off' : ''}`} key={`${item.label}-schedule`}>
                    <span>{item.label || 'Day'}</span>
                    <strong>{item.hours || 'N/A'}</strong>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#999' }}>
                  <p>Chua co lich lam viec</p>
                </div>
              )}
            </div>

            <div className="schedule-foot">
              <span className="material-symbols-outlined">event_available</span>
              <p>
                Hien dang co{' '}
                <strong>
                  {stats?.availableTodaySlots !== undefined
                    ? stats.availableTodaySlots
                    : '0'}
                </strong>{' '}
                cho trong trong hom nay
              </p>
            </div>
          </div>

          <div className="reviews-card">
            {recentReviews && recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <article className="review-item" key={review._id || Math.random()}>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <span className="material-symbols-outlined filled" key={`${review._id}-${starIndex}`}>
                        {starIndex < Math.floor(review.rating || 0)
                          ? 'star'
                          : starIndex < (review.rating || 0)
                          ? 'star_half'
                          : 'star_outline'}
                      </span>
                    ))}
                  </div>
                  <p>
                    &quot;{review.comment || 'Khach hang da de lai danh gia tich cuc cho tho cat toc nay.'}
                    &quot;
                  </p>
                  <div className="review-author">
                    <div className="review-avatar">
                      <img
                        alt={review.customerId?.name || 'Khach hang'}
                        src={getAvatarUrl(review.customerId?.avatar)}
                      />
                    </div>
                    <div>
                      <strong>{review.customerId?.name || 'Khách hàng'}</strong>
                      <span>{review.rating || 0} sao {review.productId?.name ? ` • ${review.productId.name}` : ''}</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <article className="review-item">
                <div className="review-stars">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <span className="material-symbols-outlined filled" key={starIndex}>
                      star
                    </span>
                  ))}
                </div>
                <p>
                  &quot;Tho cat toc nay chua co review cong khai. Hay dat lich va tro thanh nguoi dau tien de lai
                  nhan xet.&quot;
                </p>
                <div className="review-author">
                  <div>
                    <strong>He thong</strong>
                    <span>Cho danh gia dau tien</span>
                  </div>
                </div>
              </article>
            )}
          </div>

          <div className="cta-card">
            <div>
              <h4>Ban muon mot dien mao moi?</h4>
              <p>
                Hay chon thoi gian phu hop nhat voi ban va trai nghiem dich vu cham soc toc chuyen
                nghiep tu {barber?.name || 'Master Barber'}.
              </p>
            </div>
            <button 
              onClick={() => navigate(`/booking?barberId=${barber._id}`, { 
                state: { 
                  selectedBarberId: barber._id, 
                  selectedBarberName: barber.name, 
                  selectedBarberAvatar: barber.avatar 
                } 
              })} 
              type="button"
            >
              Dat ngay
            </button>
          </div>
        </section>
      </main>

      <button 
        className="mobile-fab" 
        onClick={() => navigate(`/booking?barberId=${barber._id}`, { 
          state: { 
            selectedBarberId: barber._id, 
            selectedBarberName: barber.name, 
            selectedBarberAvatar: barber.avatar 
          } 
        })} 
        type="button"
      >
        <span className="material-symbols-outlined">calendar_month</span>
      </button>
    </div>
    </PageLayout>
  );
}

export default BarberProfilePage;
