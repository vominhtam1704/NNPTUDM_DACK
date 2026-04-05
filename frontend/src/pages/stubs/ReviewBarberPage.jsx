import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getReservationById } from '../../services/reservations';
import { createReview } from '../../services/reviews';
import PageLayout from '../../components/PageLayout';
import '../ReviewBarberPage.scss';

const feedbackTags = [
  'Kỹ thuật tốt',
  'Tư vấn nhiệt tình',
  'Đúng giờ',
  'Không gian sạch sẽ',
  'Chăm sóc tận tâm',
  'Sẽ quay lại',
];

const ratingDetails = [
  { id: 'skill', label: 'Tay nghề' },
  { id: 'attitude', label: 'Thái độ' },
  { id: 'punctuality', label: 'Đúng giờ' },
  { id: 'cleanliness', label: 'Vệ sinh' },
];

const defaultBreakdown = {
  skill: 5,
  attitude: 5,
  punctuality: 4,
  cleanliness: 5,
};

const StarRow = ({ value, onChange, large = false }) => (
  <div className={`rating-stars${large ? ' large' : ''}`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        aria-label={`Chon ${star} sao`}
        className={star <= value ? 'active' : ''}
        key={star}
        onClick={() => onChange(star)}
        type="button"
      >
        <span className="material-symbols-outlined filled">star</span>
      </button>
    ))}
  </div>
);

