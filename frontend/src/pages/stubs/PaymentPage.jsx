import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createPayment } from '../../services/payments';
import { getReservationById } from '../../services/reservations';
import { validateVoucher } from '../../services/vouchers';
import PageLayout from '../../components/PageLayout';
import '../PaymentPage.scss';

const paymentMethods = [
  {
    id: 'cash',
    title: 'Tiền mặt tại quầy',
    description: 'Thanh toán sau khi hoàn tất dịch vụ',
    icon: 'payments',
    accent: 'default',
  },
  {
    id: 'transfer',
    title: 'Chuyển khoản SePay',
    description: 'Quét mã QR để thanh toán ngay',
    icon: 'account_balance',
    accent: 'default',
  }
];

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz7fMMzBws3l7xQ7X-ZTqlTrEw6apvwd9eqPOvBZqfzxWGLaJRYe6g5OX1_N08pRREmVkcsPn9TJrH9RroTkDh5m1D47F32HEbOqeesdSqNh1FjowkhEpmNtD-DoSBesg7Am7WXPahd2SqhifrPTQ1QjDx6hlII0gp-m9e226EbVZlXZcidPNE-RA6R2keDJiEW2XS_SpIk1BkJ4kyqK_HDAqS_0Rria3EToYlpNaT-YE074Ve7UJPIsc5tYMwDavk3JLCUwYRjI';

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const PaymentPage = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [promoCode, setPromoCode] = useState('');
  const [reservation, setReservation] = useState(location.state?.reservation || null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadReservation = async () => {
      if (reservation || !appointmentId) {
        return;
      }

      try {
        const response = await getReservationById(appointmentId);
        // Handle standardized response for reservations (returns full body)
        const data = response?.data || response;
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
      discount: discountInfo?.discount || 0,
      finalTotal: (isMultiple ? Number(location.state?.selectedServiceTotal || 0) : Number(location.state?.selectedServicePrice || reservationData.totalPrice || reservationData.serviceId?.price || 0)) - (discountInfo?.discount || 0)
    };
  }, [location.state, reservation, discountInfo]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingPromo(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const response = await validateVoucher(promoCode, bookingData.totalPrice);
      const data = response?.data || response;
      setDiscountInfo(data);
      setSuccessMessage(`Áp dụng thành công! Bạn được giảm ${formatCurrency(data.discount)}`);
    } catch (error) {
      setDiscountInfo(null);
      setErrorMessage(error?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let createdPayment = null;

      // Handle payment methods that need an API call (SePay)
      if (selectedMethod !== 'cash') {
        createdPayment = await createPayment({ reservationId: appointmentId });
        const paymentData = createdPayment?.data || createdPayment;
        setPaymentInfo(paymentData);
      }

      navigate(`/payment/${appointmentId}/done`, {
        state: {
          ...location.state,
          reservation,
          paymentInfo: createdPayment?.data || createdPayment,
          selectedPaymentMethod: selectedMethod,
        },
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      const rawMessage = error?.message || '';
      let userFriendlyMessage = 'Không thể khởi tạo thanh toán. Vui lòng thử lại sau.';

      if (rawMessage.includes('E11000') || rawMessage.includes('duplicate key')) {
        userFriendlyMessage =
          'Giao dịch cho lịch hẹn này đã được khởi tạo hoặc đang được xử lý. Vui lòng kiểm tra lịch sử đặt chỗ hoặc thử lại nhé!';
      } else if (rawMessage) {
        userFriendlyMessage = `Lỗi: ${rawMessage}`;
      }

      setErrorMessage(userFriendlyMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="payment-page">
        <main className="payment-content">
          <section className="payment-stepper">
            <div className="payment-step-track" />
            <div className="payment-step-track active" />

            <div className="payment-step done">
              <div className="payment-step-circle">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span>Dịch vụ</span>
            </div>
            <div className="payment-step done">
              <div className="payment-step-circle">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span>Chọn thợ</span>
            </div>
            <div className="payment-step done">
              <div className="payment-step-circle">
                <span className="material-symbols-outlined">check</span>
              </div>
              <span>Thời gian</span>
            </div>
            <div className="payment-step active">
              <div className="payment-step-circle">4</div>
              <span>Thanh toán</span>
            </div>
            <div className="payment-step">
              <div className="payment-step-circle">5</div>
              <span>Hoàn tất</span>
            </div>
          </section>

          <div className="payment-grid">
            <section className="payment-main">
              <section className="booking-order-card">
                <div className="order-accent" />
                <h2>
                  <span className="material-symbols-outlined">receipt_long</span>
                  Chi tiết đơn đặt lịch
                </h2>

                <div className="order-grid">
                  <div>
                    <p className="eyebrow">Dịch vụ</p>
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
                    <p className="eyebrow">Chuyên gia</p>
                    <div className="expert-row">
                      <div className="expert-avatar">
                        <img alt="Portrait of the selected barber" src={bookingData.barberAvatar} />
                      </div>
                      <p className="expert-name">{bookingData.barberName}</p>
                    </div>
                  </div>

                  <div>
                    <p className="eyebrow">Thời gian</p>
                    <h3>
                      {bookingData.selectedTimeLabel || bookingData.selectedTime || '14:30'},
                      {' '}
                      {bookingData.selectedDateLabel || 'Ngày hẹn'}
                    </h3>
                    <p>{bookingData.selectedEndTime ? `Kết thúc ${bookingData.selectedEndTime}` : 'Đang cập nhật'}</p>
                  </div>
                </div>
              </section>

              <section className="payment-methods-card">
                <h2>Phương thức thanh toán</h2>
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
                <p className="eyebrow">Mã giảm giá</p>
                <div className="promo-row">
                  <input
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Nhập mã ưu đãi..."
                    type="text"
                    value={promoCode}
                  />
                  <button 
                    onClick={handleApplyPromo} 
                    disabled={isValidatingPromo || !promoCode}
                    type="button"
                  >
                    {isValidatingPromo ? '...' : 'Áp dụng'}
                  </button>
                </div>
                {successMessage && <p className="promo-success">{successMessage}</p>}
              </div>

              <div className="total-card">
                <h3>Tổng thanh toán</h3>

                {errorMessage ? <p className="promo-error">{errorMessage}</p> : null}

                <div className="total-breakdown">
                  <div className="total-row">
                    <span>Dịch vụ chính</span>
                    <strong>{formatCurrency(bookingData.totalPrice)}</strong>
                  </div>
                  <div className="total-row">
                    <span>Phụ phí (Hỗ trợ thợ)</span>
                    <strong>0đ</strong>
                  </div>
                  {bookingData.discount > 0 && (
                    <div className="total-row discount">
                      <span>
                        <span className="material-symbols-outlined">confirmation_number</span>
                        Ưu đãi Voucher ({discountInfo?.code})
                      </span>
                      <strong>-{formatCurrency(bookingData.discount)}</strong>
                    </div>
                  )}
                </div>

                <div className="grand-total">
                  <p>Tổng cộng</p>
                  <strong>{formatCurrency(bookingData.finalTotal)}</strong>
                </div>

                <button className="confirm-btn" disabled={isSubmitting} onClick={handleConfirmPayment} type="button">
                  <span className="material-symbols-outlined">verified_user</span>
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận và Thanh toán'}
                </button>

                {paymentInfo?.referenceCode ? (
                  <p className="policy-text">
                    Mã tham chiếu: <strong>{paymentInfo.referenceCode}</strong>
                  </p>
                ) : null}

                <p className="policy-text">
                  Bằng việc xác nhận, bạn đồng ý với <a href="/#">Điều khoản dịch vụ</a> và{' '}
                  <a href="/#">Chính sách bảo mật</a> của The Atelier.
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
      </div>
    </PageLayout>
  );
};

export default PaymentPage;
