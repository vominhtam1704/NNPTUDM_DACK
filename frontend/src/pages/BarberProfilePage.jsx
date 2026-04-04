import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPublicBarberProfile } from '../services/barbers';
import { AuthContext } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import './BarberProfilePage.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCFks9e141_81li6G-kIA79-Z18nMyzR5240bCkJhJbclkBj8e_gWupu27176le7A2NEhY1NCqFbL6YqXmXUE20ZlWLz9sbSbcmmNXzbJXlzv7nZPzmEgAkR91KiHSVsEtLzRfrLm_ZHC-L-Jm-U2RwAjYoTPL3hhKs8QpX4HS3RBF1tmGKw2xkmZpyHynoUSoVkpwV57avMK9V_18d6ocL1Y4PfUh2_KHsmonmHXlhM-V_nMO2b-Fd21uQhCN29J2WZC9M-832gxI';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}k`.replace(',000', '');

function BarberProfilePage() {
  const navigate = useNavigate();
  const { barberId } = useParams();
  const { user: authUser } = useContext(AuthContext) || {};
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await getPublicBarberProfile(barberId);
        if (active) {
          setProfile(data);
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
  }, [barberId, refreshKey]);

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

  const { barber = {}, stats = {}, specialties = [], services = [], recentReviews = [], schedule = [] } = profile || {};

  return (
    <PageLayout>
      <div className="barber-profile-page">
        <header className="barber-profile-topbar">
          <div className="topbar-brand">
            <h1>Cat Toc Pro</h1>
            <nav>
              <Link to="/booking">Lich Hen</Link>
              <Link to="/">Khach Hang</Link>
              <Link to="/">Bao Cao</Link>
            </nav>
          </div>

          <div className="topbar-actions">
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              title="Lam tuoi du lieu"
              type="button"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button type="button" title="Thong bao">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" title="Cai dat">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="topbar-avatar">
              <img alt={authUser?.name || 'User'} src={authUser?.avatar || fallbackAvatar} />
            </div>
          </div>
        </header>

      <aside className="barber-profile-sidebar">
        <div className="sidebar-brand">
          <h2>Tiem Toc Nghe Thuat</h2>
          <p>{authUser ? `Xin chao, ${authUser.name}` : 'Quan tri he thong'}</p>
        </div>

        <nav className="sidebar-nav">
          {(() => {
            // Render navigation based on user role
            if (authUser?.role === 'admin') {
              return (
                <>
                  <a className="active" href="/#">
                    <span className="material-symbols-outlined">dashboard</span>
                    Bang Dieu Khien
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">people</span>
                    Quan Ly Nhan Vien
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">content_cut</span>
                    Quan Ly Dich Vu
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">receipt</span>
                    Quan Ly Thanh Toan
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">assessment</span>
                    Bao Cao
                  </a>
                </>
              );
            } else if (authUser?.role === 'barber') {
              return (
                <>
                  <a className="active" href="/#">
                    <span className="material-symbols-outlined">dashboard</span>
                    Bang Dieu Khien
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">calendar_today</span>
                    Lich Lam Viec
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">content_cut</span>
                    Dich Vu Cua Toi
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">star</span>
                    Danh Gia
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">settings_accessibility</span>
                    Ho So Cua Toi
                  </a>
                </>
              );
            } else if (authUser?.role === 'customer') {
              return (
                <>
                  <a className="active" href="/#">
                    <span className="material-symbols-outlined">dashboard</span>
                    Cac Lich Hen
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">bookmark</span>
                    Theo Doi
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">star</span>
                    Danh Gia Cua Toi
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">account_circle</span>
                    Ho So Cu
                  </a>
                </>
              );
            } else {
              // Guest/Not logged in
              return (
                <>
                  <a className="active" href="/#">
                    <span className="material-symbols-outlined">home</span>
                    Trang Chu
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">search</span>
                    Tim Kiem
                  </a>
                  <a href="/#">
                    <span className="material-symbols-outlined">info</span>
                    Thong Tin
                  </a>
                </>
              );
            }
          })()}
        </nav>

        <div className="sidebar-footer">
          <button className="tonal-button" onClick={() => navigate('/booking')} type="button">
            Dat Hen Moi
          </button>
          <button
            className="tonal-button"
            onClick={() => {
              // Handle logout or navigate to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              navigate('/');
            }}
            type="button"
            title="Dang xuat"
          >
            <span className="material-symbols-outlined">logout</span>
            Dang Xuat
          </button>
        </div>
      </aside>

      <main className="barber-profile-shell">
        <section className="hero-section">
          <div className="hero-media">
            <div className="hero-image-wrap">
              <img alt={barber?.name || 'Barber'} src={barber?.avatar || fallbackAvatar} />
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
              <button className="hero-primary-btn" onClick={() => navigate('/booking')} type="button">
                Dat lich ngay
              </button>
              <button className="hero-secondary-btn" type="button">
                Xem Portfolio
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
                    <div>
                      <h4>{service.name || 'Service'}</h4>
                      <p>
                        {service.duration || '--'} phut
                        {service.description ? ` • ${service.description}` : ''}
                      </p>
                    </div>
                    <strong>{formatCurrency(service.price)}</strong>
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
                        src={review.customerId?.avatar || fallbackAvatar}
                      />
                    </div>
                    <div>
                      <strong>{review.customerId?.name || 'Khach hang'}</strong>
                      <span>{review.productId?.name || review.rating || 0} sao</span>
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
            <button onClick={() => navigate('/booking')} type="button">
              Dat ngay
            </button>
          </div>
        </section>
      </main>

      <button className="mobile-fab" onClick={() => navigate('/booking')} type="button">
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
    </PageLayout>
  );
}

export default BarberProfilePage;