const ReviewBarberPage = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [overallRating, setOverallRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState(['Ky thuat cat tot', 'Dung gio']);
  const [details, setDetails] = useState(defaultBreakdown);
  const [comment, setComment] = useState(
    'Tho cat chinh xac, tu van kieu toc hop khuon mat va thao tac rat gon gang.'
  );
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const averageDetail = useMemo(() => {
    const values = Object.values(details);
    return (values.reduce((sum, current) => sum + current, 0) / values.length).toFixed(1);
  }, [details]);

  const toggleTag = (tag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleDetailChange = (id, value) => {
    setDetails((current) => ({ ...current, [id]: value }));
  };

  useEffect(() => {
    let active = true;

    const loadReservation = async () => {
      setIsLoading(true);
      setSubmitError('');

      try {
        const response = await getReservationById(appointmentId);
        // Handle standardized nested response
        const data = response?.data || response;
        if (active) {
          setReservation(data);
        }
      } catch (error) {
        if (active) {
          setSubmitError(error.message || 'Không thể tải thông tin lịch hẹn');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadReservation();
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    const detailSummary = ratingDetails
      .map((item) => `${item.label}: ${details[item.id]}/5`)
      .join(', ');

    const tagSummary = selectedTags.length > 0 ? `Tags: ${selectedTags.join(', ')}` : '';
    const recommendSummary = wouldRecommend ? 'Sẵn sàng giới thiệu.' : 'Chưa sẵn sàng giới thiệu.';
    const mergedComment = [comment.trim(), detailSummary, tagSummary, recommendSummary]
      .filter(Boolean)
      .join('\n');

    try {
      await createReview({
        reservationId: appointmentId,
        rating: overallRating,
        comment: mergedComment,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || 'Gửi đánh giá thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const barber = reservation?.barberId
    ? {
        name: reservation.barberId.name,
        role: 'Barber',
        image:
          reservation.barberId.avatar ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCxz7fMMzBws3l7xQ7X-ZTqlTrEw6apvwd9eqPOvBZqfzxWGLaJRYe6g5OX1_N08pRREmVkcsPn9TJrH9RroTkDh5m1D47F32HEbOqeesdSqNh1FjowkhEpmNtD-DoSBesg7Am7WXPahd2SqhifrPTQ1QjDx6hlII0gp-m9e226EbVZlXZcidPNE-RA6R2keDJiEW2XS_SpIk1BkJ4kyqK_HDAqS_0Rria3EToYlpNaT-YE074Ve7UJPIsc5tYMwDavk3JLCUwYRjI',
      }
    : null;

  const appointment = reservation
    ? {
        date: new Date(reservation.appointmentDate).toLocaleDateString('vi-VN', {
          weekday: 'short',
          day: '2-digit',
          month: 'long',
        }),
        time: reservation.appointmentTime,
        service: reservation.serviceId?.name || 'Dịch vụ',
        price: `${Number(reservation.totalPrice || 0).toLocaleString('vi-VN')}đ`,
      }
    : null;

  return (
    <PageLayout>
      <div className="review-page">
        <main className="review-shell">
          {submitted ? (
            <section className="review-success-card">
              <div className="review-success-icon">
                <span className="material-symbols-outlined filled">verified</span>
              </div>
              <p className="review-eyebrow">Đánh giá đã được gửi</p>
              <h1>Cảm ơn bạn đã chia sẻ trải nghiệm</h1>
              <p>
                Nhận xét của bạn sẽ giúp {barber?.name} cải thiện chất lượng dịch vụ và giúp khách
                hàng khác dễ đưa ra lựa chọn phù hợp.
              </p>
              <div className="review-success-actions">
                <Link className="review-primary-btn" to="/profile">
                  Về lịch sử lịch hẹn
                </Link>
                <button className="review-secondary-btn" onClick={() => navigate('/')} type="button">
                  Trang chủ
                </button>
              </div>
            </section>
          ) : isLoading ? (
            <section className="review-success-card">
              <p>Đang tải thông tin lịch hẹn...</p>
            </section>
          ) : !reservation || !barber ? (
            <section className="review-success-card">
              <p className="review-eyebrow">Không tải được dữ liệu</p>
              <h1>Không tìm thấy lịch hẹn để đánh giá</h1>
              <p>{submitError || 'Hãy quay lại trang hồ sơ và thử mở lại lịch hẹn.'}</p>
              <div className="review-success-actions">
                <Link className="review-primary-btn" to="/profile">
                  Về hồ sơ
                </Link>
              </div>
            </section>
          ) : (
            <div className="review-content-split">
              <section className="review-form-panel">
                <div className="review-intro-card">
                  <p className="review-eyebrow">Trải nghiệm của bạn</p>
                  <h2>Bạn đánh giá buổi hẹn này như thế nào?</h2>
                  <p>
                    Đánh giá chỉ mất dưới 1 phút. Hãy chia sẻ cảm nhận thật để salon cải thiện chất
                    lượng phục vụ.
                  </p>

                  <StarRow large onChange={setOverallRating} value={overallRating} />

                  <div className="review-score-chip">
                    <strong>{overallRating}.0/5</strong>
                    <span>{wouldRecommend ? 'Sẵn sàng giới thiệu cho bạn bè' : 'Cần cải thiện thêm'}</span>
                  </div>
                </div>

                <form className="review-form" onSubmit={handleSubmit}>
                  {submitError ? <div className="review-inline-error">{submitError}</div> : null}
                  <section className="review-section">
                    <div className="section-heading">
                      <h3>Điểm chi tiết</h3>
                      <span>Trung bình {averageDetail}</span>
                    </div>

                    <div className="detail-rating-list">
                      {ratingDetails.map((item) => (
                        <div className="detail-rating-item" key={item.id}>
                          <div>
                            <strong>{item.label}</strong>
                            <p>Đánh giá mức độ hài lòng cho tiêu chí này.</p>
                          </div>
                          <StarRow
                            onChange={(value) => handleDetailChange(item.id, value)}
                            value={details[item.id]}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="review-section">
                    <div className="section-heading">
                      <h3>Điểm nổi bật</h3>
                      <span>Chọn nhiều mục nếu phù hợp</span>
                    </div>

                    <div className="tag-grid">
                      {feedbackTags.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            className={`tag-pill${active ? ' active' : ''}`}
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            type="button"
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="review-section">
                    <div className="section-heading">
                      <h3>Nhận xét thêm</h3>
                      <span>Tối đa 300 ký tự</span>
                    </div>

                    <textarea
                      maxLength={300}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Mô tả chi tiết về tay nghề, thái độ và không gian trải nghiệm."
                      rows={6}
                      value={comment}
                    />
                    <div className="textarea-meta">
                      <label className={`recommend-toggle${wouldRecommend ? ' active' : ''}`}>
                        <input
                          checked={wouldRecommend}
                          onChange={(event) => setWouldRecommend(event.target.checked)}
                          type="checkbox"
                        />
                        <span className="toggle-indicator" />
                        <span>Tôi sẽ giới thiệu thợ này cho người quen</span>
                      </label>
                      <span>{comment.length}/300</span>
                    </div>
                  </section>

                  <div className="review-form-actions">
                    <button className="review-primary-btn" disabled={isSubmitting || !reservation} type="submit">
                      {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                    <Link className="review-secondary-btn" to="/profile">
                      Bỏ qua lúc này
                    </Link>
                  </div>
                </form>
              </section>

              <aside className="review-sidebar">
                <section className="barber-summary-card">
                  <div className="barber-summary-header">
                    <img alt={barber.name} src={barber.image} />
                    <div>
                      <p className="review-eyebrow">Thợ được đánh giá</p>
                      <h3>{barber.name}</h3>
                      <span>{barber.role}</span>
                    </div>
                  </div>

                  <div className="barber-summary-stats">
                    <div>
                      <strong>{overallRating}.0</strong>
                      <span>Điểm bạn đang chọn</span>
                    </div>
                    <div>
                      <strong>{selectedTags.length}</strong>
                      <span>Điểm nổi bật</span>
                    </div>
                  </div>
                </section>

                <section className="appointment-card">
                  <p className="review-eyebrow">Thông tin lịch hẹn</p>
                  <div className="appointment-row">
                    <span>Dịch vụ</span>
                    <strong>{appointment?.service || 'Dịch vụ'}</strong>
                  </div>
                  <div className="appointment-row">
                    <span>Ngày giờ</span>
                    <strong>
                      {appointment?.date || '--'} · {appointment?.time || '--'}
                    </strong>
                  </div>
                  <div className="appointment-row">
                    <span>Thanh toán</span>
                    <strong>{appointment?.price || '--'}</strong>
                  </div>
                  <div className="appointment-row">
                    <span>Mã lịch hẹn</span>
                    <strong>{appointmentId}</strong>
                  </div>
                </section>

                <section className="review-tip-card">
                  <p className="review-eyebrow">Gợi ý</p>
                  <ul>
                    <li>Nếu thợ tư vấn kiểu tóc phù hợp, hãy nhắc rõ trong nhận xét.</li>
                    <li>Đánh giá cân bằng giữa thái độ, tay nghề và độ đúng giờ.</li>
                    <li>Thông tin cụ thể sẽ hữu ích hơn đánh giá quá ngắn.</li>
                  </ul>
                </section>
              </aside>
            </div>
          )}
        </main>
      </div>
    </PageLayout>
  );
};

export default ReviewBarberPage;
