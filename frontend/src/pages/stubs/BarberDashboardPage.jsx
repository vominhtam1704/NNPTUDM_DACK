// ============================================
// BARBER DASHBOARD PAGE
// Member C - Barber Atelier
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyReservations, confirmReservation, updateReservation } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../BarberDashboardPage.scss';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const STATUS_CLASS = {
  pending: 'bd-badge-warning',
  confirmed: 'bd-badge-info',
  completed: 'bd-badge-success',
  cancelled: 'bd-badge-error',
};

function LoadingState() {
  return (
    <div className="bd-state">
      <div className="bd-spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="bd-state bd-state-error">
      <p>{message}</p>
      {onRetry && <button className="bd-btn-outline" onClick={onRetry} type="button">Thử lại</button>}
    </div>
  );
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(time) {
  if (!time) return '—';
  return time;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function BarberDashboardPage() {
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [activeTab, setActiveTab] = useState('today');
  const [actionLoading, setActionLoading] = useState('');


  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyReservations();
      setAllBookings(Array.isArray(res) ? res : (res?.reservations || []));
    } catch (e) {
      setError(e.message || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = getTodayString();

  const todayBookings = useMemo(() => {
    return allBookings
      .filter((r) => {
        const rDate = r.appointmentDate ? r.appointmentDate.slice(0, 10) : '';
        return rDate === today;
      })
      .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
  }, [allBookings, today]);

  const selectedDateBookings = useMemo(() => {
    return allBookings
      .filter((r) => {
        const rDate = r.appointmentDate ? r.appointmentDate.slice(0, 10) : '';
        return rDate === selectedDate;
      })
      .sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
  }, [allBookings, selectedDate]);

  const upcomingBookings = useMemo(() => {
    return allBookings
      .filter((r) => {
        const rDate = r.appointmentDate ? r.appointmentDate.slice(0, 10) : '';
        return rDate > today && (r.status === 'pending' || r.status === 'confirmed');
      })
      .sort((a, b) => {
        const dateComp = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
        if (dateComp !== 0) return dateComp;
        return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
      });
  }, [allBookings, today]);

  const historyBookings = useMemo(() => {
    return allBookings
      .filter((r) => r.status === 'completed' || r.status === 'cancelled')
      .sort((a, b) => (b.appointmentDate || '').localeCompare(a.appointmentDate || ''));
  }, [allBookings]);

  const handleAction = async (action, id) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'confirm') await confirmReservation(id);
      else if (action === 'complete') await updateReservation(id, { status: 'completed' });
      await load();
    } catch (e) {
      alert(e.message || 'Thao tác thất bại');
    } finally {
      setActionLoading('');
    }
  };


  // Stats summary
  const totalToday = todayBookings.length;
  const completedToday = todayBookings.filter((r) => r.status === 'completed').length;
  const pendingTotal = allBookings.filter((r) => r.status === 'pending').length;

  const TABS = [
    { key: 'today', label: `Hôm nay (${totalToday})` },
    { key: 'schedule', label: 'Lịch theo ngày' },
    { key: 'upcoming', label: 'Sắp tới' },
    { key: 'history', label: 'Lịch sử' },
  ];

  const renderBookingCard = (r) => (
    <div className={`bd-booking-card bd-status-${r.status}`} key={r._id}>
      <div className="bd-booking-time">{formatTime(r.appointmentTime)}</div>
      <div className="bd-booking-body">
        <h4 className="bd-booking-customer">{r.customer?.name || 'Khách hàng'}</h4>
        <p className="bd-booking-service">{r.service?.name || '—'}</p>
        {r.customer?.phone && <p className="bd-booking-phone">{r.customer.phone}</p>}
        <p className="bd-booking-date">{formatDate(r.appointmentDate)}</p>
      </div>
      <div className="bd-booking-meta">
        <span className={`bd-badge ${STATUS_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
        {r.service?.price && <span className="bd-price">{Number(r.service.price).toLocaleString('vi-VN')}đ</span>}
      </div>
      <div className="bd-booking-actions">
        {r.status === 'pending' && (
          <button
            className="bd-btn-primary"
            disabled={!!actionLoading}
            onClick={() => handleAction('confirm', r._id)}
            type="button"
          >
            {actionLoading === `confirm-${r._id}` ? '...' : 'Nhận lịch'}
          </button>
        )}
        {r.status === 'confirmed' && (
          <button
            className="bd-btn-success"
            disabled={!!actionLoading}
            onClick={() => handleAction('complete', r._id)}
            type="button"
          >
            {actionLoading === `complete-${r._id}` ? '...' : 'Hoàn thành'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <PageLayout>
      <div className="barber-dashboard-unified">
        <header className="bd-header">
          <div className="header-titles">
            <h1>Quản lý lịch hẹn</h1>
            <p className="sub-text">{formatDate(new Date())}</p>
          </div>
          
          <div className="bd-stats-row">
            <div className="mini-stat">
              <span className="label">Hôm nay</span>
              <strong className="value">{totalToday}</strong>
            </div>
            <div className="mini-stat">
              <span className="label">Đã xong</span>
              <strong className="value">{completedToday}</strong>
            </div>
            <div className="mini-stat">
              <span className="label">Chờ duyệt</span>
              <strong className="value pending">{pendingTotal}</strong>
            </div>
          </div>

          <div className="bd-tab-nav">
            {TABS.map((tab) => (
              <button
                className={`bd-tab-item${activeTab === tab.key ? ' active' : ''}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
            <button className="bd-refresh-btn" onClick={load} type="button">
              <span className="material-symbols-outlined">refresh</span>
            </button>
          </div>
        </header>

        <section className="bd-content-shell">
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <>
              {/* TAB: TODAY */}
              {activeTab === 'today' && (
                <>
                  {todayBookings.length === 0 ? (
                    <div className="bd-empty">
                      <p className="bd-empty-title">Hôm nay chưa có lịch hẹn nào</p>
                      <p className="bd-empty-sub">Hãy tận hưởng ngày nghỉ hoặc kiểm tra lại sau!</p>
                    </div>
                  ) : (
                    <div className="bd-booking-list">
                      {todayBookings.map(renderBookingCard)}
                    </div>
                  )}
                </>
              )}

              {/* TAB: SCHEDULE BY DATE */}
              {activeTab === 'schedule' && (
                <>
                  <div className="bd-date-picker">
                    <label className="bd-date-label">
                      Chọn ngày
                      <input
                        className="bd-date-input"
                        onChange={(e) => setSelectedDate(e.target.value)}
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                  </div>
                  {selectedDateBookings.length === 0 ? (
                    <div className="bd-empty">
                      <p className="bd-empty-title">Không có lịch hẹn vào ngày {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN')}</p>
                    </div>
                  ) : (
                    <div className="bd-booking-list">
                      {selectedDateBookings.map(renderBookingCard)}
                    </div>
                  )}
                </>
              )}

              {/* TAB: UPCOMING */}
              {activeTab === 'upcoming' && (
                <>
                  {upcomingBookings.length === 0 ? (
                    <div className="bd-empty">
                      <p className="bd-empty-title">Không có lịch hẹn sắp tới</p>
                    </div>
                  ) : (
                    <div className="bd-booking-list">
                      {upcomingBookings.map(renderBookingCard)}
                    </div>
                  )}
                </>
              )}

              {/* TAB: HISTORY */}
              {activeTab === 'history' && (
                <>
                  {historyBookings.length === 0 ? (
                    <div className="bd-empty">
                      <p className="bd-empty-title">Chưa có lịch sử</p>
                    </div>
                  ) : (
                    <div className="bd-booking-list">
                      {historyBookings.map(renderBookingCard)}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default BarberDashboardPage;
