import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAvailableSlots } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../TimeSelectionPage.scss';

const defaultSelectedBarber = {
  name: 'Hoang Minh Anh',
  title: 'Master Barber',
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB1MRNv0keSBAXa8xPvqgpGq338JoB2sdMWny70_mKaW1JmfJmAB3VqahqxMUaCT_y9WawSMleWXJ7TKDhX4B4tkZmtV172Ce9qB6IsCE4CTuvRkODR4447oQGhoQUC-R61BHpC5T2fI5XnI4GF8OMimlIZJP4a-HihRS8u2kKuAmQtrYcPLqhy6Su2yILDGs-LDpN9emk6Pbv92fZ8J4O3IB-XCukMveEp7fnSRJKCt8Lg87Ym7DHWOoCeun1mjNQziH8NxbJgheo',
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDateCard = (dateValue) => {
  const date = new Date(dateValue);
  const weekdays = ['CN', 'Thu 2', 'Thu 3', 'Thu 4', 'Thu 5', 'Thu 6', 'Thu 7'];
  return {
    id: date.toISOString().slice(0, 10),
    label: weekdays[date.getDay()],
    day: `${date.getDate()}`.padStart(2, '0'),
    monthLabel: `Thang ${date.getMonth() + 1}, ${date.getFullYear()}`,
    isoDate: date.toISOString().slice(0, 10),
  };
};

const buildDateOptions = (preferredDate) => {
  const today = new Date();
  const baseDates = Array.from({ length: 7 }, (_, index) => {
    const next = new Date(today);
    next.setDate(today.getDate() + index);
    return formatDateCard(next);
  });

  if (!preferredDate) {
    return baseDates;
  }

  const preferred = new Date(preferredDate);
  if (Number.isNaN(preferred.getTime())) {
    return baseDates;
  }

  const preferredOption = formatDateCard(preferred);
  const exists = baseDates.some((item) => item.id === preferredOption.id);
  return exists ? baseDates : [preferredOption, ...baseDates].slice(0, 7);
};

const toDisplayTime = (value) => {
  if (!value) {
    return '';
  }

  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  if (Number.isNaN(hour)) {
    return value;
  }

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${`${normalizedHour}`.padStart(2, '0')}:${minuteText} ${suffix}`;
};

const toMinutes = (timeValue) => {
  const [hourText, minuteText] = timeValue.split(':');
  return Number(hourText) * 60 + Number(minuteText);
};

const addMinutes = (timeValue, minutesToAdd) => {
  const total = toMinutes(timeValue) + minutesToAdd;
  const nextHour = Math.floor(total / 60);
  const nextMinute = total % 60;
  return `${`${nextHour}`.padStart(2, '0')}:${`${nextMinute}`.padStart(2, '0')}`;
};

const formatSelectedDateLabel = (date) => {
  if (!date) return '';
  return `${date.label}, ${date.day} ${date.monthLabel}`;
};

const TimeSelectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dateOptions = useMemo(
    () => buildDateOptions(location.state?.preferredDate),
    [location.state?.preferredDate]
  );
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.id || '');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedDateOption = useMemo(
    () => dateOptions.find((date) => date.id === selectedDate) || dateOptions[0],
    [dateOptions, selectedDate]
  );

  const selectedBarber = useMemo(
    () => ({
      ...defaultSelectedBarber,
      name: location.state?.selectedBarberName || defaultSelectedBarber.name,
      image: location.state?.selectedBarberAvatar || defaultSelectedBarber.image,
      title: location.state?.selectedBarberTitle || defaultSelectedBarber.title,
    }),
    [location.state]
  );

  const selectedService = useMemo(
    () => {
      if (location.state?.selectedServices && Array.isArray(location.state.selectedServices)) {
        return {
          id: 'multiple',
          name: location.state.selectedServiceNames || location.state.selectedServices.map((s) => s.name).join(' + ') || 'Cac Dich Vu',
          price: location.state.selectedServiceTotal || 0,
          duration: location.state.selectedServiceDuration || 45,
        };
      }

      return {
        id: location.state?.selectedServiceId || '',
        name: location.state?.selectedServiceName || 'Combo Cat & Goi Cao Cap',
        price: Number(location.state?.selectedServicePrice || 0),
        duration: Number(location.state?.selectedServiceDuration || 45),
      };
    },
    [location.state]
  );

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(dateOptions[0]?.id || '');
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    let active = true;

    const loadAvailableSlots = async () => {
      if (!location.state?.selectedBarberId || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      setErrorMessage('');

      try {
        const response = await getAvailableSlots(location.state.selectedBarberId, selectedDate);
        if (!active) {
          return;
        }

        const slotsData = response?.data?.availableSlots || response?.availableSlots || [];
        const nextSlots = Array.isArray(slotsData) ? slotsData : [];
        
        setAvailableSlots(nextSlots);
        setSelectedTime((current) => (nextSlots.includes(current) ? current : nextSlots[0] || ''));
      } catch (error) {
        if (active) {
          setAvailableSlots([]);
          setSelectedTime('');
          setErrorMessage(error?.message || 'Khong the tai khung gio.');
        }
      } finally {
        if (active) {
          setIsLoadingSlots(false);
        }
      }
    };

    loadAvailableSlots();

    return () => {
      active = false;
    };
  }, [location.state?.selectedBarberId, selectedDate]);

  const groupedSlots = useMemo(() => {
    const morning = availableSlots.filter((slot) => toMinutes(slot) < 12 * 60);
    const afternoon = availableSlots.filter((slot) => toMinutes(slot) >= 12 * 60);
    return { morning, afternoon };
  }, [availableSlots]);

  const selectedEndTime = useMemo(() => {
    if (!selectedTime) {
      return '';
    }

    return toDisplayTime(addMinutes(selectedTime, selectedService.duration || 30));
  }, [selectedService.duration, selectedTime]);

  const handleContinue = () => {
    if (!selectedService.id || !location.state?.selectedBarberId || !selectedDate || !selectedTime) {
      setErrorMessage('Vui long chon day du ngay va gio hen.');
      return;
    }

    navigate('/booking/details', {
      state: {
        ...location.state,
        selectedDate,
        selectedDateLabel: formatSelectedDateLabel(selectedDateOption),
        selectedTime,
        selectedTimeLabel: toDisplayTime(selectedTime),
        selectedEndTime,
      },
    });
  };

  const renderSlot = (slot) => {
    const className = ['time-slot', selectedTime === slot ? 'active' : ''].filter(Boolean).join(' ');

    return (
      <button className={className} key={slot} onClick={() => setSelectedTime(slot)} type="button">
        {toDisplayTime(slot)}
      </button>
    );
  };

  return (
    <PageLayout>
      <div className="time-page">
        <main className="time-content">
          <section className="time-stepper">
            <div className="time-step completed">
              <div className="time-step-circle">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span>Dịch vụ</span>
            </div>
            <div className="time-step-line completed" />
            <div className="time-step active">
              <div className="time-step-circle">2</div>
              <span>Thời gian</span>
            </div>
            <div className="time-step-line" />
            <div className="time-step">
              <div className="time-step-circle">3</div>
              <span>Thông tin</span>
            </div>
            <div className="time-step-line" />
            <div className="time-step">
              <div className="time-step-circle">4</div>
              <span>Thanh toán</span>
            </div>
            <div className="time-step-line" />
            <div className="time-step">
              <div className="time-step-circle">5</div>
              <span>Hoàn tất</span>
            </div>
          </section>

          <div className="time-grid">
            <section className="time-selection">
              <section className="date-section">
                <div className="section-title-row">
                  <h2>Chon Ngay</h2>
                  <div className="section-meta">
                    <span>{selectedDateOption?.monthLabel || 'Dang cap nhat'}</span>
                    <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                </div>

                <div className="date-slider">
                  {dateOptions.map((date) => (
                    <button
                      className={['date-card', selectedDate === date.id ? 'active' : ''].filter(Boolean).join(' ')}
                      key={date.id}
                      onClick={() => setSelectedDate(date.id)}
                      type="button"
                    >
                      <span>{date.label}</span>
                      <strong>{date.day}</strong>
                    </button>
                  ))}
                </div>
              </section>

              <section className="slot-section">
                {isLoadingSlots ? <div className="tip-card">Dang tai khung gio trong...</div> : null}
                {!isLoadingSlots && errorMessage ? <div className="tip-card">{errorMessage}</div> : null}

                <div className="slot-group">
                  <div className="slot-header">
                    <span className="material-symbols-outlined tertiary">light_mode</span>
                    <h3>Buoi Sang</h3>
                  </div>
                  <div className="slot-grid">
                    {groupedSlots.morning.length > 0 ? groupedSlots.morning.map(renderSlot) : <p>Khong con lich.</p>}
                  </div>
                </div>

                <div className="slot-group">
                  <div className="slot-header">
                    <span className="material-symbols-outlined primary">wb_twilight</span>
                    <h3>Buoi Chieu</h3>
                  </div>
                  <div className="slot-grid">
                    {groupedSlots.afternoon.length > 0 ? (
                      groupedSlots.afternoon.map(renderSlot)
                    ) : (
                      <p>Khong con lich.</p>
                    )}
                  </div>
                </div>
              </section>
            </section>

            <aside className="time-sidebar">
              <div className="summary-card">
                <div className="summary-card-head">
                  <h3>Tom tat lich hen</h3>
                </div>

                <div className="summary-card-body">
                  <div className="barber-summary">
                    <img alt={selectedBarber.name} src={selectedBarber.image} />
                    <div>
                      <p className="eyebrow">Tho cat toc</p>
                      <p className="barber-name">{selectedBarber.name}</p>
                      <div className="barber-role">
                        <span className="material-symbols-outlined">stars</span>
                        <span>{selectedBarber.title}</span>
                      </div>
                    </div>
                  </div>

                  <div className="service-summary">
                    <p className="eyebrow">Dich vu da chon</p>
                    <div className="service-summary-row">
                      <p>{selectedService.name}</p>
                      <strong>{formatCurrency(selectedService.price)}</strong>
                    </div>
                    <span>Thoi gian du kien: {selectedService.duration} phut</span>
                  </div>

                  <div className="selection-summary">
                    <div className="selection-item">
                      <div className="selection-icon">
                        <span className="material-symbols-outlined">event</span>
                      </div>
                      <div>
                        <p className="eyebrow">Ngay hen</p>
                        <p>{formatSelectedDateLabel(selectedDateOption)}</p>
                      </div>
                    </div>

                    <div className="selection-item">
                      <div className="selection-icon">
                        <span className="material-symbols-outlined">schedule</span>
                      </div>
                      <div>
                        <p className="eyebrow">Gio hen</p>
                        <p>{selectedTime ? `${toDisplayTime(selectedTime)} - ${selectedEndTime}` : 'Chua chon gio'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="primary-cta" onClick={handleContinue} type="button">
                    Tiep tuc buoc 3
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>

                  <button className="secondary-cta" onClick={() => navigate('/booking')} type="button">
                    Quay lai buoc 1
                  </button>
                </div>
              </div>

              <div className="tip-card">
                <p>"Goi y: Buoi sang thuong yen tinh hon cho cac dich vu cham soc da mat."</p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </PageLayout>
  );
};

export default TimeSelectionPage;
