import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createReservation } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../BookingDetailsPage.scss';

const fallbackBarberImage = 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&q=80&w=800';

const getAvatarUrl = (path) => {
  if (!path) return fallbackBarberImage;
  if (path.startsWith('http')) return path;
  const baseUrl = '';
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

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
      name: bookingState.selectedServiceName || 'Dịch vụ đã chọn',
      description: bookingState.selectedServiceDescription || 'Gói cắt tóc chuyên nghiệp',
      price: Number(bookingState.selectedServicePrice || 0),
    };
  }, [bookingState]);

  const selectedBarber = useMemo(
    () => ({
      id: bookingState.selectedBarberId || '',
      name: bookingState.selectedBarberName || 'Stylist',
      avatar: getAvatarUrl(bookingState.selectedBarberAvatar),
    }),
    [bookingState]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      const serviceNames = selectedService.isMultiple 
        ? bookingState.selectedServices.map(s => s.name).join(' + ')
        : selectedService.name;
      
      const totalPrice = selectedService.isMultiple 
        ? bookingState.selectedServiceTotal 
        : selectedService.price;

      const response = await createReservation({
        barberId: selectedBarber.id,
        serviceId: serviceIds[0],
        serviceIds: selectedService.isMultiple ? serviceIds : undefined,
        appointmentDate: bookingState.selectedDate,
        appointmentTime: bookingState.selectedTime,
        totalPrice: totalPrice,
        notes: formData.note ? `${serviceNames} | ${formData.note}` : serviceNames,
      });

      // Handle standardized response format
      const reservation = response?.data || response;
      const reservationId = reservation?._id || reservation?.id;

      navigate(`/payment/${reservationId}`, {
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
      console.error('Create reservation error:', error);
      const rawMessage = error?.message || '';
      let userFriendlyMessage = 'Không thể tạo lịch hẹn. Vui lòng thử lại sau.';

      if (rawMessage.includes('E11000') || rawMessage.includes('duplicate key')) {
        userFriendlyMessage =
          'Xin lỗi, khung giờ này vừa có người khác đặt trước. Bạn vui lòng quay lại chọn khung giờ khác nhé!';
      } else if (rawMessage) {
        userFriendlyMessage = `Lỗi: ${rawMessage}`;
      }

      setErrorMessage(userFriendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="booking-details-page">
        <main className="details-content">
          <section className="details-stepper">
            <div className="step-track" />
            <div className="step-track active" />

            <div className="step-item done">
              <div className="step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Dịch vụ</span>
            </div>
            <div className="step-item done">
              <div className="step-circle">
                <span className="material-symbols-outlined filled">check</span>
              </div>
              <span>Thời gian</span>
            </div>
            <div className="step-item active">
              <div className="step-circle">3</div>
              <span>Thông tin</span>
            </div>
            <div className="step-item">
              <div className="step-circle">4</div>
              <span>Thanh toán</span>
            </div>
            <div className="step-item">
              <div className="step-circle">5</div>
              <span>Hoàn tất</span>
            </div>
          </section>

          <div className="details-grid">
            <section className="details-form-wrap">
              <div className="details-header">
                <h1>Chi tiết thông tin</h1>
                <p>
                  Vui lòng cung cấp thông tin liên hệ của bạn để chúng tôi có thể phục vụ tốt
                  nhất.
                </p>
              </div>

              {errorMessage ? <div className="summary-note">{errorMessage}</div> : null}

              <form className="details-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Họ và tên</span>
                    <input
                      name="fullName"
                      onChange={handleChange}
                      placeholder="Nguyen Van A"
                      type="text"
                      value={formData.fullName}
                    />
                  </label>

                  <label className="field">
                    <span>Số điện thoại</span>
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
                  <span>Địa chỉ Email</span>
                  <input
                    name="email"
                    onChange={handleChange}
                    placeholder="email@example.com"
                    type="email"
                    value={formData.email}
                  />
                </label>

                <label className="field">
                  <span>Ghi chú thêm</span>
                  <textarea
                    name="note"
                    onChange={handleChange}
                    placeholder="Bạn có yêu cầu đặc biệt nào không? (Ví dụ: Kiểu tóc mong muốn, dị ứng...)"
                    rows="4"
                    value={formData.note}
                  />
                </label>

                <div className="form-actions">
                  <button className="back-btn" onClick={() => navigate('/booking/time', { state: bookingState })} type="button">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Quay lại
                  </button>

                  <button className="next-btn" disabled={isSubmitting} type="submit">
                    {isSubmitting ? 'Đang tạo lịch...' : 'Tiếp tục bước 4'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            </section>

            <aside className="details-sidebar">
              <div className="summary-panel">
                <h3>
                  <span className="material-symbols-outlined filled">list_alt</span>
                  Tóm tắt lịch hẹn
                </h3>

                <div className="summary-content">
                  <div className="summary-service">
                    <p className="eyebrow">Dịch vụ đã chọn</p>
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
                      <p className="eyebrow">Chuyên gia</p>
                      <h4>{selectedBarber.name}</h4>
                    </div>
                  </div>

                  <div className="summary-time-grid">
                    <div className="time-card">
                      <p className="eyebrow">Ngay</p>
                      <div>
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span>{bookingState.selectedDateLabel || 'Ngày hẹn'}</span>
                      </div>
                    </div>

                    <div className="time-card">
                      <p className="eyebrow">Gio</p>
                      <div>
                        <span className="material-symbols-outlined">schedule</span>
                        <span>{bookingState.selectedTimeLabel || bookingState.selectedTime || 'Giờ hẹn'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="summary-divider" />

                  <div className="summary-total">
                    <span>Tổng cộng</span>
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
      </div>
    </PageLayout>
  );
};

export default BookingDetailsPage;
