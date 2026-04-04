import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPublicBarbers } from '../services/barbers';
import AppSidebar from '../components/AppSidebar';
import './HomePage.scss';

const bottomNavItems = [
  { icon: 'home', label: 'Home', to: '/', active: true, filled: true },
  { icon: 'content_cut', label: 'Book', to: '/booking' },
  { icon: 'event_note', label: 'My Trips', to: '/profile' },
  { icon: 'person', label: 'Profile', to: '/account' },
];

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    let active = true;

    const loadBarbers = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicBarbers({ limit: 6 });
        if (active) {
          setBarbers(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (active) {
          setBarbers([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadBarbers();
    return () => {
      active = false;
    };
  }, []);

  const filteredBarbers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) {
      return barbers;
    }

    return barbers.filter((barber) => {
      const tags = Array.isArray(barber.tags) ? barber.tags.join(' ') : '';
      return [barber.name, barber.bio, tags].join(' ').toLowerCase().includes(keyword);
    });
  }, [barbers, searchText]);

  const handleSearch = () => {
    navigate('/booking', {
      state: {
        searchKeyword: searchText,
        preferredDate: dateText,
      },
    });
  };

  const handleBookBarber = (barber) => {
    navigate('/booking', {
      state: {
        selectedBarberId: barber._id,
        selectedBarberName: barber.name,
        selectedBarberAvatar: barber.avatar,
        preferredDate: dateText,
      },
    });
  };

  return (
    <div className="home-editorial-page">
      <nav className="editorial-topbar">
        <div className="editorial-brand">
          <span className="brand-title">Artisan Ledger</span>
          <span className="brand-subtitle">The Atelier</span>
        </div>

        <div className="editorial-topbar-actions">
          <button type="button">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button onClick={() => navigate('/account')} type="button">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </nav>

      <AppSidebar />

      <main className="editorial-home-content">
        <header className="editorial-welcome">
          <div>
            <p className="eyebrow">Xin chao</p>
            <h1>
              Chao mung,
              <br />
              {user?.name || 'Nguyen Van A'}!
            </h1>
          </div>

          <div className="editorial-quote">
            <p>"Phong cach la mot cach de noi ban la ai ma khong can phai noi."</p>
          </div>
        </header>

        <section className="editorial-hero-section">
          <div className="editorial-hero-banner">
            <img
              alt="High-end barber shop interior"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIkU6Lk2Doqh3gbFKPVUSvRUZIXkvvX4XNozCKgrFsglmw8rQhpqOtDwP-VGe2YI0xH9uPmY5WXgMoBabPc2_SxWsKqUGIE09rImPLpMHNB07OGbtXTuhXAi8OC0aapNuiCrsntpjZDk_-hULF98WfJYQcJ1TEUDczln9uC3QHzvv2M7vjoEKEB3f9BLLZDtfpwzZ6W7mpPo9et5sufEj8saxtBxJr0-_JQxaBZs-cOlY29UUvQPuQ2bWMuStRdsURUwkw8JmlB1E"
            />
            <div className="editorial-hero-overlay" />
            <div className="editorial-hero-copy">
              <h2>Nang tam phong cach</h2>
              <p>Tim kiem nhung nghe nhan cat toc hang dau ngay hom nay.</p>
            </div>
          </div>

          <div className="editorial-search-panel">
            <label className="editorial-search-field">
              <span className="material-symbols-outlined">person_search</span>
              <input
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Tho cat, Dich vu..."
                type="text"
                value={searchText}
              />
            </label>

            <label className="editorial-search-field">
              <span className="material-symbols-outlined">calendar_month</span>
              <input
                onChange={(event) => setDateText(event.target.value)}
                placeholder="Ngay hen"
                type="text"
                value={dateText}
              />
            </label>

            <button className="editorial-search-button" onClick={handleSearch} type="button">
              <span className="material-symbols-outlined">search</span>
              TIM KIEM
            </button>
          </div>
        </section>

        <section className="editorial-barbers-section">
          <div className="editorial-section-header">
            <h2>Tho cat hang dau</h2>
            <button onClick={() => setSearchText('')} type="button">
              Xem tat ca
            </button>
          </div>

          <div className="editorial-barber-grid">
            {isLoading ? <div className="editorial-state-card">Dang tai danh sach tho cat...</div> : null}
            {!isLoading && filteredBarbers.length === 0 ? (
              <div className="editorial-state-card">Chua co tho cat nao phu hop voi tu khoa tim kiem.</div>
            ) : null}
            {!isLoading &&
              filteredBarbers.map((barber) => (
                <article className="editorial-barber-card" key={barber._id}>
                <div className="editorial-barber-image">
                  <img
                    alt={barber.name}
                    src={
                      barber.avatar ||
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuCmGwplljQBcbApbTFLxPYBHZjxBm0P7PxjKHwh6aFnM9aSnjvK1Tvk4tKO_umhV2KNWWriWRVcBdhhxE5Jp7a7YK7LJKsfJkSHholA_Gi2jXdPQ42jEk_m-qLZtBWEOS_tXNeYdCyO7dDwj87S0q-jL-TfJdtl47xIXRKLi1goaU2T4K6EFJzCAWJ_ctbs_nFrsk5QoVkvKhIP2PpQDQVnxbI3X3An3lBlDui41Aw5uPiuHWHlIPeP-3BzRiZo_9D_OiCesJKy8nA'
                    }
                  />

                  <div className="editorial-rating-chip">
                    <span className="material-symbols-outlined filled">star</span>
                    <span>{barber.rating?.toFixed ? barber.rating.toFixed(2) : barber.rating || '0.00'}</span>
                  </div>
                </div>

                <div className="editorial-barber-content">
                  <div className="editorial-accent-bar" />
                  <div className="editorial-barber-head">
                    <h3>{barber.name}</h3>
                    <div className="editorial-tag-list">
                      {(barber.tags?.length ? barber.tags : ['Styling', 'Premium']).slice(0, 2).map((tag, index) => (
                        <span className={`editorial-tag${index === 0 ? ' primary' : ''}`} key={`${barber._id}-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p>{barber.bio}</p>
                  <div className="editorial-review-summary">
                    <div className="editorial-review-stats">
                      <span className="material-symbols-outlined filled">star</span>
                      <strong>{barber.rating?.toFixed ? barber.rating.toFixed(1) : barber.rating || '0.0'}</strong>
                      <span>({barber.totalReviews || 0} danh gia)</span>
                    </div>
                    {barber.reviewPreview?.comment ? (
                      <blockquote>
                        "{barber.reviewPreview.comment}"
                        <footer>{barber.reviewPreview.customerName}</footer>
                      </blockquote>
                    ) : (
                      <blockquote>
                        "Chua co review cong khai. Hay dat lich de tro thanh nguoi dau tien danh gia."
                      </blockquote>
                    )}
                  </div>

                  <div className="editorial-card-actions">
                    <button onClick={() => navigate(`/barbers/${barber._id}`)} type="button">
                      XEM HO SO
                    </button>
                    <button className="secondary" onClick={() => handleBookBarber(barber)} type="button">
                      DAT LICH THO NAY
                    </button>
                  </div>
                </div>
              </article>
              ))}
          </div>
        </section>
      </main>

      <nav className="editorial-bottom-nav">
        {bottomNavItems.map((item) => (
          <Link className={`editorial-bottom-nav-item${item.active ? ' active' : ''}`} key={item.label} to={item.to}>
            <span className={`material-symbols-outlined${item.filled ? ' filled' : ''}`}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default HomePage;
