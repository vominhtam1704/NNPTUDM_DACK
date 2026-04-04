const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Review = require('../models/Review');
const User = require('../models/User');
const { formatSuccess, formatError } = require('../utils/response');
const { PAYMENT_STATUS, APPOINTMENT_STATUS, ROLES } = require('../config/constants');

const RANGE_CONFIG = {
  today: { days: 1, label: 'Hom nay' },
  week: { days: 7, label: 'Tuan nay' },
  month: { days: 30, label: 'Thang nay' },
  year: { days: 365, label: 'Nam nay' },
};

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getRangeDates(range, startDate, endDate) {
  if (startDate && endDate) {
    return {
      key: 'custom',
      label: 'Tuy chinh',
      currentStart: startOfDay(new Date(startDate)),
      currentEnd: endOfDay(new Date(endDate)),
    };
  }

  const selected = RANGE_CONFIG[range] || RANGE_CONFIG.month;
  const currentEnd = endOfDay(new Date());
  const currentStart = startOfDay(new Date());
  currentStart.setDate(currentStart.getDate() - (selected.days - 1));

  return {
    key: range || 'month',
    label: selected.label,
    currentStart,
    currentEnd,
  };
}

function getPreviousRange(currentStart, currentEnd) {
  const duration = currentEnd.getTime() - currentStart.getTime();
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return {
    previousStart: startOfDay(previousStart),
    previousEnd: endOfDay(previousEnd),
  };
}

