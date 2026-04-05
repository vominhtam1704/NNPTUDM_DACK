// ============================================
// ADMIN DASHBOARD PAGE - FULL CMS
// Member C - Barber Atelier
// ============================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAnalyticsOverview } from '../../services/analytics';
import { getAllReservations, confirmReservation, cancelReservation, updateReservation } from '../../services/reservations';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/products';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categories';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem, adjustStock } from '../../services/inventory';
import { getAllUsers, updateUser, deleteUser } from '../../services/users';
import { getRoles } from '../../services/roles';
import { getAllVouchers, createVoucher, updateVoucher, deleteVoucher } from '../../services/vouchers';
import { getAssetUrl } from '../../utils/url';
import '../AdminDashboardPage.scss';

// ─── Utilities ───────────────────────────────────────────────
const formatCurrency = (v) => `${Number(v || 0).toLocaleString('vi-VN')}đ`;
const formatCompact = (v) => `${Math.round(Number(v || 0) / 1_000_000)}tr`;
const formatPct = (v) => `${v > 0 ? '+' : ''}${v}%`;

const STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const STATUS_CLASS = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Shared sub-components ───────────────────────────────────
function LoadingState({ text = 'Đang tải dữ liệu...' }) {
  return <div className="cms-state cms-loading"><div className="cms-spinner" /><span>{text}</span></div>;
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="cms-state cms-error">
      <p>{message}</p>
      {onRetry && <button className="btn-outline" onClick={onRetry} type="button">Thử lại</button>}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <p className="modal-msg">{message}</p>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onCancel} type="button">Hủy</button>
          <button className="btn-danger" onClick={onConfirm} type="button">Xác nhận xóa</button>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 0: ANALYTICS ────────────────────────────────────────
const rangeOptions = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'year', label: 'Năm nay' },
  { key: 'custom', label: 'Tùy chỉnh' },
];

