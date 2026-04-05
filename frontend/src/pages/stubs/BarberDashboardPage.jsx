// ============================================
// BARBER DASHBOARD PAGE
// Member C - Barber Atelier
// ============================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyReservations, confirmReservation, completeReservation } from '../../services/reservations';
import PageLayout from '../../components/PageLayout';
import '../BarberDashboardPage.scss';

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  done: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const STATUS_CLASS = {
  pending: 'bd-badge-warning',
  confirmed: 'bd-badge-info',
  done: 'bd-badge-success',
  cancelled: 'bd-badge-error',
};

function LoadingState() {
  return (
    <div className="cms-state">
      <div className="cms-spinner" />
      <span>Đang tải dữ liệu...</span>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="cms-state">
      <p style={{ color: 'var(--error)', fontWeight: 600 }}>{message}</p>
      {onRetry && (
        <button className="btn-sm btn-primary" onClick={onRetry} type="button">
          Thử lại
        </button>
      )}
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
  const [lastSync, setLastSync] = useState(new Date());
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    setError('');
    try {
      const res = await getMyReservations();
      // Handle standardized response for reservations (returns full body)
      const data = Array.isArray(res) ? res : (res?.data || res?.reservations || []);
      setAllBookings(data);
      setLastSync(new Date());
    } catch (e) {
      if (!isAuto) setError(e.message || 'Không thể tải lịch hẹn');
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds to catch new customer bookings
    const interval = setInterval(() => {
      load(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const today = getTodayString();

  const currentBookings = useMemo(() => {
    let list = [];
    if (activeTab === 'today') {
      list = allBookings.filter((r) => (r.appointmentDate?.slice(0, 10) || '') === today && r.status !== 'done' && r.status !== 'cancelled');
    } else if (activeTab === 'schedule') {
      list = allBookings.filter((r) => (r.appointmentDate?.slice(0, 10) || '') === selectedDate && r.status !== 'done' && r.status !== 'cancelled');
    } else if (activeTab === 'upcoming') {
      list = allBookings.filter((r) => (r.appointmentDate?.slice(0, 10) || '') > today && (r.status === 'pending' || r.status === 'confirmed'));
    } else if (activeTab === 'history') {
      list = allBookings.filter((r) => r.status === 'done' || r.status === 'cancelled');
    }
    
    return list.sort((a, b) => {
      const dateComp = (a.appointmentDate || '').localeCompare(b.appointmentDate || '');
      if (dateComp !== 0) return dateComp;
      return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
    });
  }, [allBookings, activeTab, today, selectedDate]);

  const handleAction = async (action, id) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'confirm') {
        await confirmReservation(id);
      } else if (action === 'complete') {
        await completeReservation(id);
      }
      await load();
    } catch (e) {
      alert(e.message || 'Thao tác thất bại');
    } finally {
      setActionLoading('');
    }
  };

  // Stats summary (counts only pending/confirmed for active tabs)
  const totalToday = allBookings.filter((r) => (r.appointmentDate?.slice(0, 10) || '') === today && r.status !== 'done' && r.status !== 'cancelled').length;
  const pendingTotal = allBookings.filter((r) => r.status === 'pending').length;
  const totalUpcoming = allBookings.filter((r) => (r.appointmentDate?.slice(0, 10) || '') > today && (r.status === 'pending' || r.status === 'confirmed')).length;

  const TABS = [
    { key: 'today', label: `Hôm nay (${totalToday})` },
    { key: 'schedule', label: 'Lịch theo ngày' },
    { key: 'upcoming', label: `Sắp tới (${totalUpcoming})` },
    { key: 'history', label: 'Lịch sử' },
  ];

  const renderRow = (r) => (
    <tr key={r._id}>
      <td className="time-cell">{formatTime(r.appointmentTime)}</td>
      <td className="customer-name">
        <div>{r.customerId?.name || 'Khách hàng'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{r.customerId?.phone || ''}</div>
      </td>
      <td>{r.serviceId?.name || '—'}</td>
      <td>{formatDate(r.appointmentDate)}</td>
      <td>
        <span className={`badge ${STATUS_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span>
      </td>
      <td>
        <div className="action-btns">
          {r.status === 'pending' && (
            <button
              className="btn-sm btn-primary"
              disabled={!!actionLoading}
              onClick={() => handleAction('confirm', r._id)}
              type="button"
            >
              {actionLoading === `confirm-${r._id}` ? '...' : 'Nhận lịch'}
            </button>
          )}
          {r.status === 'confirmed' && (
            <button
              className="btn-sm btn-success"
              disabled={!!actionLoading}
              onClick={() => handleAction('complete', r._id)}
              type="button"
            >
              {actionLoading === `complete-${r._id}` ? '...' : 'Hoàn thành'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <PageLayout>
      <div className="barber-dashboard-unified">
        <section className="tab-content">
          <div className="tab-header">
            <div>
              <h2 className="tab-title">Lịch làm việc của tôi</h2>
              <p className="tab-subtitle">
                {formatDate(new Date())} 
                <span className="sync-info">• Cập nhật lúc {lastSync.toLocaleTimeString('vi-VN')}</span>
              </p>
            </div>
            <div className="tab-actions">
              <button className="btn-refresh" onClick={() => load()} title="Làm mới ngay" type="button">
                <span className="material-symbols-outlined">sync</span>
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card accent-primary">
              <p className="stat-label">Hôm nay</p>
              <h3 className="stat-value">{totalToday}</h3>
              <span className="stat-sub">Lịch hẹn trong ngày</span>
            </div>
            <div className="stat-card accent-amber">
              <p className="stat-label">Đang chờ</p>
              <h3 className="stat-value">{pendingTotal}</h3>
              <span className="stat-sub">Cần xác nhận</span>
            </div>
            <div className="stat-card accent-success">
              <p className="stat-label">Sắp tới</p>
              <h3 className="stat-value">{totalUpcoming}</h3>
              <span className="stat-sub">Lịch trong tương lai</span>
            </div>
          </div>

          <div className="filter-bar">
            <div className="status-tabs">
              {TABS.map((tab) => (
                <button
                  className={`status-tab${activeTab === tab.key ? ' active' : ''}`}
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {activeTab === 'schedule' && (
              <div className="date-picker-mini">
                <span>Chọn ngày:</span>
                <input
                  onChange={(e) => setSelectedDate(e.target.value)}
                  type="date"
                  value={selectedDate}
                />
              </div>
            )}
          </div>

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={load} />}

          {!loading && !error && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Khách hàng</th>
                    <th>Dịch vụ</th>
                    <th>Ngày hẹn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="bd-empty">
                          <h3>Không có lịch hẹn</h3>
                          <p>Dữ liệu trống trong mục này</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentBookings.map(renderRow)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

export default BarberDashboardPage;
