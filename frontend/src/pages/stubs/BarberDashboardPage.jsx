// ============================================
// BARBER DASHBOARD PAGE
// Member C - Barber Atelier
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyReservations, confirmReservation, updateReservation } from '../../services/reservations';
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

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Stats summary
  const totalToday = todayBookings.length;
  const completedToday = todayBookings.filter((r) => r.status === 'completed').length;
  const pendingTotal = allBookings.filter((r) => r.status === 'pending').length;
  const totalAll = allBookings.length;

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
    <div className="barber-dashboard">
      {/* Sidebar */}
      <aside className="bd-sidebar">
        <div className="bd-brand">
          <div className="bd-brand-mark">BA</div>
          <div>
            <span className="bd-brand-name">Barber Atelier</span>
            <span className="bd-brand-sub">Thợ cắt tóc</span>
          </div>
        </div>

        <div className="bd-barber-card">
          <div className="bd-avatar">{(user.name || 'B')[0].toUpperCase()}</div>
          <div>
            <p className="bd-barber-name">{user.name || 'Thợ cắt tóc'}</p>
            <p className="bd-barber-role">Barber</p>
          </div>
        </div>

        <div className="bd-summary-stats">
          <div className="bd-stat">
            <span className="bd-stat-val">{totalToday}</span>
            <span className="bd-stat-lbl">Lịch hôm nay</span>
          </div>
          <div className="bd-stat">
            <span className="bd-stat-val">{completedToday}</span>
            <span className="bd-stat-lbl">Đã xong hôm nay</span>
          </div>
          <div className="bd-stat">
            <span className="bd-stat-val">{pendingTotal}</span>
            <span className="bd-stat-lbl">Chờ xác nhận</span>
          </div>
          <div className="bd-stat">
            <span className="bd-stat-val">{totalAll}</span>
            <span className="bd-stat-lbl">Tổng lịch hẹn</span>
          </div>
        </div>

        <nav className="bd-nav">
          {TABS.map((tab) => (
            <button
              className={`bd-nav-item${activeTab === tab.key ? ' active' : ''}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <button className="bd-logout" onClick={handleLogout} type="button">Đăng xuất</button>
      </aside>

      {/* Main */}
      <main className="bd-main">
        <header className="bd-topbar">
          <div>
            <h1 className="bd-page-title">
              {activeTab === 'today' && 'Lịch hẹn hôm nay'}
              {activeTab === 'schedule' && 'Lịch theo ngày'}
              {activeTab === 'upcoming' && 'Lịch hẹn sắp tới'}
              {activeTab === 'history' && 'Lịch sử cắt tóc'}
            </h1>
            <p className="bd-page-date">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button className="bd-btn-outline" onClick={load} type="button">Làm mới</button>
        </header>

        <div className="bd-content">
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
        </div>
      </main>
    </div>
  );
}

export default BarberDashboardPage;
