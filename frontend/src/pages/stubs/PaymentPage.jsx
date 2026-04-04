import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment, createEPayPayment } from '../../services/payments';
import { getReservationById } from '../../services/reservations';
import EPayCheckout from '../../components/EPayCheckout';
import '../PaymentPage.scss';

const paymentMethods = [
  {
    id: 'cash',
    title: 'Tien mat tai quay',
    description: 'Thanh toan sau khi hoan tat dich vu',
    icon: 'payments',
    accent: 'default',
  },
  {
    id: 'transfer',
    title: 'Chuyen khoan / The',
    description: 'Ngan hang hoac QR Code',
    icon: 'account_balance',
    accent: 'default',
  },
  {
    id: 'epay',
    title: 'E-Pay',
    description: 'Thanh toan tuc thoi qua E-Pay',
    icon: 'credit_card',
    accent: 'epay',
  },
  {
    id: 'momo',
    title: 'Vi dien tu Momo',
    description: 'Tich diem va uu dai vi',
    icon: 'account_balance_wallet',
    accent: 'momo',
  },
  {
    id: 'zalopay',
    title: 'ZaloPay',
    description: 'Nhanh chong va An toan',
    icon: 'wallet',
    accent: 'zalopay',
  },
];

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz7fMMzBws3l7xQ7X-ZTqlTrEw6apvwd9eqPOvBZqfzxWGLaJRYe6g5OX1_N08pRREmVkcsPn9TJrH9RroTkDh5m1D47F32HEbOqeesdSqNh1FjowkhEpmNtD-DoSBesg7Am7WXPahd2SqhifrPTQ1QjDx6hlII0gp-m9e226EbVZlXZcidPNE-RA6R2keDJiEW2XS_SpIk1BkJ4kyqK_HDAqS_0Rria3EToYlpNaT-YE074Ve7UJPIsc5tYMwDavk3JLCUwYRjI';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;

