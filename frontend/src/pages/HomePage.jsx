import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getPublicBarbers } from '../services/barbers';
import PageLayout from '../components/PageLayout';
import './HomePage.scss';

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
        const response = await getPublicBarbers({ limit: 6 });
        if (active) {
          const barberList = Array.isArray(response) ? response : response?.data || response?.result || [];
          setBarbers(barberList);
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
    <PageLayout>
      <div className="home-editorial-page">
        <main className="editorial-home-content">
          <header className="editorial-welcome">
            <div className="welcome-text">
              <p className="eyebrow">CHÀO MỪNG TRỞ LẠI</p>
              <h1>
                Xin chào,
                <br />
                {user?.name || 'Quý khách'}!
              </h1>
            </div>

            <div className="editorial-quote">
              <p>"Phong cách là tấm gương phản chiếu tâm hồn mà không cần lời nói."</p>
            </div>
          </header>

          <section className="editorial-hero-section">
            <div className="editorial-hero-banner">
              <img
                alt="High-end barber shop interior"
                src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070"
              />
              <div className="editorial-hero-overlay" />
              <div className="editorial-hero-copy">
                <span className="hero-eyebrow">DỊCH VỤ THƯỢNG HẠNG</span>
                <h2>Nâng tầm diện mạo</h2>
                <p>Khám phá không gian nghệ thuật và những bàn tay vàng từ Barber Atelier.</p>
                <button 
                  className="hero-cta" 
                  onClick={() => navigate('/booking')}
                  type="button"
                >
                  ĐẶT LỊCH NGAY
                </button>
              </div>
            </div>

            <div className="editorial-search-panel">
              <div className="search-group">
                <label className="editorial-search-field">
                  <span className="material-symbols-outlined">person_search</span>
                  <input
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Tìm kiếm Thợ cắt, Dịch vụ..."
                    type="text"
                    value={searchText}
                  />
                </label>

                <label className="editorial-search-field">
                  <span className="material-symbols-outlined">calendar_month</span>
                  <input
                    onChange={(event) => setDateText(event.target.value)}
                    placeholder="Chọn ngày hẹn"
                    type="text"
                    value={dateText}
                  />
                </label>
              </div>

              <button className="editorial-search-button" onClick={handleSearch} type="button">
                <span className="material-symbols-outlined">search</span>
                <span>TÌM KIẾM</span>
              </button>
            </div>
          </section>

          <section className="editorial-barbers-section">
            <div className="editorial-section-header">
              <div className="header-titles">
                <h2>Nghệ Nhân Hàng Đầu</h2>
                <p>Đội ngũ chuyên gia được tuyển chọn kỹ lưỡng</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/booking')} type="button">
                Xem tất cả <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>

            <div className="editorial-barber-grid">
              {isLoading ? (
                <div className="editorial-status">Đang nạp danh sách thợ cắt...</div>
              ) : null}
              
              {!isLoading && filteredBarbers.length === 0 ? (
                <div className="editorial-status">Không tìm thấy thợ cắt nào phù hợp.</div>
              ) : null}

              {!isLoading &&
                filteredBarbers.map((barber) => (
                  <article className="editorial-barber-card" key={barber._id}>
                    <div className="editorial-barber-image">
                      <img
                        alt={barber.name}
                        src={barber.avatar || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800'}
                      />
                      <div className="editorial-rating-chip">
                        <span className="material-symbols-outlined filled">star</span>
                        <span>{barber.rating?.toFixed ? barber.rating.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                    <div className="editorial-barber-content">
                      <div className="editorial-accent-bar" />
                      <div className="editorial-barber-head">
                        <h3>{barber.name}</h3>
                        <p className="barber-experience">10 năm kinh nghiệm</p>
                      </div>

                      <p className="barber-bio">{barber.bio || 'Chuyên gia tạo mẫu tóc với hơn 10 năm kinh nghiệm trong ngành.'}</p>
                      
                      <div className="editorial-tag-list">
                        {(barber.tags?.length ? barber.tags : ['Classic Cut', 'Shaving']).slice(0, 3).map((tag, index) => (
                          <span className={`editorial-tag${index === 0 ? ' primary' : ''}`} key={`${barber._id}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="editorial-card-actions">
                        <button 
                          className="btn-details"
                          onClick={() => navigate(`/barbers/${barber._id}`)} 
                          type="button"
                        >
                          CHI TIẾT
                        </button>
                        <button 
                          className="btn-book" 
                          onClick={() => handleBookBarber(barber)} 
                          type="button"
                        >
                          ĐẶT LỊCH
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  );
}

export default HomePage;