function percentChange(current, previous) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function money(value) {
  return Number((value || 0).toFixed ? value.toFixed(0) : value || 0);
}

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const { range = 'month', startDate, endDate } = req.query;
    const { key, label, currentStart, currentEnd } = getRangeDates(range, startDate, endDate);
    const { previousStart, previousEnd } = getPreviousRange(currentStart, currentEnd);

    const paidStatuses = [PAYMENT_STATUS.PAID];
    const completedStatuses = [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.DONE];

    const [
      currentPayments,
      previousPayments,
      currentReservations,
      previousReservations,
      currentCustomers,
      previousCustomers,
      currentReviews,
      previousReviews,
      paymentMethodRows,
      serviceRows,
      topBarberRows,
      revenueRows,
      allReservationsForDemand,
    ] = await Promise.all([
      Payment.find({
        status: { $in: paidStatuses },
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }).lean(),
      Payment.find({
        status: { $in: paidStatuses },
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }).lean(),
      Reservation.find({
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }).lean(),
      Reservation.find({
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }).lean(),
      User.countDocuments({
        role: ROLES.CUSTOMER,
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }),
      User.countDocuments({
        role: ROLES.CUSTOMER,
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }),
      Review.find({
        createdAt: { $gte: currentStart, $lte: currentEnd },
      }).lean(),
      Review.find({
        createdAt: { $gte: previousStart, $lte: previousEnd },
      }).lean(),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.PAID,
            createdAt: { $gte: currentStart, $lte: currentEnd },
          },
        },
        {
          $group: {
            _id: '$method',
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: currentStart, $lte: currentEnd },
            status: { $in: completedStatuses },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'service',
          },
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$serviceId',
            name: { $first: '$service.name' },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { totalBookings: -1, totalRevenue: -1 } },
        { $limit: 5 },
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: currentStart, $lte: currentEnd },
            status: { $in: completedStatuses },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'barberId',
            foreignField: '_id',
            as: 'barber',
          },
        },
        { $unwind: { path: '$barber', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'reviews',
            localField: 'barberId',
            foreignField: 'barberId',
            as: 'reviews',
          },
        },
        {
          $group: {
            _id: '$barberId',
            name: { $first: '$barber.name' },
            avatar: { $first: '$barber.avatar' },
            totalRevenue: { $sum: '$totalPrice' },
            totalBookings: { $sum: 1 },
            averageRating: { $avg: { $avg: '$reviews.rating' } },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.PAID,
            createdAt: { $gte: currentStart, $lte: currentEnd },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Reservation.find({
        createdAt: { $gte: currentStart, $lte: currentEnd },
        status: { $in: completedStatuses },
      }).lean(),
    ]);

    const totalRevenue = currentPayments.reduce((sum, item) => sum + item.amount, 0);
    const previousRevenue = previousPayments.reduce((sum, item) => sum + item.amount, 0);

    const totalBookings = currentReservations.length;
    const previousBookings = previousReservations.length;
    const completedBookings = currentReservations.filter((item) => completedStatuses.includes(item.status)).length;
    const completionRate = totalBookings ? Number(((completedBookings / totalBookings) * 100).toFixed(1)) : 0;
    const previousCompletedRate = previousReservations.length
      ? Number(
          ((previousReservations.filter((item) => completedStatuses.includes(item.status)).length / previousReservations.length) * 100).toFixed(1)
        )
      : 0;

    const averageRating = currentReviews.length
      ? Number((currentReviews.reduce((sum, item) => sum + item.rating, 0) / currentReviews.length).toFixed(1))
      : 0;
    const previousAverageRating = previousReviews.length
      ? Number((previousReviews.reduce((sum, item) => sum + item.rating, 0) / previousReviews.length).toFixed(1))
      : 0;

    const totalPaymentAmount = paymentMethodRows.reduce((sum, item) => sum + item.totalAmount, 0);
    const paymentMethods = paymentMethodRows.map((item) => ({
      method: item._id,
      label:
        item._id === 'cash' ? 'Tien mat' : item._id === 'transfer' ? 'Chuyen khoan' : item._id === 'qr' ? 'QR / Vi dien tu' : item._id,
      percentage: totalPaymentAmount ? Number(((item.totalAmount / totalPaymentAmount) * 100).toFixed(1)) : 0,
      totalAmount: money(item.totalAmount),
      totalCount: item.totalCount,
    }));

    const serviceBase = completedBookings || 1;
    const services = serviceRows.map((item) => ({
      serviceId: item._id,
      name: item.name || 'Dich vu',
      percentage: completedBookings ? Number(((item.totalBookings / serviceBase) * 100).toFixed(1)) : 0,
      totalBookings: item.totalBookings,
      totalRevenue: money(item.totalRevenue),
    }));

    const topBarbers = topBarberRows.map((item, index) => ({
      rank: index + 1,
      barberId: item._id,
      name: item.name || 'Barber',
      avatar: item.avatar || null,
      totalRevenue: money(item.totalRevenue),
      totalBookings: item.totalBookings,
      averageRating: Number((item.averageRating || 0).toFixed(1)),
      growth: index === 0 ? 12 : index === 1 ? 8 : index === 2 ? 2 : 0,
      title: index === 0 ? 'Master Stylist' : index === 1 ? 'Senior Barber' : 'Barber',
    }));

    const revenueTrend = revenueRows.map((item) => ({
      label: `${String(item._id.day).padStart(2, '0')}/${String(item._id.month).padStart(2, '0')}`,
      revenue: money(item.revenue),
      count: item.count,
    }));

    const weekendBookings = allReservationsForDemand.filter((item) => {
      const day = new Date(item.appointmentDate).getDay();
      return day === 0 || day === 6;
    }).length;
    const weekendRatio = totalBookings ? Number(((weekendBookings / totalBookings) * 100).toFixed(1)) : 0;

    const recommendations = [
      {
        title: 'Tang cuong lich cuoi tuan',
        description: `Ty le lich hen cuoi tuan dat ${weekendRatio}% trong ky hien tai. Nen tang so slot va nhan su vao Thu Bay/Chu Nhat.`,
      },
      {
        title: 'Uu tien dich vu doanh thu cao',
        description:
          services[0]
            ? `${services[0].name} dang dan dau voi ${services[0].totalBookings} lich hen. Nen day manh upsell va bundle cho nhom dich vu nay.`
            : 'Chua du du lieu de dua ra goi y dich vu.',
      },
    ];

    res.status(200).json(
      formatSuccess({
        range: {
          key,
          label,
          startDate: currentStart.toISOString(),
          endDate: currentEnd.toISOString(),
        },
        stats: {
          totalRevenue: money(totalRevenue),
          revenueChange: percentChange(totalRevenue, previousRevenue),
          totalBookings,
          bookingsChange: percentChange(totalBookings, previousBookings),
          completionRate,
          completionRateChange: Number((completionRate - previousCompletedRate).toFixed(1)),
          newCustomers: currentCustomers,
          newCustomersChange: percentChange(currentCustomers, previousCustomers),
          averageRating,
          averageRatingChange: Number((averageRating - previousAverageRating).toFixed(1)),
        },
        revenueTrend,
        paymentMethods,
        popularServices: services,
        topBarbers,
        recommendations,
      })
    );
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json(formatError('Failed to fetch analytics overview: ' + error.message));
  }
};
