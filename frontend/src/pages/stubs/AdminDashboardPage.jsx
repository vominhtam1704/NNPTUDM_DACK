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
      setData(res);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllReservations();
      setList(Array.isArray(res) ? res : (res?.reservations || []));
    } catch (e) {
      setError(e.message || 'Không thể tải lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (r.customer?.name || '').toLowerCase().includes(q) ||
        (r.barber?.name || '').toLowerCase().includes(q) ||
        (r.service?.name || '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [list, statusFilter, search]);

  const handleAction = async (action, id) => {
    setActionLoading(`${action}-${id}`);
    try {
      if (action === 'confirm') await confirmReservation(id);
      else if (action === 'cancel') await cancelReservation(id);
      else if (action === 'complete') await updateReservation(id, { status: 'completed' });
      await load();
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
        r.customer?.name || '',
        r.barber?.name || '',
        r.service?.name || '',
        r.appointmentDate || '',
        r.appointmentTime || '',
        STATUS_LABEL[r.status] || r.status,
      ]),
    ]);
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
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && (
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
                  <td>{r.customer?.name || '—'}</td>
                  <td>{r.barber?.name || '—'}</td>
                  <td>{r.service?.name || '—'}</td>
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
    try {
      const [pRes, cRes] = await Promise.all([getProducts(), getCategories()]);
      setList(Array.isArray(pRes) ? pRes : (pRes?.products || []));
      setCats(Array.isArray(cRes) ? cRes : (cRes?.categories || []));
    } catch (e) {
      setError(e.message || 'Không thể tải dịch vụ');
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
              {p.image && <img alt={p.name} className="product-img" src={p.image} />}
              {!p.image && <div className="product-img-placeholder">{(p.name || 'S')[0].toUpperCase()}</div>}
              <div className="product-body">
                <p className="product-cat">{p.category?.name || '—'}</p>
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
                  <select onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value })) } value={form.categoryId}>
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
      setList(Array.isArray(res) ? res : (res?.categories || []));
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
      setList(Array.isArray(res) ? res : (res?.items || res?.inventories || []));
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
      setUsers(Array.isArray(uRes) ? uRes : (uRes?.users || []));
      setRoles(Array.isArray(rRes) ? rRes : (rRes?.roles || []));
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
const TABS = [
  { key: 'analytics', label: 'Dashboard' },
  { key: 'appointments', label: 'Lịch hẹn' },
  { key: 'products', label: 'Dịch vụ' },
  { key: 'categories', label: 'Danh mục' },
  { key: 'inventory', label: 'Kho hàng' },
  { key: 'staff', label: 'Nhân sự' },
];

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [menuOpen, setMenuOpen] = useState(false);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="admin-cms">
      {/* Sidebar */}
      <aside className={`cms-sidebar${menuOpen ? ' open' : ''}`}>
        <div className="cms-brand">
          <div className="cms-brand-mark">BA</div>
          <div>
            <span className="cms-brand-name">Barber Atelier</span>
            <span className="cms-brand-sub">Admin CMS</span>
          </div>
        </div>

        <nav className="cms-nav">
          {TABS.map((tab) => (
            <button
              className={`cms-nav-item${activeTab === tab.key ? ' active' : ''}`}
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setMenuOpen(false); }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="cms-sidebar-footer">
          <div className="cms-user-info">
            <div className="cms-user-avatar">{(user.name || 'A')[0].toUpperCase()}</div>
            <div>
              <p className="cms-user-name">{user.name || 'Admin'}</p>
              <p className="cms-user-role">{user.role || 'admin'}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} type="button">Đăng xuất</button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="cms-mobile-bar">
        <button
          className="cms-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          type="button"
          aria-label="Menu"
        >
          <span /><span /><span />
        </button>
        <span className="cms-mobile-title">Barber Atelier Admin</span>
      </header>

      {/* Overlay */}
      {menuOpen && <div className="cms-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Main content */}
      <main className="cms-main">
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'appointments' && <AppointmentsTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'staff' && <StaffTab />}
      </main>
    </div>
  );
}

export default AdminDashboardPage;
