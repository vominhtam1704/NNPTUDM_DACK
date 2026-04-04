import React, { useEffect } from 'react';
import './EPayCheckout.scss';

/**
 * ePay Checkout Component
 * Handles real ePay payment processing
 * - Shows payment loading state
 * - Auto-submits form to ePay API
 * - Handles callback from ePay
 */
const EPayCheckout = ({
  paymentId,
  amount,
  referenceCode,
  merchantId,
  returnUrl,
  notifyUrl,
  ePayApiUrl,
  onCancel
}) => {
  const submitEPayForm = React.useCallback(() => {
    // Create hidden form and submit to ePay
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = ePayApiUrl;
    form.style.display = 'none';

    // Add form fields
    const fields = {
      merchant_id: merchantId,
      amount: amount.toString(),
      order_id: referenceCode,
      return_url: returnUrl,
      notify_url: notifyUrl,
      currency: 'VND',
      language: 'vi'
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }, [amount, ePayApiUrl, merchantId, notifyUrl, referenceCode, returnUrl]);

  useEffect(() => {
    // Auto-submit ePay payment form after small delay
    const timer = setTimeout(() => {
      submitEPayForm();
    }, 500);

    return () => clearTimeout(timer);
  }, [submitEPayForm]);

  return (
    <div className="epay-checkout-overlay">
      <div className="epay-checkout-modal">
        <div className="epay-loading">
          <div className="epay-spinner">
            <span className="material-symbols-outlined spinning">
              hourglass_bottom
            </span>
          </div>
          <h3>Đang chuyển hướng đến E-Pay...</h3>
          <p>Vui lòng chờ trong khi chúng tôi chuẩn bị thanh toán của bạn</p>
          <div className="payment-info">
            <div className="info-row">
              <span>Số tiền:</span>
              <strong>{Number(amount).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div className="info-row">
              <span>Mã giao dịch:</span>
              <em>{referenceCode}</em>
            </div>
          </div>
        </div>

        <button
          className="epay-cancel-btn"
          onClick={onCancel}
          type="button"
        >
          Hủy thanh toán
        </button>
      </div>
    </div>
  );
};

export default EPayCheckout;
