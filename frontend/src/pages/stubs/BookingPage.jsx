import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPublicBarbers } from '../../services/barbers';
import { getProducts } from '../../services/products';
import '../BookingPage.scss';

const bookingSteps = [
  { id: 1, label: 'Dich vu', active: true },
  { id: 2, label: 'Thoi gian' },
  { id: 3, label: 'Chi tiet' },
  { id: 4, label: 'Hoan tat' },
];

const fallbackBarberImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDQEQYxqFRaGGbfxq86kUvBsM1zk9DtiHZOsVRutxsyEi3fIqN_rT7VW4ldDNjHXB1ft5tlKSuYcY6mosTdpEbnz_Up2MBJW7GxHaSZI1AqRd0qjQQ2SyTZZ7E4v1H0wogcXIaRF7r9jkCW2Fev9T9BN-W_EGEG2cPG6ENdJ3uowLlP5QSb7brvshW-aqSkbQRL6yUyDieCktkQGUCrZPUcU6ZeDY2p4CAusn2o9fpsxdUj2-jQR4530hvgc_O3iek7zXfPckFF4lY';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const toServiceViewModel = (service) => ({
  id: service._id,
  name: service.name,
  description: service.description || 'Dich vu cao cap danh cho khach hang cua salon',
  price: Math.max(Number(service.price) || 0, 0),
  duration: Math.max(Number(service.duration) || 30, 30),
});

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(location.state?.selectedBarberId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadBookingData = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const [productsData, barbersData] = await Promise.all([
          getProducts({ limit: 20 }),
          getPublicBarbers({ limit: 20 }),
        ]);

        if (!active) {
          return;
        }

        // Handle API response - can be array or wrapped in { data: [] }
        const productsList = Array.isArray(productsData)
          ? productsData
          : productsData?.data || productsData?.result || [];
        const barbersList = Array.isArray(barbersData)
          ? barbersData
          : barbersData?.data || barbersData?.result || [];

        const nextServices = productsList.filter((item) => item?.isActive !== false);
        const nextBarbers = barbersList;

        setServices(nextServices);
        setBarbers(nextBarbers);

        setSelectedServiceIds((current) => current.length > 0 ? current : []);
        setSelectedBarberId((current) => {
          if (current) {
            return current;
          }
          const preferredBarber =
            nextBarbers.find((barber) => barber._id === location.state?.selectedBarberId) || nextBarbers[0];
          return preferredBarber?._id || '';
        });
      } catch (error) {
        if (active) {
          setErrorMessage(error?.message || 'Khong the tai du lieu dat lich.');
          setServices([]);
          setBarbers([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadBookingData();

    return () => {
      active = false;
    };
  }, [location.state?.selectedBarberId]);

  const chosenServices = useMemo(() => {
    const filtered = services.filter((service) => selectedServiceIds.includes(service._id));
    const mapped = filtered.map(toServiceViewModel);
    return mapped;
  }, [selectedServiceIds, services]);

  const total = useMemo(
    () => chosenServices.reduce((sum, service) => sum + service.price, 0),
    [chosenServices]
  );

  const handleServiceToggle = (serviceId) => {
    setSelectedServiceIds((current) => {
      const updated = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];
      return updated;
    });
    // Clear error when user selects services
    setErrorMessage('');
  };

  const selectedBarber = useMemo(() => {
    const matchedBarber =
      barbers.find((barber) => barber._id === selectedBarberId) ||
      barbers.find((barber) => barber._id === location.state?.selectedBarberId) ||
      barbers[0] ||
      null;

    if (!matchedBarber) {
      return {
        _id: '',
        name: location.state?.selectedBarberName || 'Dang cap nhat',
        rating: 0,
        totalReviews: 0,
        avatar: location.state?.selectedBarberAvatar || fallbackBarberImage,
      };
    }

    return matchedBarber;
  }, [barbers, location.state, selectedBarberId]);

  const handleContinue = () => {
    if (chosenServices.length === 0 || !selectedBarber?._id) {
      setErrorMessage('Vui long chon it nhat mot dich vu va tho cat truoc khi tiep tuc.');
      return;
    }

    // Calculate total duration (sum of all selected services)
    const totalDuration = chosenServices.reduce((sum, service) => sum + service.duration, 0);

    navigate('/booking/time', {
      state: {
        selectedServiceIds: selectedServiceIds,
        selectedServices: chosenServices,
        selectedServiceNames: chosenServices.map((s) => s.name).join(' + '),
        selectedServicePrices: chosenServices.map((s) => s.price),
        selectedServiceTotal: total,
        selectedServiceDuration: totalDuration,
        selectedBarberId: selectedBarber._id,
        selectedBarberName: selectedBarber.name,
        selectedBarberAvatar: selectedBarber.avatar || fallbackBarberImage,
        selectedBarberRating: Number(selectedBarber.rating || 0),
        selectedBarberReviews: Number(selectedBarber.totalReviews || 0),
        preferredDate: location.state?.preferredDate || '',
      },
    });
  };

  return (
    <div className="booking-page">
      <nav className="booking-topbar">
        <div className="booking-brand">Artisan Ledger</div>
        <div className="booking-topbar-actions">
          <span className="material-symbols-outlined">notifications</span>
          <span className="material-symbols-outlined">account_circle</span>
        </div>
      </nav>

      <main className="booking-content">
        <section className="booking-stepper">
          <div className="booking-stepper-line" />
          {bookingSteps.map((step) => (
            <div className="booking-step" key={step.id}>
              <div className={`booking-step-circle${step.active ? ' active' : ''}`}>{step.id}</div>
              <span className={step.active ? 'active' : ''}>{step.label}</span>
            </div>
          ))}
        </section>

        <div className="booking-grid">
          <section className="booking-services">
            <header className="booking-header">
              <h1>Chon dich vu</h1>
              <p>Ca nhan hoa trai nghiem cat toc cua ban voi cac goi dich vu cao cap.</p>
            </header>

            {isLoading ? <div className="booking-card">Dang tai dich vu...</div> : null}
            {!isLoading && errorMessage ? <div className="booking-card">{errorMessage}</div> : null}

            <div className="booking-service-list">
              {services.map((service) => {
                const checked = selectedServiceIds.includes(service._id);

                return (
                  <label className={`service-card${checked ? ' selected' : ''}`} key={service._id}>
                    <input
                      checked={checked}
                      onChange={() => handleServiceToggle(service._id)}
                      type="checkbox"
                    />

                    <div className="service-card-main">
                      <div className={`service-checkbox${checked ? ' checked' : ''}`}>
                        <span className="material-symbols-outlined filled">check</span>
                      </div>

                      <div className="service-copy">
                        <h3>{service.name}</h3>
                        <p>{service.description || 'Dich vu duoc thiet ke cho trai nghiem cao cap.'}</p>
                        <small style={{ color: '#666' }}>{service.duration} phut</small>
                      </div>
                    </div>

                    <div className="service-price">{Math.round(Number(service.price || 0) / 1000)}k</div>
                    <div className="service-accent" />
                  </label>
                );
              })}
            </div>
          </section>

          <aside className="booking-sidebar">
            <div className="booking-card barber-card-panel">
              <h4>Tho cat da chon</h4>
              <div className="barber-panel-content">
                <div className="barber-panel-avatar">
                  <img alt={selectedBarber.name} src={selectedBarber.avatar || fallbackBarberImage} />
                  <div className="barber-verified">
                    <span className="material-symbols-outlined filled">verified</span>
                  </div>
                </div>

                <div>
                  <p className="barber-name">{selectedBarber.name}</p>
                  <div className="barber-meta">
                    <span className="material-symbols-outlined filled">star</span>
                    <span className="rating-value">
                      {Number(selectedBarber.rating || 0).toFixed(1)}
                    </span>
                    <span className="review-count">
                      ({Number(selectedBarber.totalReviews || 0)} danh gia)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="booking-card summary-panel">
              <h4>Tam tinh ({chosenServices.length} dich vu)</h4>
              
              {chosenServices.length > 0 ? (
                <>
                  <div className="summary-items">
                    {chosenServices.map((service) => (
                      <div className="summary-item" key={service.id}>
                        <span>{service.name}</span>
                        <span>{formatCurrency(service.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="summary-total" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                    <span>Tong cong</span>
                    <strong style={{ fontSize: '1.25rem', color: '#006362' }}>{formatCurrency(total)}</strong>
                  </div>
                </>
              ) : (
                <div className="summary-items">
                  <div className="summary-item empty" style={{ textAlign: 'center', color: '#999', padding: '2rem 0' }}>
                    Chon dich vu de xem gia
                  </div>
                </div>
              )}
            </div>

            <div className="booking-action-wrap">
              <button className="booking-continue" onClick={handleContinue} type="button">
                Tiep tuc buoc 2
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <p>Xem lai lua chon truoc khi tiep tuc</p>
            </div>
          </aside>
        </div>
      </main>

      <nav className="booking-bottom-nav">
        <div className="booking-bottom-item">
          <span className="material-symbols-outlined">home</span>
          <span>Trang chu</span>
        </div>
        <div className="booking-bottom-item active">
          <span className="material-symbols-outlined">content_cut</span>
          <span>Dat lich</span>
        </div>
        <div className="booking-bottom-item">
          <span className="material-symbols-outlined">event_note</span>
          <span>Lich cua toi</span>
        </div>
        <div className="booking-bottom-item">
          <span className="material-symbols-outlined">person</span>
          <span>Ho so</span>
        </div>
      </nav>
    </div>
  );
};

export default BookingPage;
