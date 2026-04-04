import React, { useEffect, useMemo, useState } from 'react';
import { getAnalyticsOverview } from '../../services/analytics';
import '../AdminDashboardPage.scss';

const fallbackAvatar =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4BJ-zxI97jwsQgM5_ASpKU-D-yBcDdbZ-bCbdJz_6rkwu0lUOb5kdG8r5w-LkOdVvfMSFBKUl67YYA2Ytv_3Rvs4UXd3kYhr3TxBKiR6CvVAx_J_jZ03bSPi8KbBC2i7vc3WjNmT010eDFesPL4L0xpemDzp4fbyeOtK0lZyN3KZ24UdOWslNZCOmbVO6oVb-Uk85Ynfs2p2Ajl7u9hn37ECa7aadwCOLrlJAm7myCvXlE2UL1WPwUyWkYheKlqNHmUI4vZAcUY';

const rangeOptions = [
  { key: 'today', label: 'Hom nay' },
  { key: 'week', label: 'Tuan nay' },
  { key: 'month', label: 'Thang nay' },
  { key: 'year', label: 'Nam nay' },
  { key: 'custom', label: 'Tuy chinh' },
];

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}d`;
const formatCompactCurrency = (value) => `${Math.round(Number(value || 0) / 1000000)}tr`;
const formatPercentDelta = (value) => `${value > 0 ? '+' : ''}${value}%`;

function downloadCsv(filename, rows) {
  const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function AdminDashboardPage() {
  const [range, setRange] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');

      try {
        const params =
          range === 'custom' && customStart && customEnd
            ? { startDate: customStart, endDate: customEnd }
            : { range };
        const response = await getAnalyticsOverview(params);
        if (active) {
          setData(response);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Khong the tai bao cao analytics');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    if (range !== 'custom' || (customStart && customEnd)) {
      loadAnalytics();
    }

    return () => {
      active = false;
    };
  }, [range, customStart, customEnd]);

  const statsCards = useMemo(() => {
    if (!data?.stats) return [];
    return [
      {
        label: 'Tong doanh thu',
        value: formatCurrency(data.stats.totalRevenue),
        delta: `${formatPercentDelta(data.stats.revenueChange)} so voi ky truoc`,
        icon: 'trending_up',
        tone: 'positive',
        className: '',
      },
      {
        label: 'Tong lich hen',
        value: data.stats.totalBookings,
        delta: `Ty le hoan thanh ${data.stats.completionRate}%`,
        icon: 'check_circle',
        tone: 'neutral',
        className: 'secondary',
      },
      {
        label: 'Khach hang moi',
        value: data.stats.newCustomers,
        delta: `Tang ${formatPercentDelta(data.stats.newCustomersChange)}`,
        icon: 'person_add',
        tone: 'neutral',
        className: 'tertiary',
      },
      {
        label: 'Danh gia trung binh',
        value: `${data.stats.averageRating}/5.0`,
        delta: `${data.stats.averageRatingChange > 0 ? 'Tang' : 'Bien dong'} ${data.stats.averageRatingChange}`,
        icon: 'star',
        tone: 'positive',
        className: 'quaternary',
      },
    ];
  }, [data]);

  const handleExportExcel = () => {
    if (!data) return;
    downloadCsv('analytics-report.csv', [
      ['Metric', 'Value'],
      ['Tong doanh thu', data.stats.totalRevenue],
      ['Tong lich hen', data.stats.totalBookings],
      ['Ty le hoan thanh', data.stats.completionRate],
      ['Khach hang moi', data.stats.newCustomers],
      ['Danh gia trung binh', data.stats.averageRating],
      [],
      ['Top Barber', 'Revenue', 'Bookings', 'Rating'],
      ...data.topBarbers.map((item) => [item.name, item.totalRevenue, item.totalBookings, item.averageRating]),
    ]);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const highlightIndex = data?.revenueTrend?.reduce(
    (bestIndex, item, index, arr) => (item.revenue > (arr[bestIndex]?.revenue || 0) ? index : bestIndex),
    0
  );

  return (
    <div className="analytics-page">
      <div className="analytics-shell">
        <aside className="analytics-sidebar">
          <div className="analytics-brand">
            <div className="analytics-brand-mark">
              <span className="material-symbols-outlined">content_cut</span>
            </div>
            <div className="analytics-brand-text">
              <h2>Atelier Admin</h2>
              <p>Editorial Efficiency</p>
            </div>
          </div>

          <div>
            <p className="analytics-nav-label">Analytics & Data</p>
            <nav className="analytics-nav">
              <a className="active" href="/#">
                <span className="material-symbols-outlined">payments</span>
                <span>Revenue Reports</span>
              </a>
              <a href="/#">
                <span className="material-symbols-outlined">trending_up</span>
                <span>Stylist Performance</span>
              </a>
              <a href="/#">
                <span className="material-symbols-outlined">insights</span>
                <span>Service Trends</span>
              </a>
              <a href="/#">
                <span className="material-symbols-outlined">group</span>
                <span>Client History</span>
              </a>
              <a href="/#">
                <span className="material-symbols-outlined">campaign</span>
                <span>Marketing</span>
              </a>
            </nav>
          </div>

          <div className="analytics-sidebar-footer">
            <button className="analytics-primary-btn" type="button">
              New Appointment
            </button>
            <a href="/#">
              <span className="material-symbols-outlined">help</span>
              <span>Help Center</span>
            </a>
            <a href="/#">
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </a>
          </div>
        </aside>

        <main className="analytics-main">
          <header className="analytics-topbar">
            <div className="analytics-topbar-left">
              <h1>Bao cao & Phan tich</h1>
              <nav className="analytics-topbar-links">
                <a href="/#">Dashboard</a>
                <a className="active" href="/#">
                  Analytics
                </a>
                <a href="/#">Schedule</a>
                <a href="/#">Inventory</a>
              </nav>
            </div>

            <div className="analytics-topbar-right">
              <label className="analytics-search">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Tim kiem..." type="text" />
              </label>
              <button className="analytics-topbar-icon" type="button">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="analytics-avatar">
                <img alt="Manager avatar" src={fallbackAvatar} />
              </div>
            </div>
          </header>

          <div className="analytics-content">
            <section className="analytics-filter-bar">
              <div className="analytics-range-tabs">
                {rangeOptions.map((item) => (
                  <button
                    className={range === item.key ? 'active' : ''}
                    key={item.key}
                    onClick={() => setRange(item.key)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {range === 'custom' ? (
                <div className="analytics-custom-range">
                  <label>
                    Tu ngay
                    <input onChange={(event) => setCustomStart(event.target.value)} type="date" value={customStart} />
                  </label>
                  <label>
                    Den ngay
                    <input onChange={(event) => setCustomEnd(event.target.value)} type="date" value={customEnd} />
                  </label>
                </div>
              ) : null}

              <div className="analytics-export-actions">
                <button className="analytics-export-secondary" onClick={handleExportPdf} type="button">
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  Xuat PDF
                </button>
                <button className="analytics-export-primary" onClick={handleExportExcel} type="button">
                  <span className="material-symbols-outlined">table_view</span>
                  Xuat Excel
                </button>
              </div>
            </section>

            {isLoading ? <div className="analytics-loading">Dang tai du lieu analytics...</div> : null}
            {!isLoading && error ? <div className="analytics-error">{error}</div> : null}

            {!isLoading && !error && data ? (
              <>
                <section className="analytics-stats-grid">
                  {statsCards.map((item) => (
                    <article className={`analytics-stat-card ${item.className}`.trim()} key={item.label}>
                      <p>{item.label}</p>
                      <h3>{item.value}</h3>
                      <div className={`analytics-trend-badge ${item.tone}`}>
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.delta}</span>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="analytics-grid-primary">
                  <article className="analytics-card surface-low">
                    <div className="analytics-card-header">
                      <div>
                        <h2>Xu huong doanh thu</h2>
                        <p>Du lieu doanh thu theo khoang thoi gian da chon</p>
                      </div>
                      <span className="material-symbols-outlined">insights</span>
                    </div>

                    {data.revenueTrend.length > 0 ? (
                      <>
                        <div className="analytics-chart">
                          {data.revenueTrend.map((item, index) => {
                            const maxRevenue = Math.max(...data.revenueTrend.map((entry) => entry.revenue), 1);
                            const height = Math.max((item.revenue / maxRevenue) * 100, 10);
                            return (
                              <div className="analytics-bar-wrap" key={item.label}>
                                <div
                                  className={`analytics-bar ${index === highlightIndex ? 'highlight' : ''}`.trim()}
                                  style={{ height: `${height}%` }}
                                >
                                  <span className="analytics-bar-label">{formatCompactCurrency(item.revenue)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="analytics-chart-footer">
                          {data.revenueTrend.map((item) => (
                            <span key={item.label}>{item.label}</span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="analytics-empty">Chua co du lieu doanh thu trong khoang nay.</div>
                    )}
                  </article>

                  <article className="analytics-card">
                    <h2>Phuong thuc thanh toan</h2>
                    <div className="analytics-payment-list">
                      {data.paymentMethods.map((item) => (
                        <div className="analytics-payment-item" key={item.method}>
                          <div className="analytics-payment-head">
                            <span>{item.label}</span>
                            <strong>{item.percentage}%</strong>
                          </div>
                          <div className="analytics-progress">
                            <div className="analytics-progress-fill" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="analytics-donut">
                      <div className="analytics-donut-ring">
                        <div className="analytics-donut-inner">100%</div>
                      </div>
                      <p>Tong luu luong</p>
                    </div>
                  </article>
                </section>

                <section className="analytics-grid-secondary">
                  <article className="analytics-card surface-low">
                    <h2>Dich vu pho bien</h2>
                    <div className="analytics-service-list">
                      {data.popularServices.map((item) => (
                        <div className="analytics-service-item" key={item.serviceId}>
                          <div className="analytics-service-head">
                            <span>{item.percentage}%</span>
                            <div>{item.name}</div>
                          </div>
                          <div className="analytics-progress">
                            <div className="analytics-progress-fill" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="analytics-card">
                    <h2>Hieu suat tho cat (Top Barbers)</h2>
                    <div className="analytics-barber-list">
                      {data.topBarbers.map((item) => (
                        <div className="analytics-barber-item" key={item.barberId}>
                          <div className="analytics-barber-head">
                            <div className="analytics-barber-profile">
                              <div className="analytics-barber-avatar">
                                <img alt={item.name} src={item.avatar || fallbackAvatar} />
                                <span className="analytics-barber-rank">{item.rank}</span>
                              </div>
                              <div className="analytics-barber-meta">
                                <h4>{item.name}</h4>
                                <p>{item.title}</p>
                              </div>
                            </div>
                            <div className="analytics-barber-value">
                              <strong>{formatCompactCurrency(item.totalRevenue)}</strong>
                              <span>{item.growth > 0 ? `+${item.growth}%` : '0%'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="analytics-banner">
                  <div className="analytics-banner-content">
                    <h2>Mo rong quy mo voi Phan tich chuyen sau</h2>
                    <p>{data.recommendations[0]?.description}</p>
                    <button type="button">{data.recommendations[1]?.title || 'Xem chi tiet goi y'}</button>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </main>

        <button className="analytics-mobile-fab" type="button">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
