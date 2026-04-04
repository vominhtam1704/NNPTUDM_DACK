import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getReservationById } from '../../services/reservations';
import { createReview } from '../../services/reviews';
import '../ReviewBarberPage.scss';

const feedbackTags = [
  'Ky thuat cat tot',
  'Tu van nhiet tinh',
  'Dung gio',
  'Khong gian sach se',
  'Cham soc tan tam',
  'Dang quay lai lan sau',
];

const ratingDetails = [
  { id: 'skill', label: 'Tay nghe' },
  { id: 'attitude', label: 'Thai do' },
  { id: 'punctuality', label: 'Dung gio' },
  { id: 'cleanliness', label: 'Ve sinh' },
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
        const data = await getReservationById(appointmentId);
        if (active) {
          setReservation(data);
        }
      } catch (error) {
        if (active) {
          setSubmitError(error.message || 'Khong the tai thong tin lich hen');
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
    const recommendSummary = wouldRecommend ? 'Khach hang san sang gioi thieu.' : 'Khach hang chua san sang gioi thieu.';
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
      setSubmitError(error.message || 'Gui danh gia that bai');
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
        service: reservation.serviceId?.name || 'Dich vu',
        price: `${Number(reservation.totalPrice || 0).toLocaleString('vi-VN')}d`,
      }
    : null;

  if (submitted) {
    return (
      <div className="review-page">
        <main className="review-shell review-shell-success">
          <section className="review-success-card">
            <div className="review-success-icon">
              <span className="material-symbols-outlined filled">verified</span>
            </div>
            <p className="review-eyebrow">Danh gia da duoc gui</p>
            <h1>Cam on ban da chia se trai nghiem</h1>
            <p>
              Nhan xet cua ban se giup {barber.name} cai thien chat luong dich vu va giup khach
              hang khac de dua ra lua chon phu hop.
            </p>
            <div className="review-success-actions">
              <Link className="review-primary-btn" to="/profile">
                Ve lich su lich hen
              </Link>
              <button className="review-secondary-btn" onClick={() => navigate('/')} type="button">
                Trang chu
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="review-page">
        <main className="review-shell review-shell-success">
          <section className="review-success-card">
            <p>Dang tai thong tin lich hen...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!reservation || !barber) {
    return (
      <div className="review-page">
        <main className="review-shell review-shell-success">
          <section className="review-success-card">
            <p className="review-eyebrow">Khong tai duoc du lieu</p>
            <h1>Khong tim thay lich hen de danh gia</h1>
            <p>{submitError || 'Hay quay lai trang ho so va thu mo lai lich hen.'}</p>
            <div className="review-success-actions">
              <Link className="review-primary-btn" to="/profile">
                Ve ho so
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="review-page">
      <header className="review-topbar">
        <div className="review-topbar-inner">
          <button className="review-back-btn" onClick={() => navigate(-1)} type="button">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <p className="review-topbar-label">Danh gia sau lich hen</p>
            <h1>Gui rating cho tho</h1>
          </div>
          <span className="review-id">#{appointmentId}</span>
        </div>
      </header>

      <main className="review-shell">
        <section className="review-form-panel">
          <div className="review-intro-card">
            <p className="review-eyebrow">Trai nghiem cua ban</p>
            <h2>Ban danh gia buoi hen nay nhu the nao?</h2>
            <p>
              Danh gia chi mat duoi 1 phut. Hay chia se cam nhan that de salon cai thien chat
              luong phuc vu.
            </p>

            <StarRow large onChange={setOverallRating} value={overallRating} />

            <div className="review-score-chip">
              <strong>{overallRating}.0/5</strong>
              <span>{wouldRecommend ? 'San sang gioi thieu cho ban be' : 'Can cai thien them'}</span>
            </div>
          </div>

          <form className="review-form" onSubmit={handleSubmit}>
            {submitError ? <div className="review-inline-error">{submitError}</div> : null}
            <section className="review-section">
              <div className="section-heading">
                <h3>Diem chi tiet</h3>
                <span>Trung binh {averageDetail}</span>
              </div>

              <div className="detail-rating-list">
                {ratingDetails.map((item) => (
                  <div className="detail-rating-item" key={item.id}>
                    <div>
                      <strong>{item.label}</strong>
                      <p>Danh gia muc do hai long cho tieu chi nay.</p>
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
                <h3>Diem noi bat</h3>
                <span>Chon nhieu muc neu phu hop</span>
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
                <h3>Nhan xet them</h3>
                <span>Toi da 300 ky tu</span>
              </div>

              <textarea
                maxLength={300}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Mo ta chi tiet ve tay nghe, thai do va khong gian trai nghiem."
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
                  <span>Toi se gioi thieu tho nay cho nguoi quen</span>
                </label>
                <span>{comment.length}/300</span>
              </div>
            </section>

            <div className="review-form-actions">
              <button className="review-primary-btn" disabled={isSubmitting || !reservation} type="submit">
                {isSubmitting ? 'Dang gui...' : 'Gui danh gia'}
              </button>
              <Link className="review-secondary-btn" to="/profile">
                Bo qua luc nay
              </Link>
            </div>
          </form>
        </section>

        <aside className="review-sidebar">
          <section className="barber-summary-card">
            <div className="barber-summary-header">
              <img alt={barber.name} src={barber.image} />
              <div>
                <p className="review-eyebrow">Tho duoc danh gia</p>
                <h3>{barber.name}</h3>
                <span>{barber.role}</span>
              </div>
            </div>

            <div className="barber-summary-stats">
              <div>
                <strong>{overallRating}.0</strong>
                <span>Diem ban dang chon</span>
              </div>
              <div>
                <strong>{selectedTags.length}</strong>
                <span>Diem noi bat</span>
              </div>
            </div>
          </section>

          <section className="appointment-card">
            <p className="review-eyebrow">Thong tin lich hen</p>
            <div className="appointment-row">
              <span>Dich vu</span>
              <strong>{appointment?.service || 'Dich vu'}</strong>
            </div>
            <div className="appointment-row">
              <span>Ngay gio</span>
              <strong>
                {appointment?.date || '--'} · {appointment?.time || '--'}
              </strong>
            </div>
            <div className="appointment-row">
              <span>Thanh toan</span>
              <strong>{appointment?.price || '--'}</strong>
            </div>
            <div className="appointment-row">
              <span>Ma lich hen</span>
              <strong>{appointmentId}</strong>
            </div>
          </section>

          <section className="review-tip-card">
            <p className="review-eyebrow">Goi y</p>
            <ul>
              <li>Neu tho tu van kieu toc phu hop, hay nhac ro trong nhan xet.</li>
              <li>Danh gia can bang giua thai do, tay nghe va do dung gio.</li>
              <li>Thong tin cu the se huu ich hon danh gia qua ngan.</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default ReviewBarberPage;