const PaymentPage = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [reservation, setReservation] = useState(location.state?.reservation || null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [ePayData, setEPayData] = useState(null); // For ePay checkout

  useEffect(() => {
    let active = true;

    const loadReservation = async () => {
      if (reservation || !appointmentId) {
        return;
      }

      try {
        const data = await getReservationById(appointmentId);
        if (active) {
          setReservation(data);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error?.message || 'Khong the tai thong tin lich hen.');
        }
      }
    };

    loadReservation();

    return () => {
      active = false;
    };
  }, [appointmentId, reservation]);

  const bookingData = useMemo(() => {
    const reservationData = reservation || {};
    const isMultiple = location.state?.selectedServices && Array.isArray(location.state.selectedServices);
    
    return {
      isMultiple,
      services: location.state?.selectedServices || [],
      serviceName: isMultiple ? location.state?.selectedServiceNames : (location.state?.selectedServiceName || reservationData.serviceId?.name || 'Royal Grooming'),
      serviceDescription:
        location.state?.selectedServiceDescription ||
        reservationData.serviceId?.description ||
        'Cat toc, cao mat va Massage tinh dau',
      barberName: location.state?.selectedBarberName || reservationData.barberId?.name || 'Alex Nguyen',
      barberAvatar: location.state?.selectedBarberAvatar || reservationData.barberId?.avatar || fallbackAvatar,
      selectedTime: location.state?.selectedTime || reservationData.appointmentTime || '',
      selectedTimeLabel: location.state?.selectedTimeLabel || reservationData.appointmentTime || '',
      selectedDateLabel:
        location.state?.selectedDateLabel ||
        (reservationData.appointmentDate
          ? new Date(reservationData.appointmentDate).toLocaleDateString('vi-VN', {
              weekday: 'short',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })
          : ''),
      selectedEndTime: location.state?.selectedEndTime || '',
      totalPrice: isMultiple 
        ? Number(location.state?.selectedServiceTotal || 0)
        : Number(
            location.state?.selectedServicePrice || reservationData.totalPrice || reservationData.serviceId?.price || 0
          ),
    };
  }, [location.state, reservation]);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let createdPayment = null;

      // Handle E-Pay - show checkout modal
      if (selectedMethod === 'epay') {
        const returnUrl = `${window.location.origin}/payment/${appointmentId}/done`;
        const ePayResponse = await createEPayPayment(appointmentId, returnUrl);
        
        // Store ePay data and show component
        const ePayInfo = ePayResponse.data || ePayResponse;
        setEPayData({
          paymentId: ePayInfo._id,
          amount: ePayInfo.amount,
          referenceCode: ePayInfo.referenceCode,
          merchantId: ePayInfo.merchantId,
          returnUrl: ePayInfo.returnUrl,
          notifyUrl: ePayInfo.notifyUrl,
          ePayApiUrl: ePayInfo.ePayApiUrl
        });
        setIsSubmitting(false);
        return;
      }

      // Handle other payment methods
      if (selectedMethod !== 'cash') {
        createdPayment = await createPayment({ reservationId: appointmentId });
        setPaymentInfo(createdPayment);
      }

      navigate(`/payment/${appointmentId}/done`, {
        state: {
          ...location.state,
          reservation,
          paymentInfo: createdPayment,
          selectedPaymentMethod: selectedMethod,
        },
      });
    } catch (error) {
      setErrorMessage(error?.message || 'Khong the khoi tao thanh toan.');
      setIsSubmitting(false);
    }
  };

  const handleEPayCancel = () => {
    setEPayData(null);
    setIsSubmitting(false);
  };

  return (
    <div className="payment-page">
      <header className="payment-topbar">
        <div className="payment-topbar-inner">
          <div className="payment-brand-wrap">
            <button
              className="back-icon-btn"
              onClick={() => navigate('/booking/details', { state: location.state })}
              type="button"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="payment-brand">The Atelier</h1>
          </div>

          <div className="payment-support">
            <span>Ho tro truc tuyen</span>
            <div className="support-avatar">
              <img alt="Avatar Barber" src={bookingData.barberAvatar} />
            </div>
          </div>
        </div>
      </header>

      <main className="payment-content">
        <section className="payment-stepper">
          <div className="payment-step-track" />
          <div className="payment-step-track active" />

          <div className="payment-step done">
            <div className="payment-step-circle">
              <span className="material-symbols-outlined">check</span>
            </div>
            <span>Dich vu</span>
          </div>
          <div className="payment-step done">
            <div className="payment-step-circle">
              <span className="material-symbols-outlined">check</span>
            </div>
            <span>Chon tho</span>
          </div>
          <div className="payment-step done">
            <div className="payment-step-circle">
              <span className="material-symbols-outlined">check</span>
            </div>
            <span>Thoi gian</span>
          </div>
          <div className="payment-step active">
            <div className="payment-step-circle">4</div>
            <span>Thanh toan</span>
          </div>
          <div className="payment-step">
            <div className="payment-step-circle">5</div>
            <span>Hoan tat</span>
          </div>
        </section>

        <div className="payment-grid">
          <section className="payment-main">
            <section className="booking-order-card">
              <div className="order-accent" />
              <h2>
                <span className="material-symbols-outlined">receipt_long</span>
                Chi tiet don dat lich
              </h2>

              <div className="order-grid">
                <div>
                  <p className="eyebrow">Dich vu</p>
                  {bookingData.isMultiple ? (
                    <div>
                      {bookingData.services.map((service) => (
                        <div key={service._id || service.id} style={{ marginBottom: '12px' }}>
                          <h3>{service.name}</h3>
                          <p>{service.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <h3>{bookingData.serviceName}</h3>
                      <p>{bookingData.serviceDescription}</p>
                    </>
                  )}
                </div>

                <div>
                  <p className="eyebrow">Chuyen gia</p>
                  <div className="expert-row">
                    <div className="expert-avatar">
                      <img alt="Portrait of the selected barber" src={bookingData.barberAvatar} />
                    </div>
                    <p className="expert-name">{bookingData.barberName}</p>
                  </div>
                </div>

                <div>
                  <p className="eyebrow">Thoi gian</p>
                  <h3>
                    {bookingData.selectedTimeLabel || bookingData.selectedTime || '14:30'},
                    {' '}
                    {bookingData.selectedDateLabel || 'Thu 7, 24 Thang 5'}
                  </h3>
                  <p>{bookingData.selectedEndTime ? `Ket thuc ${bookingData.selectedEndTime}` : 'Dang cap nhat'}</p>
                </div>
              </div>
            </section>

            <section className="payment-methods-card">
              <h2>Phuong thuc thanh toan</h2>
              <div className="payment-method-grid">
                {paymentMethods.map((method) => (
                  <label className="payment-method-option" key={method.id}>
                    <input
                      checked={selectedMethod === method.id}
                      name="payment_method"
                      onChange={() => setSelectedMethod(method.id)}
                      type="radio"
                      value={method.id}
                    />
                    <div className={`payment-method-card${selectedMethod === method.id ? ' selected' : ''}`}>
                      <div className={`payment-method-icon ${method.accent}`}>
                        <span className="material-symbols-outlined">{method.icon}</span>
                      </div>

                      <div className="payment-method-copy">
                        <p>{method.title}</p>
                        <span>{method.description}</span>
                      </div>

                      <div className={`payment-check${selectedMethod === method.id ? ' visible' : ''}`}>
                        <span className="material-symbols-outlined filled">check_circle</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </section>

          <aside className="payment-sidebar">
            <div className="promo-card">
              <p className="eyebrow">Ma giam gia</p>
              <div className="promo-row">
                <input
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Nhap ma uu dai..."
                  type="text"
                  value={promoCode}
                />
                <button type="button">Ap dung</button>
              </div>
            </div>

            <div className="total-card">
              <h3>Tong thanh toan</h3>

              {errorMessage ? <p className="policy-text">{errorMessage}</p> : null}

              <div className="total-breakdown">
                <div className="total-row">
                  <span>Dich vu chinh</span>
                  <strong>{formatCurrency(bookingData.totalPrice)}</strong>
                </div>
                <div className="total-row">
                  <span>Phu phi (Ho tro tho)</span>
                  <strong>0d</strong>
                </div>
                <div className="total-row discount">
                  <span>
                    <span className="material-symbols-outlined">confirmation_number</span>
                    Uu dai thanh vien
                  </span>
                  <strong>0d</strong>
                </div>
              </div>

              <div className="grand-total">
                <p>Tong cong</p>
                <strong>{formatCurrency(bookingData.totalPrice)}</strong>
              </div>

              <button className="confirm-btn" disabled={isSubmitting} onClick={handleConfirmPayment} type="button">
                <span className="material-symbols-outlined">verified_user</span>
                {isSubmitting ? 'Dang xu ly...' : 'Xac nhan va Thanh toan'}
              </button>

              {paymentInfo?.referenceCode ? (
                <p className="policy-text">
                  Ma tham chieu: <strong>{paymentInfo.referenceCode}</strong>
                </p>
              ) : null}

              <p className="policy-text">
                Bang viec xac nhan, ban dong y voi <a href="/#">Dieu khoan dich vu</a> va{' '}
                <a href="/#">Chinh sach bao mat</a> cua The Atelier.
              </p>
            </div>

            <div className="trusted-logos">
              <img
                alt="Visa"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDGkB_EyY8e5dPCT-vYg5TrB72P1VbjJ7t8ASL-Iy95vmmWkun2zMJeS7EGQrJoSoeTEWYTpKQvNvxy2RSoWRohQnXdf5bfk-Lg3N2UJXjCyAow-wu6ockynGymI5IgySqcceqrlaHQgEt7pZbGOf7Eh8DQADmxYQhfjbjocUI2F6ys0I0yFwxOcrHwxUR1Y6urzgNu7D1pBoNz6-qGyFejVMkWnJL_lj2AI6L2MZYu5qS20DQu993bz_2W1iexEkbKSqM73aTo3M"
              />
              <img
                alt="Mastercard"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHum-siMpsULk-jzPJ0duWVAVUvcC1_dVRh4GFnvv4P-CYq5Cfv5jCF5k5MNEBbcSn85UZX8yjcDRzsQGuYTX9-YasSC4jeigHxAmaZfAAphcvkVZfl43DtXgJtztfIBJKA4v-4KZe-95C-Fc5KGLOuWwtq3N8inGf9OI2oCglPp44ThDbLIJl_3FYCCDonmK-5loOFZYNClSzNv9Bi2JnsCP53ws9e7i2Zm7ZHM1ssxN6jJ7BhLFxDiHXZqBlNdH8rLTLFrgxPK0"
              />
              <img
                alt="Momo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBIr5xlPCm1jAo17PqKIDPPKBHIMigUc_iDaurWcUy9_MR_KFW_qvawJHmfsLWXCtbkzngP8ctaUYGC9Bk8TF0wIepWoJCvcOmdXaEzd4hKISVAip7dDCNs8D0pcexNWGZfiQge1GirfMYTtV7Wx-kTq7v7_D4a9LEQRGsg7lbkWgrm3wg5261HgAP8t7lAOGOiBII7Mb3CZMmMjIEoqBZqcqTdRBdjzp_J_ijhXwbvKdxnVk_xRv4EM1aWBKbOnhPjOv_DV_it8YA"
              />
            </div>
          </aside>
        </div>
      </main>

      <nav className="payment-bottom-nav">
        <div className="bottom-nav-item">
          <span className="material-symbols-outlined">home</span>
          <span>Trang chu</span>
        </div>
        <div className="bottom-nav-item active">
          <span className="material-symbols-outlined">calendar_today</span>
          <span>Lich hen</span>
        </div>
        <div className="bottom-nav-item">
          <span className="material-symbols-outlined">chat_bubble</span>
          <span>Tin nhan</span>
        </div>
        <div className="bottom-nav-item">
          <span className="material-symbols-outlined">person</span>
          <span>Ca nhan</span>
        </div>
      </nav>

      {/* E-Pay Checkout Modal */}
      {ePayData && (
        <EPayCheckout
          paymentId={ePayData.paymentId}
          amount={ePayData.amount}
          referenceCode={ePayData.referenceCode}
          merchantId={ePayData.merchantId}
          returnUrl={ePayData.returnUrl}
          notifyUrl={ePayData.notifyUrl}
          ePayApiUrl={ePayData.ePayApiUrl}
          onCancel={handleEPayCancel}
        />
      )}
    </div>
  );
};

export default PaymentPage;