function AnalyticsTab() {
  const [range, setRange] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = range === 'custom' && customStart && customEnd
        ? { startDate: customStart, endDate: customEnd }
        : { range };
      const res = await getAnalyticsOverview(params);
      setData(res?.data || res);
    } catch (e) {
      setError(e.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd]);

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) load();
  }, [range, customStart, customEnd, load]);

  const stats = useMemo(() => {
    if (!data?.stats) return [];
    return [
      { label: 'Tổng doanh thu', value: formatCurrency(data.stats.totalRevenue), sub: `${formatPct(data.stats.revenueChange)} so kỳ trước`, accent: 'primary' },
      { label: 'Tổng lịch hẹn', value: data.stats.totalBookings, sub: `Hoàn thành ${data.stats.completionRate}%`, accent: 'teal' },
      { label: 'Khách hàng mới', value: data.stats.newCustomers, sub: `Tăng ${formatPct(data.stats.newCustomersChange)}`, accent: 'amber' },
      { label: 'Đánh giá TB', value: `${data.stats.averageRating}/5.0`, sub: `Biến động ${data.stats.averageRatingChange}`, accent: 'green' },
    ];
  }, [data]);

  const highlightIdx = data?.revenueTrend?.reduce(
    (best, item, i, arr) => (item.revenue > (arr[best]?.revenue || 0) ? i : best), 0
  );

  const handleExport = () => {
    if (!data) return;
    downloadCsv('analytics.csv', [
      ['Chỉ số', 'Giá trị'],
      ['Tổng doanh thu', data.stats.totalRevenue],
      ['Tổng lịch hẹn', data.stats.totalBookings],
      ['Hoàn thành %', data.stats.completionRate],
      ['Khách hàng mới', data.stats.newCustomers],
      ['Đánh giá TB', data.stats.averageRating],
    ]);
  };

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Báo cáo &amp; Phân tích</h2>
          <p className="tab-subtitle">Tổng quan doanh thu và hiệu suất vận hành</p>
        </div>
        <div className="tab-actions">
          <button className="btn-outline" onClick={handleExport} type="button">Xuất CSV</button>
          <button className="btn-outline" onClick={() => window.print()} type="button">In PDF</button>
        </div>
      </div>

      {/* Range filter */}
      <div className="range-tabs">
        {rangeOptions.map((o) => (
          <button
            className={`range-tab${range === o.key ? ' active' : ''}`}
            key={o.key}
            onClick={() => setRange(o.key)}
            type="button"
          >{o.label}</button>
        ))}
      </div>
      {range === 'custom' && (
        <div className="custom-range">
          <label>Từ ngày <input onChange={(e) => setCustomStart(e.target.value)} type="date" value={customStart} /></label>
          <label>Đến ngày <input onChange={(e) => setCustomEnd(e.target.value)} type="date" value={customEnd} /></label>
        </div>
      )}

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            {stats.map((s) => (
              <div className={`stat-card accent-${s.accent}`} key={s.label}>
                <p className="stat-label">{s.label}</p>
                <h3 className="stat-value">{s.value}</h3>
                <span className="stat-sub">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="card">
            <h3 className="card-title">Xu hướng doanh thu</h3>
            {data.revenueTrend?.length > 0 ? (
              <>
                <div className="bar-chart">
                  {data.revenueTrend.map((item, idx) => {
                    const max = Math.max(...data.revenueTrend.map((e) => e.revenue), 1);
                    const h = Math.max((item.revenue / max) * 100, 6);
                    return (
                      <div className="bar-wrap" key={item.label}>
                        <div
                          className={`bar${idx === highlightIdx ? ' bar-highlight' : ''}`}
                          style={{ height: `${h}%` }}
                          title={formatCurrency(item.revenue)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="bar-labels">
                  {data.revenueTrend.map((item) => <span key={item.label}>{item.label}</span>)}
                </div>
              </>
            ) : <p className="empty-text">Chưa có dữ liệu trong khoảng này.</p>}
          </div>

          {/* Top barbers */}
          <div className="card">
            <h3 className="card-title">Top Thợ cắt</h3>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>#</th><th>Tên</th><th>Chức danh</th><th>Doanh thu</th><th>Lịch hẹn</th><th>Đánh giá</th></tr>
                </thead>
                <tbody>
                  {data.topBarbers?.map((b, i) => (
                    <tr key={b.barberId}>
                      <td>{i + 1}</td>
                      <td>{b.name}</td>
                      <td>{b.title || '—'}</td>
                      <td>{formatCompact(b.totalRevenue)}</td>
                      <td>{b.totalBookings}</td>
                      <td>{b.averageRating}/5</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Popular services */}
          <div className="card">
            <h3 className="card-title">Dịch vụ phổ biến</h3>
            <div className="service-bars">
              {data.popularServices?.map((s) => (
                <div className="service-row" key={s.serviceId}>
                  <span className="service-name">{s.name}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${s.percentage}%` }} />
                  </div>
                  <span className="service-pct">{s.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

// ─── TAB 1: APPOINTMENTS ─────────────────────────────────────
function AppointmentsTab() {
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [jumpPage, setJumpPage] = useState('');

  const load = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (fromDate) params.dateFrom = fromDate;
      if (toDate) params.dateTo = toDate;
      // Send search to backend for better filtering
      if (search) params.customerName = search;
      
      const res = await getAllReservations(params);
      // Extract data and pagination from standard response
      const data = Array.isArray(res) ? res : (res?.data || res?.reservations || []);
      const rawPagination = res?.pagination;
      
      console.log('Response received:', { res, data, rawPagination });
      
      // Ensure all pagination values are numbers, not strings
      const paginationInfo = {
        page: Math.max(1, parseInt(rawPagination?.page || pageNum, 10)),
        limit: parseInt(rawPagination?.limit || 10, 10),
        total: parseInt(rawPagination?.total || 0, 10),
        pages: Math.max(1, parseInt(rawPagination?.pages || 1, 10))
      };
      
      console.log('Pagination info set to:', paginationInfo);
      
      setList(data);
      setPagination(paginationInfo);
    } catch (e) {
      setError(e.message || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => { 
    // Reset to page 1 when filters change
    load(1);
  }, [load]);

  // Don't filter again - backend already handles search
  const filtered = list;

  const handleAction = async (action, id) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'confirm') await confirmReservation(id);
      else if (action === 'cancel') await cancelReservation(id);
      else if (action === 'complete') await updateReservation(id, { status: 'completed' });
      await load(pagination.page);
    } catch (e) {
      alert(e.message || 'Thao tác thất bại');
    } finally {
      setActionLoading('');
    }
  };

  const exportCsv = () => {
    downloadCsv('lich-hen.csv', [
      ['Khách hàng', 'Thợ cắt', 'Dịch vụ', 'Ngày hẹn', 'Giờ hẹn', 'Trạng thái'],
      ...filtered.map((r) => [
        r.customerId?.name || '',
        r.barberId?.name || '',
        r.serviceId?.name || '',
        r.appointmentDate || '',
        r.appointmentTime || '',
        STATUS_LABEL[r.status] || r.status,
      ]),
    ]);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum > 0 && pageNum <= pagination.pages) {
      load(pageNum);
      setJumpPage('');
    } else {
      alert(`Vui lòng nhập số trang từ 1 đến ${pagination.pages}`);
    }
  };

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Quản lý Lịch hẹn</h2>
          <p className="tab-subtitle">Xem và cập nhật trạng thái toàn bộ lịch hẹn</p>
        </div>
        <button className="btn-outline" onClick={exportCsv} type="button">Xuất CSV</button>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm khách, thợ, dịch vụ..."
          type="text"
          value={search}
        />
        <div className="date-filter" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.875rem' }}>Từ ngày:</span>
            <input
              type="date"
              onChange={(e) => setFromDate(e.target.value)}
              value={fromDate}
              style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.875rem' }}>Đến ngày:</span>
            <input
              type="date"
              onChange={(e) => setToDate(e.target.value)}
              value={toDate}
              style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #ccc' }}
            />
          </label>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', background: 'none', border: '1px solid #999', borderRadius: '0.25rem', cursor: 'pointer' }}
              type="button"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        <div className="status-tabs">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
            <button
              className={`status-tab${statusFilter === s ? ' active' : ''}`}
              key={s}
              onClick={() => setStatusFilter(s)}
              type="button"
            >
              {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={() => load(pagination.page)} />}
      {!loading && !error && (
        <>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Thợ cắt</th>
                  <th>Dịch vụ</th>
                  <th>Ngày hẹn</th>
                  <th>Giờ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td className="empty-cell" colSpan={7}>Không tìm thấy lịch hẹn nào</td></tr>
                ) : filtered.map((r) => (
                  <tr key={r._id}>
                    <td>{r.customerId?.name || '—'}</td>
                    <td>{r.barberId?.name || '—'}</td>
                    <td>{r.serviceId?.name || '—'}</td>
                    <td>{r.appointmentDate ? new Date(r.appointmentDate).toLocaleDateString('vi-VN') : '—'}</td>
                    <td>{r.appointmentTime || '—'}</td>
                    <td><span className={`badge ${STATUS_CLASS[r.status] || ''}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                    <td>
                      <div className="action-btns">
                        {r.status === 'pending' && (
                          <button
                            className="btn-sm btn-primary"
                            disabled={!!actionLoading}
                            onClick={() => handleAction('confirm', r._id)}
                            type="button"
                          >
                            {actionLoading === `confirm-${r._id}` ? '...' : 'Xác nhận'}
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
                        {(r.status === 'pending' || r.status === 'confirmed') && (
                          <button
                            className="btn-sm btn-danger"
                            disabled={!!actionLoading}
                            onClick={() => handleAction('cancel', r._id)}
                            type="button"
                          >
                            {actionLoading === `cancel-${r._id}` ? '...' : 'Hủy'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', padding: '1rem', flexWrap: 'wrap' }}>
              <button
                disabled={pagination.page <= 1}
                onClick={() => {
                  const prevPage = Math.max(pagination.page - 1, 1);
                  console.log('Clicking prev, current page:', pagination.page, 'prev page:', prevPage);
                  load(prevPage);
                }}
                style={{ padding: '0.5rem 1rem', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
                type="button"
              >
                ← Trước
              </button>
              <span style={{ fontSize: '0.875rem', color: '#666', minWidth: '200px', textAlign: 'center' }}>
                Trang {pagination.page} / {pagination.pages} (Tổng: {pagination.total} bản ghi)
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => {
                  const nextPage = Math.min(pagination.page + 1, pagination.pages);
                  console.log('Clicking next, current page:', pagination.page, 'next page:', nextPage, 'total pages:', pagination.pages);
                  load(nextPage);
                }}
                style={{ padding: '0.5rem 1rem', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.pages ? 0.5 : 1 }}
                type="button"
              >
                Sau →
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', color: '#666' }}>Đi đến trang:</label>
                <input
                  type="number"
                  min="1"
                  max={pagination.pages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                  placeholder="số trang"
                  style={{ width: '60px', padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid #ccc', fontSize: '0.875rem' }}
                />
                <button
                  onClick={handleJumpToPage}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', cursor: 'pointer' }}
                  type="button"
                >
                  Go
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ─── TAB 2: PRODUCTS (CRUD) ───────────────────────────────────
const EMPTY_PRODUCT = { name: '', price: '', duration: '', categoryId: '', description: '' };

function ProductsTab() {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, cRes] = await Promise.all([getProducts(), getCategories()]);

      // Standard response parsing
      const productList = Array.isArray(pRes) ? pRes : (pRes?.data || pRes?.products || []);
      const categoryList = Array.isArray(cRes) ? cRes : (cRes?.data || cRes?.categories || []);

      setList(productList);
      setCats(categoryList);
    } catch (e) {
      console.error('ProductsTab load error:', e);
      setError(e.message || 'Không thể tải dữ liệu dịch vụ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_PRODUCT); setImageFile(null); setSaveError(''); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name || '', price: p.price || '', duration: p.duration || '', categoryId: p.category?._id || p.categoryId || '', description: p.description || '' });
    setImageFile(null);
    setSaveError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);
      if (editing) await updateProduct(editing._id, fd);
      else await createProduct(fd);
      setShowForm(false);
      await load();
    } catch (e) {
      setSaveError(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  const filtered = list.filter((p) => !search || (p.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Quản lý Dịch vụ</h2>
          <p className="tab-subtitle">Thêm, sửa, xóa dịch vụ cắt tóc</p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">Thêm dịch vụ</button>
      </div>

      <div className="filter-bar">
        <input className="search-input" onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm dịch vụ..." type="text" value={search} />
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <div className="product-grid">
          {filtered.length === 0 ? <p className="empty-text">Chưa có dịch vụ nào.</p> : filtered.map((p) => (
            <div className="product-card" key={p._id}>
              {p.thumbnail && <img alt={p.name} className="product-img" src={getAssetUrl(p.thumbnail)} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />}
              <div className="product-img-placeholder" style={{ display: p.thumbnail ? 'none' : 'flex' }}>{(p.name || 'S')[0].toUpperCase()}</div>
              <div className="product-body">
                <p className="product-cat">{p.categoryId?.name || '—'}</p>
                <h4 className="product-name">{p.name}</h4>
                <p className="product-price">{formatCurrency(p.price)}</p>
                <p className="product-dur">{p.duration ? `${p.duration} phút` : ''}</p>
              </div>
              <div className="product-actions">
                <button className="btn-sm btn-outline" onClick={() => openEdit(p)} type="button">Sửa</button>
                <button className="btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(p)} type="button">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box modal-lg">
            <h3 className="modal-title">{editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h3>
            <form className="cms-form" onSubmit={handleSave}>
              <div className="form-grid">
                <label className="form-field span-2">
                  <span>Tên dịch vụ *</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cắt tóc nam" required type="text" value={form.name} />
                </label>
                <label className="form-field">
                  <span>Giá (đ) *</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="50000" required type="number" value={form.price} />
                </label>
                <label className="form-field">
                  <span>Thời gian (phút)</span>
                  <input min="1" onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="30" type="number" value={form.duration} />
                </label>
                <label className="form-field span-2">
                  <span>Danh mục</span>
                  <select onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} value={form.categoryId}>
                    <option value="">-- Chọn danh mục --</option>
                    {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="form-field span-2">
                  <span>Mô tả</span>
                  <textarea onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả dịch vụ..." rows={3} value={form.description} />
                </label>
                <label className="form-field span-2">
                  <span>Hình ảnh</span>
                  <input accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} ref={fileRef} type="file" />
                  {imageFile && <span className="file-hint">{imageFile.name}</span>}
                </label>
              </div>
              {saveError && <p className="form-error">{saveError}</p>}
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowForm(false)} type="button">Hủy</button>
                <button className="btn-primary" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Xóa dịch vụ "${deleteTarget.name}"? Thao tác này không thể hoàn tác.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

// ─── TAB 3: CATEGORIES (CRUD) ─────────────────────────────────
const EMPTY_CAT = { name: '', description: '' };

function CategoriesTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      // Standard response parsing
      const categoryList = Array.isArray(res) ? res : (res?.data || res?.categories || []);
      setList(categoryList);
    } catch (e) {
      setError(e.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_CAT); setSaveError(''); setShowForm(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name || '', description: c.description || '' }); setSaveError(''); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editing) await updateCategory(editing._id, form);
      else await createCategory(form);
      setShowForm(false);
      await load();
    } catch (e) {
      setSaveError(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Quản lý Danh mục</h2>
          <p className="tab-subtitle">Phân loại các nhóm dịch vụ</p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">Thêm danh mục</button>
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Tên danh mục</th><th>Mô tả</th><th>Số dịch vụ</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td className="empty-cell" colSpan={5}>Chưa có danh mục nào</td></tr>
              ) : list.map((c, i) => (
                <tr key={c._id}>
                  <td>{i + 1}</td>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || '—'}</td>
                  <td>{c.productCount ?? '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-outline" onClick={() => openEdit(c)} type="button">Sửa</button>
                      <button className="btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(c)} type="button">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">{editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h3>
            <form className="cms-form" onSubmit={handleSave}>
              <label className="form-field">
                <span>Tên danh mục *</span>
                <input onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Cắt tóc nam" required type="text" value={form.name} />
              </label>
              <label className="form-field">
                <span>Mô tả</span>
                <textarea onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả danh mục..." rows={3} value={form.description} />
              </label>
              {saveError && <p className="form-error">{saveError}</p>}
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowForm(false)} type="button">Hủy</button>
                <button className="btn-primary" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Xóa danh mục "${deleteTarget.name}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

// ─── TAB 4: INVENTORY ─────────────────────────────────────────
const EMPTY_INV = { name: '', quantity: '', unit: '', minQuantity: '', notes: '' };

function InventoryTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_INV);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getInventory(showLowOnly ? { lowStock: true } : {});
      // Standard response parsing
      const inventoryList = Array.isArray(res) ? res : (res?.data || res?.items || res?.inventories || []);
      setList(inventoryList);
    } catch (e) {
      setError(e.message || 'Không thể tải kho hàng');
    } finally {
      setLoading(false);
    }
  }, [showLowOnly]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_INV); setSaveError(''); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || '', quantity: item.quantity ?? '', unit: item.unit || '', minQuantity: item.minQuantity ?? '', notes: item.notes || '' });
    setSaveError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editing) await updateInventoryItem(editing._id, form);
      else await createInventoryItem(form);
      setShowForm(false);
      await load();
    } catch (e) {
      setSaveError(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventoryItem(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  const handleAdjust = async () => {
    if (!adjustTarget) return;
    try {
      await adjustStock(adjustTarget._id, { adjustment: Number(adjustQty) });
      setAdjustTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Điều chỉnh thất bại');
    }
  };

  const filtered = list.filter((item) => !search || (item.name || '').toLowerCase().includes(search.toLowerCase()));
  const lowCount = list.filter((item) => item.quantity <= (item.minQuantity || 0)).length;

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Quản lý Kho hàng</h2>
          <p className="tab-subtitle">Vật tư, hóa chất và thiết bị cửa hàng</p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">Thêm hàng hóa</button>
      </div>

      {lowCount > 0 && (
        <div className="alert-warning">
          Cảnh báo: Có <strong>{lowCount}</strong> mặt hàng sắp hết – cần nhập thêm.
        </div>
      )}

      <div className="filter-bar">
        <input className="search-input" onChange={(e) => setSearch(e.target.value)} placeholder="Tìm hàng hóa..." type="text" value={search} />
        <label className="toggle-label">
          <input checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)} type="checkbox" />
          <span>Chỉ hiện hàng sắp hết</span>
        </label>
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tên mặt hàng</th><th>Tồn kho</th><th>Đơn vị</th><th>Tối thiểu</th><th>Tình trạng</th><th>Ghi chú</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td className="empty-cell" colSpan={7}>Kho không có mặt hàng nào</td></tr>
              ) : filtered.map((item) => {
                const isLow = item.quantity <= (item.minQuantity || 0);
                return (
                  <tr key={item._id} className={isLow ? 'row-warning' : ''}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.quantity}</td>
                    <td>{item.unit || '—'}</td>
                    <td>{item.minQuantity ?? '—'}</td>
                    <td>
                      <span className={`badge ${isLow ? 'badge-error' : 'badge-success'}`}>
                        {isLow ? 'Sắp hết' : 'Đủ hàng'}
                      </span>
                    </td>
                    <td>{item.notes || '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-sm btn-primary" onClick={() => { setAdjustTarget(item); setAdjustQty(0); }} type="button">Điều chỉnh</button>
                        <button className="btn-sm btn-outline" onClick={() => openEdit(item)} type="button">Sửa</button>
                        <button className="btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(item)} type="button">Xóa</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust stock modal */}
      {adjustTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">Điều chỉnh tồn kho: {adjustTarget.name}</h3>
            <p className="modal-msg">Tồn kho hiện tại: <strong>{adjustTarget.quantity} {adjustTarget.unit}</strong></p>
            <label className="form-field" style={{ marginTop: '1rem' }}>
              <span>Số lượng điều chỉnh (+ thêm / - giảm)</span>
              <input onChange={(e) => setAdjustQty(e.target.value)} placeholder="VD: 10 hoặc -5" type="number" value={adjustQty} />
            </label>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAdjustTarget(null)} type="button">Hủy</button>
              <button className="btn-primary" onClick={handleAdjust} type="button">Cập nhật</button>
            </div>
          </div>
        </div>
      )}

      {/* Save form modal */}
      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">{editing ? 'Chỉnh sửa mặt hàng' : 'Thêm mặt hàng mới'}</h3>
            <form className="cms-form" onSubmit={handleSave}>
              <div className="form-grid">
                <label className="form-field span-2">
                  <span>Tên mặt hàng *</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Gel tạo kiểu" required type="text" value={form.name} />
                </label>
                <label className="form-field">
                  <span>Số lượng *</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="100" required type="number" value={form.quantity} />
                </label>
                <label className="form-field">
                  <span>Đơn vị</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="chai, hộp, cái..." type="text" value={form.unit} />
                </label>
                <label className="form-field">
                  <span>Tồn tối thiểu</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} placeholder="10" type="number" value={form.minQuantity} />
                </label>
                <label className="form-field">
                  <span>Ghi chú</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Ghi chú..." type="text" value={form.notes} />
                </label>
              </div>
              {saveError && <p className="form-error">{saveError}</p>}
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowForm(false)} type="button">Hủy</button>
                <button className="btn-primary" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Xóa mặt hàng "${deleteTarget.name}"?`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

// ─── TAB 5: STAFF & ROLES ─────────────────────────────────────
function StaffTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, rRes] = await Promise.all([getAllUsers(), getRoles()]);
      // Standard response parsing
      const userList = Array.isArray(uRes) ? uRes : (uRes?.data || uRes?.users || []);
      const roleList = Array.isArray(rRes) ? rRes : (rRes?.data || rRes?.roles || []);
      setUsers(userList);
      setRoles(roleList);
    } catch (e) {
      setError(e.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [users, roleFilter, search]);

  const handleAssign = async () => {
    if (!assignTarget || !newRole) return;
    setSaving(true);
    try {
      await updateUser(assignTarget._id, { role: newRole });
      setAssignTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Gán quyền thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Xóa tài khoản thất bại');
    }
  };

  const ROLE_LABEL = { admin: 'Quản trị viên', barber: 'Thợ cắt', customer: 'Khách hàng' };
  const ROLE_CLASS = { admin: 'badge-primary', barber: 'badge-amber', customer: 'badge-info' };

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Nhân sự &amp; Phân quyền</h2>
          <p className="tab-subtitle">Quản lý tài khoản và phân quyền người dùng</p>
        </div>
      </div>

      <div className="filter-bar">
        <input className="search-input" onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, email..." type="text" value={search} />
        <div className="status-tabs">
          {['all', 'admin', 'barber', 'customer'].map((r) => (
            <button
              className={`status-tab${roleFilter === r ? ' active' : ''}`}
              key={r}
              onClick={() => setRoleFilter(r)}
              type="button"
            >
              {r === 'all' ? 'Tất cả' : ROLE_LABEL[r] || r}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Vai trò</th><th>Ngày tạo</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td className="empty-cell" colSpan={6}>Không tìm thấy người dùng</td></tr>
              ) : filtered.map((u) => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td><span className={`badge ${ROLE_CLASS[u.role] || 'badge-info'}`}>{ROLE_LABEL[u.role] || u.role}</span></td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => { setAssignTarget(u); setNewRole(u.role || ''); }}
                        type="button"
                      >Gán quyền</button>
                      <button className="btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(u)} type="button">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign role modal */}
      {assignTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">Gán quyền: {assignTarget.name}</h3>
            <p className="modal-msg">Quyền hiện tại: <strong>{ROLE_LABEL[assignTarget.role] || assignTarget.role}</strong></p>
            <label className="form-field" style={{ marginTop: '1rem' }}>
              <span>Vai trò mới</span>
              <select onChange={(e) => setNewRole(e.target.value)} value={newRole}>
                <option value="">-- Chọn vai trò --</option>
                {roles.length > 0
                  ? roles.map((r) => <option key={r._id} value={r.name}>{ROLE_LABEL[r.name] || r.name}</option>)
                  : ['admin', 'barber', 'customer'].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)
                }
              </select>
            </label>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setAssignTarget(null)} type="button">Hủy</button>
              <button className="btn-primary" disabled={saving || !newRole} onClick={handleAssign} type="button">
                {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Xóa tài khoản "${deleteTarget.name}" (${deleteTarget.email})? Thao tác này không thể hoàn tác.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────
// ─── TAB 6: VOUCHERS (CRUD) ───────────────────────────────────
const EMPTY_VOUCHER = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minPurchase: 0,
  maxDiscount: 0,
  startDate: new Date().toISOString().split('T')[0],
  expiryDate: '',
  usageLimit: 100,
  isActive: true
};

function VouchersTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_VOUCHER);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllVouchers();
      // Standard response parsing
      const voucherList = Array.isArray(res) ? res : (res?.data || res?.vouchers || []);
      setList(voucherList);
    } catch (e) {
      setError(e.message || 'Không thể tải voucher');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_VOUCHER); setSaveError(''); setShowForm(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({
      ...v,
      startDate: v.startDate ? new Date(v.startDate).toISOString().split('T')[0] : '',
      expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString().split('T')[0] : ''
    });
    setSaveError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      if (editing) await updateVoucher(editing._id, form);
      else await createVoucher(form);
      setShowForm(false);
      await load();
    } catch (e) {
      setSaveError(e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVoucher(deleteTarget._id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      alert(e.message || 'Xóa thất bại');
    }
  };

  const filtered = list.filter((v) => !search || (v.code || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="tab-content">
      <div className="tab-header">
        <div>
          <h2 className="tab-title">Quản lý Voucher</h2>
          <p className="tab-subtitle">Tạo mã khuyến mãi và ưu đãi cho khách hàng</p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">Thêm Voucher</button>
      </div>

      <div className="filter-bar">
        <input className="search-input" onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã voucher..." type="text" value={search} />
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Giảm giá</th>
                <th>Điều kiện</th>
                <th>Thời hạn</th>
                <th>Đã dùng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td className="empty-cell" colSpan={7}>Chưa có voucher nào</td></tr>
              ) : filtered.map((v) => (
                <tr key={v._id}>
                  <td><strong>{v.code}</strong></td>
                  <td>
                    {v.discountType === 'percentage' ? `${v.discountValue}%` : formatCurrency(v.discountValue)}
                  </td>
                  <td>
                    Min: {formatCurrency(v.minPurchase)}
                  </td>
                  <td>
                    {new Date(v.expiryDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td>{v.usageCount} / {v.usageLimit}</td>
                  <td>
                    <span className={`badge ${v.isActive ? 'badge-success' : 'badge-error'}`}>
                      {v.isActive ? 'Bật' : 'Tắt'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-sm btn-outline" onClick={() => openEdit(v)} type="button">Sửa</button>
                      <button className="btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(v)} type="button">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box modal-lg">
            <h3 className="modal-title">{editing ? 'Chỉnh sửa Voucher' : 'Thêm Voucher mới'}</h3>
            <form className="cms-form" onSubmit={handleSave}>
              <div className="form-box-grid">
                <label className="form-field">
                  <span>Mã Voucher *</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SALE50" required type="text" value={form.code} />
                </label>
                <label className="form-field">
                  <span>Loại giảm giá</span>
                  <select onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} value={form.discountType}>
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </label>
                <label className="form-field">
                  <span>Giá trị giảm *</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="10" required type="number" value={form.discountValue} />
                </label>
                <label className="form-field">
                  <span>Giá trị đơn hàng tối thiểu (đ)</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, minPurchase: e.target.value }))} placeholder="0" type="number" value={form.minPurchase} />
                </label>
                <label className="form-field">
                  <span>Giảm tối đa (đ)</span>
                  <input min="0" onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="0" type="number" value={form.maxDiscount} />
                </label>
                <label className="form-field">
                  <span>Giới hạn lượt dùng</span>
                  <input min="1" onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="100" type="number" value={form.usageLimit} />
                </label>
                <label className="form-field">
                  <span>Ngày bắt đầu</span>
                  <input onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} type="date" value={form.startDate} />
                </label>
                <label className="form-field">
                  <span>Ngày hết hạn *</span>
                  <input required onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} type="date" value={form.expiryDate} />
                </label>
                <label className="form-field span-2">
                  <span>Mô tả</span>
                  <textarea onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Mô tả ưu đãi..." rows={2} value={form.description} />
                </label>
                <label className="checkbox-field">
                  <input checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} type="checkbox" />
                  <span>Kích hoạt voucher này</span>
                </label>
              </div>
              {saveError && <p className="form-error">{saveError}</p>}
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowForm(false)} type="button">Hủy</button>
                <button className="btn-primary" disabled={saving} type="submit">{saving ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Xóa voucher "${deleteTarget.code}"? Thao tác này không thể hoàn tác.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </section>
  );
}

const TABS = [
  { key: 'analytics', label: 'Dashboard', icon: 'dashboard' },
  { key: 'appointments', label: 'Lịch hẹn', icon: 'calendar_month' },
  { key: 'products', label: 'Dịch vụ', icon: 'content_cut' },
  { key: 'categories', label: 'Danh mục', icon: 'category' },
  { key: 'inventory', label: 'Kho hàng', icon: 'inventory_2' },
  { key: 'staff', label: 'Nhân sự', icon: 'badge' },
  { key: 'vouchers', label: 'Voucher', icon: 'confirmation_number' },
];

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };


  return (
    <div className="admin-cms">
      {/* Mobile Bar */}
      <header className="cms-mobile-bar">
        <button className="cms-hamburger" onClick={() => setSidebarOpen(true)} type="button">
          <span /><span /><span />
        </button>
        <span className="cms-mobile-title">Artisan Ledger Admin</span>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="cms-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`cms-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="cms-brand">
          <div className="cms-brand-mark">AL</div>
          <div>
            <span className="cms-brand-name">Artisan Ledger</span>
            <span className="cms-brand-sub">THE ARTISTIC LOUNGE</span>
          </div>
        </div>

        <nav className="cms-nav">
          {TABS.map((tab) => (
            <button
              className={`cms-nav-item${activeTab === tab.key ? ' active' : ''}`}
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSidebarOpen(false); }}
              type="button"
            >
              <span className="material-symbols-outlined">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="cms-sidebar-footer">
          <div className="cms-user-info">
            <div className="cms-user-avatar">{(user.name || 'A')[0].toUpperCase()}</div>
            <div>
              <p className="cms-user-name">{user.name || 'Admin'}</p>
              <p className="cms-user-role">PREMIUM MANAGEMENT</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} type="button">Đăng xuất</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="cms-main">
        <header className="cms-header">
          <div className="cms-brand-info">
            <h1>Quản trị hệ thống</h1>
            <div className="cms-user-pill">
              <span className="avatar">{(user.name || 'A')[0].toUpperCase()}</span>
              <span className="name">{user.name || 'Admin'}</span>
            </div>
          </div>

          <nav className="cms-tab-nav">
            {TABS.map((tab) => (
              <button
                className={`cms-tab-item${activeTab === tab.key ? ' active' : ''}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <section className="cms-content-shell">
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'staff' && <StaffTab />}
          {activeTab === 'vouchers' && <VouchersTab />}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboardPage;
