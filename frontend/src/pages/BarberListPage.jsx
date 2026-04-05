import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicBarbers } from '../services/barbers';
import PageLayout from '../components/PageLayout';
import './BarberListPage.scss';

const fallbackBarberImage = 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800';

const getAvatarUrl = (path) => {
  if (!path) return fallbackBarberImage;
  if (path.startsWith('http')) return path;
  const baseUrl = '';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

function BarberListPage() {
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadBarbers = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getPublicBarbers({ limit: 50 }); // Fetch more for the list page
        if (active) {
          const barberList = Array.isArray(response) ? response : response?.data || response?.result || [];
          setBarbers(barberList);
        }
      } catch (err) {
        if (active) {
          setError('Không thể tải danh sách thợ cắt tóc. Vui lòng thử lại sau.');
          console.error('Barber List Error:', err);
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

  const handleBookBarber = (barber) => {
    navigate(`/booking?barberId=${barber._id}`, {
      state: {
        selectedBarberId: barber._id,
        selectedBarberName: barber.name,
        selectedBarberAvatar: barber.avatar,
      },
    });
  };

  return (
    <PageLayout>
      <div className="barber-list-page">
        <main className="barber-list-content">
          <header className="barber-list-header">
            <div className="header-copy">
              <span className="eyebrow">ĐỘI NGŨ NGHỆ NHÂN</span>
              <h1>Những Đôi Tay Vàng</h1>
              <p>Khám phá đội ngũ chuyên gia tận tâm, sẵn sàng mang đến cho bạn diện mạo hoàn hảo nhất.</p>
            </div>
            
            <button className="back-home-btn" onClick={() => navigate('/home')}>
              <span className="material-symbols-outlined">arrow_back</span>
              QUAY LẠI
            </button>
          </header>

          <section className="barber-grid-container">
            {isLoading ? (
              <div className="list-status">Đang nạp danh sách thợ cắt...</div>
            ) : null}
            
            {!isLoading && error ? (
              <div className="list-status error">{error}</div>
            ) : null}

            {!isLoading && !error && barbers.length === 0 ? (
              <div className="list-status">Hiện tại chưa có thợ cắt tóc nào trực tuyến.</div>
            ) : null}

            {!isLoading && !error && (
              <div className="barber-full-grid">
                {barbers.map((barber) => (
                  <article className="barber-item-card" key={barber._id}>
                    <div className="barber-card-media" onClick={() => navigate(`/barbers/${barber._id}`)}>
                      <img
                        alt={barber.name}
                        src={getAvatarUrl(barber.avatar)}
                      />
                      <div className="barber-card-overlay">
                        <span className="material-symbols-outlined">visibility</span>
                        XEM HỒ SƠ
                      </div>
                      <div className="barber-rating-badge">
                        <span className="material-symbols-outlined filled">star</span>
                        <span>{barber.rating?.toFixed ? barber.rating.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                    <div className="barber-card-info">
                      <div className="barber-head">
                        <h3>{barber.name}</h3>
                        <span className="barber-years">
                          {barber.totalAppointments || 0}+ lượt đặt chỗ
                        </span>
                      </div>

                      <p className="barber-bio-short">
                        {barber.bio || 'Chuyên gia tạo mẫu tóc với phong cách hiện đại và tư vấn tận tâm cho khách hàng.'}
                      </p>

                      <div className="barber-card-tags">
                        {(barber.tags && barber.tags.length > 0 ? barber.tags : ['Fade', 'Shave', 'Style']).slice(0, 3).map((tag) => (
                          <span className="barber-tag" key={`${barber._id}-${tag}`}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="barber-card-footer">
                        <button 
                          className="btn-profile"
                          onClick={() => navigate(`/barbers/${barber._id}`)}
                        >
                          CHI TIẾT
                        </button>
                        <button 
                          className="btn-book-now"
                          onClick={() => handleBookBarber(barber)}
                        >
                          ĐẶT LỊCH
                          <span className="material-symbols-outlined">event_available</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </PageLayout>
  );
}

export default BarberListPage;
