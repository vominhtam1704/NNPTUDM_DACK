import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createReservation } from '../../services/reservations';
import '../BookingDetailsPage.scss';

const fallbackBarberImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCX-HLAPDHidwv5MLmzEVx3HW-1a9rnom5vrBl-o1rPff7O_URfPq8yZd7wjl2j2N_desUXuTggD2w3SeAATkWSRyS_i0VvKC7NbWC9GydrNep7zSGCzISwkBghJxwDo4Tvb96FvET0I1bwlIlbIFmWSwhh-a3c_crAPiLyUoab9fXSkQkIb6nm5ZJhSZ9Lz1jVihQ496uGKhOg9x0gb7bSjoRkRIpsBmcX5W7OGDQTR9Fm3CTAIGzdWMQyDbTb0VDP0O4ShG29XFM';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const BookingDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    note: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookingState = useMemo(() => location.state || {}, [location.state]);
  const selectedService = useMemo(() => {
    // NEW: Handle multiple services format from BookingPage
    if (bookingState.selectedServices && Array.isArray(bookingState.selectedServices)) {
      return {
        isMultiple: true,
        services: bookingState.selectedServices || [],
        names: bookingState.selectedServiceNames || 'Multiple services',
        totalPrice: bookingState.selectedServiceTotal || 0,
      };
    }

    // FALLBACK: Handle legacy single service format
    return {
      isMultiple: false,
      id: bookingState.selectedServiceId || '',
      name: bookingState.selectedServiceName || 'Executive Fade & Style',
      description: bookingState.selectedServiceDescription || 'Cat toc, tao kieu va Goi dau',
      price: Number(bookingState.selectedServicePrice || 450000),
    };
  }, [bookingState]);

  const selectedBarber = useMemo(
    () => ({
      id: bookingState.selectedBarberId || '',
      name: bookingState.selectedBarberName || 'Marcello V.',
      avatar: bookingState.selectedBarberAvatar || fallbackBarberImage,
    }),
    [bookingState]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Get service IDs based on format (multiple or single)
    const serviceIds = selectedService.isMultiple
      ? bookingState.selectedServices.map((s) => s._id || s.id)
      : [selectedService.id];

    if (serviceIds.length === 0 || !selectedBarber.id || !bookingState.selectedDate || !bookingState.selectedTime) {
      setErrorMessage('Thong tin dat lich chua day du. Vui long quay lai chon dich vu va thoi gian.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Build service names and calculate total
      const serviceNames = selectedService.isMultiple 
        ? bookingState.selectedServices.map(s => s.name).join(' + ')
        : selectedService.name;
      
      const totalPrice = selectedService.isMultiple 
        ? bookingState.selectedServiceTotal 
        : selectedService.price;

      // Create single reservation with all service info
      const reservation = await createReservation({
        barberId: selectedBarber.id,
        serviceId: serviceIds[0], // Use first service as primary
        serviceIds: selectedService.isMultiple ? serviceIds : undefined, // Send all serviceIds if multiple
        appointmentDate: bookingState.selectedDate,
        appointmentTime: bookingState.selectedTime,
        totalPrice: totalPrice, // Send calculated total for multiple services
        notes: formData.note ? `${serviceNames} | ${formData.note}` : serviceNames,
      });

      navigate(`/payment/${reservation._id}`, {
        state: {
          ...bookingState,
          reservation,
          customerNote: formData.note,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: formData.email,
        },
      });
    } catch (error) {
      setErrorMessage(error?.message || 'Khong the tao lich hen. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="booking-details-page">
      <header className="details-topbar">
        <div className="details-topbar-inner">
          <div className="details-brand">The Atelier</div>
          <nav className="details-nav">
            <a href="/#">Portfolio</a>
            <a href="/#">Services</a>
            <a className="active" href="/#">
              Appointments
            </a>
          </nav>
          <div className="details-topbar-actions">
            <button type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            <button className="book-now-btn" type="button">
              Book Now
            </button>
          </div>
        </div>
      </header>

      <main className="details-content">
        <section className="details-stepper">
          <div className="step-track" />
          <div className="step-track active" />

          <div className="step-item done">
            <div className="step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Dich vu</span>
          </div>
          <div className="step-item done">
            <div className="step-circle">
              <span className="material-symbols-outlined filled">check</span>
            </div>
            <span>Thoi gian</span>
          </div>
          <div className="step-item active">
            <div className="step-circle">3</div>
            <span>Thong tin</span>
          </div>
          <div className="step-item">
            <div className="step-circle">4</div>
            <span>Xac nhan</span>
          </div>
          <div className="step-item">
            <div className="step-circle">5</div>
            <span>Hoan tat</span>
          </div>
        </section>

        <div className="details-grid">
          <section className="details-form-wrap">
            <div className="details-header">
              <h1>Chi tiet thong tin</h1>
              <p>
                Vui long cung cap thong tin lien he cua ban de chung toi co the phuc vu tot
                nhat.
              </p>
            </div>

            {errorMessage ? <div className="summary-note">{errorMessage}</div> : null}

            <form className="details-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field">
                  <span>Ho va ten</span>
                  <input
                    name="fullName"
                    onChange={handleChange}
                    placeholder="Nguyen Van A"
                    type="text"
                    value={formData.fullName}
                  />
                </label>

                <label className="field">
                  <span>So dien thoai</span>
                  <input
                    name="phone"
                    onChange={handleChange}
                    placeholder="090 123 4567"
                    type="tel"
                    value={formData.phone}
                  />
                </label>
              </div>

              <label className="field">
                <span>Dia chi Email</span>
                <input
                  name="email"
                  onChange={handleChange}
                  placeholder="email@example.com"
                  type="email"
                  value={formData.email}
                />
              </label>

              <label className="field">
                <span>Ghi chu them</span>
                <textarea
                  name="note"
                  onChange={handleChange}
                  placeholder="Ban co yeu cau dac biet nao khong? (Vi du: Kieu toc mong muon, di ung...)"
                  rows="4"
                  value={formData.note}
                />
              </label>

              <div className="form-actions">
                <button className="back-btn" onClick={() => navigate('/booking/time', { state: bookingState })} type="button">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Quay lai
                </button>

                <button className="next-btn" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Dang tao lich...' : 'Tiep tuc buoc 4'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </form>
          </section>

          <aside className="details-sidebar">
            <div className="summary-panel">
              <h3>
                <span className="material-symbols-outlined filled">list_alt</span>
                Tom tat lich hen
              </h3>

              <div className="summary-content">
                <div className="summary-service">
                  <p className="eyebrow">Dich vu da chon</p>
                  {selectedService.isMultiple ? (
                    <div className="summary-services-list">
                      {selectedService.services.map((service) => (
                        <div key={service._id || service.id} className="summary-row">
                          <div>
                            <h4>{service.name}</h4>
                            <p>{service.description}</p>
                          </div>
                          <span>{formatCurrency(service.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="summary-row">
                      <div>
                        <h4>{selectedService.name}</h4>
                        <p>{selectedService.description}</p>
                      </div>
                      <span>{formatCurrency(selectedService.price)}</span>
                    </div>
                  )}
                </div>

                <div className="summary-expert">
                  <img alt="Master Barber" src={selectedBarber.avatar} />
                  <div>
                    <p className="eyebrow">Chuyen gia</p>
                    <h4>{selectedBarber.name}</h4>
                  </div>
                </div>

                <div className="summary-time-grid">
                  <div className="time-card">
                    <p className="eyebrow">Ngay</p>
                    <div>
                      <span className="material-symbols-outlined">calendar_today</span>
                      <span>{bookingState.selectedDateLabel || 'Thu 6, 24 Thang 5'}</span>
                    </div>
                  </div>

                  <div className="time-card">
                    <p className="eyebrow">Gio</p>
                    <div>
                      <span className="material-symbols-outlined">schedule</span>
                      <span>{bookingState.selectedTimeLabel || bookingState.selectedTime || '10:30 AM'}</span>
                    </div>
                  </div>
                </div>

                <div className="summary-divider" />

                <div className="summary-total">
                  <span>Tong cong</span>
                  <strong>
                    {formatCurrency(
                      selectedService.isMultiple ? selectedService.totalPrice : selectedService.price
                    )}
                  </strong>
                </div>
              </div>

              <div className="summary-note">
                <p>
                  <strong>Luu y:</strong> Ban co the huy hoac doi lich hen mien phi truoc 24
                  gio.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="details-bottom-nav">
        <div className="bottom-item">
          <span className="material-symbols-outlined">home</span>
          <span>Home</span>
        </div>
        <div className="bottom-item active">
          <span className="material-symbols-outlined filled">calendar_today</span>
          <span>Bookings</span>
        </div>
        <div className="bottom-item">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span>Inbox</span>
        </div>
        <div className="bottom-item">
          <span className="material-symbols-outlined">person</span>
          <span>Profile</span>
        </div>
      </footer>
    </div>
  );
};

export default BookingDetailsPage;
