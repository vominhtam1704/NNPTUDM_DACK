// ============================================
// RESERVATIONCONTROLLER.JS - APPOINTMENT BOOKING
// ============================================
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const { formatSuccess, formatError, formatPaginated } = require('../utils/response');
const { APPOINTMENT_STATUS } = require('../config/constants');

/**
 * Get All Reservations - GET /reservations
 * Admin only - list all reservations with filters
 * Supports search by customer name, barber name, service name
 */
exports.getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, barberId, customerId, customerName, barberName, serviceName, status, dateFrom, dateTo } = req.query;
    const skip = (page - 1) * limit;

    // ===== BUILD FILTER =====
    const filter = {};
    if (barberId) filter.barberId = barberId;
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    
    // ===== SET DATE RANGE (default to today onwards if not specified) =====
    if (dateFrom || dateTo) {
      filter.appointmentDate = {};
      if (dateFrom) filter.appointmentDate.$gte = new Date(dateFrom);
      if (dateTo) filter.appointmentDate.$lte = new Date(dateTo);
    } else {
      // Default: today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.appointmentDate = { $gte: today };
    }

    // ===== HANDLE NAME SEARCH (customerName, barberName, serviceName) =====
    // For name searches, we need to use aggregation pipeline for case-insensitive regex matching
    if (customerName || barberName || serviceName) {
      // ===== USE AGGREGATION FOR TEXT SEARCH =====
      const pipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerData'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'barberId',
            foreignField: '_id',
            as: 'barberData'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'serviceData'
          }
        },
        {
          $addFields: {
            customerName: { $arrayElemAt: ['$customerData.name', 0] },
            barberName: { $arrayElemAt: ['$barberData.name', 0] },
            serviceName: { $arrayElemAt: ['$serviceData.name', 0] }
          }
        },
        {
          $match: {
            ...(filter),
            ...(customerName && { customerName: { $regex: customerName, $options: 'i' } }),
            ...(barberName && { barberName: { $regex: barberName, $options: 'i' } }),
            ...(serviceName && { serviceName: { $regex: serviceName, $options: 'i' } })
          }
        },
        { $sort: { appointmentDate: 1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];

      const reservations = await Reservation.aggregate(pipeline);
      
      // Get total count with same filter
      const countPipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customerData'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'barberId',
            foreignField: '_id',
            as: 'barberData'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'serviceId',
            foreignField: '_id',
            as: 'serviceData'
          }
        },
        {
          $addFields: {
            customerName: { $arrayElemAt: ['$customerData.name', 0] },
            barberName: { $arrayElemAt: ['$barberData.name', 0] },
            serviceName: { $arrayElemAt: ['$serviceData.name', 0] }
          }
        },
        {
          $match: {
            ...(filter),
            ...(customerName && { customerName: { $regex: customerName, $options: 'i' } }),
            ...(barberName && { barberName: { $regex: barberName, $options: 'i' } }),
            ...(serviceName && { serviceName: { $regex: serviceName, $options: 'i' } })
          }
        },
        { $count: 'total' }
      ];

      const countResult = await Reservation.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      // Now populate the full details for each result
      const populatedReservations = await Promise.all(
        reservations.map(r => 
          Reservation.findById(r._id)
            .populate('barberId', 'name email phone avatar')
            .populate('customerId', 'name email phone avatar')
            .populate('serviceId', 'name price duration')
            .populate('paymentId')
        )
      );

      return res.status(200).json(
        formatPaginated(populatedReservations, page, limit, total)
      );
    }

    // ===== DEFAULT FETCH (no name search) =====
    const reservations = await Reservation.find(filter)
      .populate('barberId', 'name email phone avatar')
      .populate('customerId', 'name email phone avatar')
      .populate('serviceId', 'name price duration')
      .populate('paymentId')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const total = await Reservation.countDocuments(filter);

    res.status(200).json(
      formatPaginated(reservations, page, limit, total)
    );
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json(
      formatError('Failed to fetch reservations: ' + error.message)
    );
  }
};

/**
 * Get Reservation by ID - GET /reservations/:id
 * Get single reservation details
 */
exports.getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('barberId', 'name email phone avatar')
      .populate('customerId', 'name email phone avatar')
      .populate('serviceId', 'name price duration')
      .populate('paymentId');

    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    res.status(200).json(
      formatSuccess(reservation, 'Reservation retrieved successfully')
    );
  } catch (error) {
    console.error('Get reservation by ID error:', error);
    res.status(500).json(
      formatError('Failed to fetch reservation: ' + error.message)
    );
  }
};

/**
 * Create Reservation - POST /reservations
 * Customer books appointment - CHECK DOUBLE BOOKING
 * Supports both single service (serviceId) and multiple services (serviceIds array)
 */
exports.createReservation = async (req, res) => {
  try {
    const { barberId, serviceId, serviceIds, appointmentDate, appointmentTime, notes, totalPrice } = req.body;
    const customerId = req.user.userId; // From JWT token

    // ===== VALIDATION =====
    const hasMultipleServices = serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0;
    const hasSingleService = serviceId;

    if (!barberId || !appointmentDate || !appointmentTime || (!hasSingleService && !hasMultipleServices)) {
      return res.status(400).json(
        formatError('Missing required fields: barberId, appointmentDate, appointmentTime, and either serviceId or serviceIds')
      );
    }

    // Use serviceIds if provided, otherwise use single serviceId
    const serviceIdsToUse = hasMultipleServices ? serviceIds : [serviceId];

    // Validate barber exists
    const barber = await User.findById(barberId);
    if (!barber || barber.role !== 'barber') {
      return res.status(404).json(
        formatError('Barber not found')
      );
    }

    // Validate all services exist and calculate total price
    let calculatedTotalPrice = 0;
    const services = [];

    for (const sid of serviceIdsToUse) {
      const service = await Product.findById(sid);
      if (!service) {
        return res.status(404).json(
          formatError(`Service ${sid} not found`)
        );
      }
      services.push(service);
      calculatedTotalPrice += service.price;
    }

    // Override with provided totalPrice if service count > 1 (for discounts) or use calculated
    const finalTotalPrice = hasMultipleServices && totalPrice ? totalPrice : calculatedTotalPrice;

    // ===== CHECK DOUBLE BOOKING (CRITICAL) =====
    // Make sure no other reservation exists for this barber at this time
    const appointmentDateTime = new Date(appointmentDate);
    const existingReservation = await Reservation.findOne({
      barberId,
      appointmentDate: {
        $gte: new Date(appointmentDate).setHours(0, 0, 0, 0),
        $lt: new Date(appointmentDate).setHours(23, 59, 59, 999)
      },
      appointmentTime,
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
    });

    if (existingReservation) {
      return res.status(409).json(
        formatError('Time slot already booked - please select another time')
      );
    }

    // ===== CREATE RESERVATION =====
    // For single service use serviceId, for multiple include in notes
    const newReservation = new Reservation({
      barberId,
      customerId,
      serviceId: serviceIdsToUse[0], // Always store first service as primary
      appointmentDate: appointmentDateTime,
      appointmentTime,
      totalPrice: finalTotalPrice,
      notes: notes || '',
      status: APPOINTMENT_STATUS.PENDING
    });

    await newReservation.save();
    await newReservation.populate([
      { path: 'barberId', select: 'name email phone avatar' },
      { path: 'customerId', select: 'name email phone avatar' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    // ===== CREATE NOTIFICATION FOR BARBER =====
    await Message.create({
      sender: customerId,
      receiver: barberId,
      content: `${newReservation.customerId.name} booked appointment for ${appointmentDate}`,
      type: 'notification'
    });

    // ===== CREATE NOTIFICATION FOR CUSTOMER (DUAL NOTIFY) =====
    await Message.create({
      sender: barberId,
      receiver: customerId,
      content: `Your appointment with ${newReservation.barberId.name} on ${appointmentDate} has been booked!`,
      type: 'notification'
    });

    res.status(201).json(
      formatSuccess(newReservation, 'Reservation created successfully')
    );
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json(
      formatError('Failed to create reservation: ' + error.message)
    );
  }
};

/**
 * Update Reservation - PUT /reservations/:id
 * Update reservation details (time, service, notes)
 */
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { appointmentDate, appointmentTime, serviceId, notes } = req.body;

    // ===== FIND RESERVATION =====
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    // ===== VALIDATION - Cannot edit confirmed/done/cancelled appointments =====
    if (![APPOINTMENT_STATUS.PENDING].includes(reservation.status)) {
      return res.status(400).json(
        formatError(`Cannot edit ${reservation.status} reservation`)
      );
    }

    // ===== CHECK DOUBLE BOOKING (if changing time) =====
    if (appointmentDate || appointmentTime) {
      const newDate = appointmentDate ? new Date(appointmentDate) : reservation.appointmentDate;
      const newTime = appointmentTime || reservation.appointmentTime;

      const conflictReservation = await Reservation.findOne({
        _id: { $ne: id },
        barberId: reservation.barberId,
        appointmentDate: {
          $gte: new Date(newDate).setHours(0, 0, 0, 0),
          $lt: new Date(newDate).setHours(23, 59, 59, 999)
        },
        appointmentTime: newTime,
        status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
      });

      if (conflictReservation) {
        return res.status(409).json(
          formatError('Time slot already booked - please select another time')
        );
      }
    }

    // ===== BUILD UPDATE OBJECT =====
    const updateData = {};
    if (appointmentDate) updateData.appointmentDate = new Date(appointmentDate);
    if (appointmentTime) updateData.appointmentTime = appointmentTime;
    if (notes !== undefined) updateData.notes = notes;
    if (serviceId) {
      const service = await Product.findById(serviceId);
      if (!service) {
        return res.status(404).json(
          formatError('Service not found')
        );
      }
      updateData.serviceId = serviceId;
      updateData.totalPrice = service.price;
    }

    // ===== UPDATE RESERVATION =====
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'barberId', select: 'name email phone avatar' },
      { path: 'customerId', select: 'name email phone avatar' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    res.status(200).json(
      formatSuccess(updatedReservation, 'Reservation updated successfully')
    );
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json(
      formatError('Failed to update reservation: ' + error.message)
    );
  }
};

/**
 * Cancel Reservation - PUT /reservations/:id/cancel
 * Cancel pending/confirmed reservation
 */
exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    // Cannot cancel already done/cancelled
    if (![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(reservation.status)) {
      return res.status(400).json(
        formatError(`Cannot cancel ${reservation.status} reservation`)
      );
    }

    reservation.status = APPOINTMENT_STATUS.CANCELLED;
    await reservation.save();

    res.status(200).json(
      formatSuccess(reservation, 'Reservation cancelled successfully')
    );
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json(
      formatError('Failed to cancel reservation: ' + error.message)
    );
  }
};

/**
 * Confirm Reservation - PUT /reservations/:id/confirm
 * Admin/Barber confirms appointment (after payment)
 */
exports.confirmReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    // Can only confirm if pending
    if (reservation.status !== APPOINTMENT_STATUS.PENDING) {
      return res.status(400).json(
        formatError(`Can only confirm pending reservations`)
      );
    }

    reservation.status = APPOINTMENT_STATUS.CONFIRMED;
    await reservation.save();
    await reservation.populate([
      { path: 'barberId', select: 'name email phone avatar' },
      { path: 'customerId', select: 'name email phone avatar' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    // ===== SEND NOTIFICATION =====
    await Message.create({
      sender: reservation.barberId,
      receiver: reservation.customerId,
      subject: 'Appointment confirmed',
      content: `Your appointment on ${reservation.appointmentDate} has been confirmed`,
      type: 'notification'
    });

    res.status(200).json(
      formatSuccess(reservation, 'Reservation confirmed successfully')
    );
  } catch (error) {
    console.error('Confirm reservation error:', error);
    res.status(500).json(
      formatError('Failed to confirm reservation: ' + error.message)
    );
  }
};

/**
 * Complete Reservation - PUT /reservations/:id/complete
 * Barber marks appointment as completed (done)
 */
exports.completeReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json(
        formatError('Reservation not found')
      );
    }

    // Can only complete if confirmed or pending
    if (![APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED].includes(reservation.status)) {
      return res.status(400).json(
        formatError(`Cannot complete ${reservation.status} reservation`)
      );
    }

    reservation.status = APPOINTMENT_STATUS.DONE;
    await reservation.save();

    await reservation.populate([
      { path: 'barberId', select: 'name email phone avatar' },
      { path: 'customerId', select: 'name email phone avatar' },
      { path: 'serviceId', select: 'name price duration' }
    ]);

    // ===== SEND NOTIFICATION =====
    await Message.create({
      sender: reservation.barberId,
      receiver: reservation.customerId,
      subject: 'Appointment completed',
      content: `Your appointment on ${reservation.appointmentDate} has been completed. Thank you!`,
      type: 'notification'
    });

    res.status(200).json(
      formatSuccess(reservation, 'Reservation completed successfully')
    );
  } catch (error) {
    console.error('Complete reservation error:', error);
    res.status(500).json(
      formatError('Failed to complete reservation: ' + error.message)
    );
  }
};

/**
 * Get Available Time Slots - GET /reservations/available-slots/:barberId
 * Get available time slots for a specific barber on a specific date
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { barberId, date } = req.query;

    if (!barberId || !date) {
      return res.status(400).json(
        formatError('barberId and date are required')
      );
    }

    // ===== BUSINESS HOURS = 9AM TO 6PM (9-18) =====
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];

    // ===== GET BOOKED SLOTS =====
    const bookedReservations = await Reservation.find({
      barberId,
      appointmentDate: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      },
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
    }).select('appointmentTime');

    const bookedTimes = bookedReservations.map(r => r.appointmentTime);

    // ===== FILTER AVAILABLE SLOTS =====
    const availableSlots = timeSlots.filter(slot => !bookedTimes.includes(slot));

    res.status(200).json(
      formatSuccess(
        { date, availableSlots, bookedTimes },
        'Available slots retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json(
      formatError('Failed to fetch available slots: ' + error.message)
    );
  }
};

/**
 * Get My Reservations - GET /reservations/my-bookings
 * Customer or Barber views their own reservations
 * - Customer sees bookings where they are customerId
 * - Barber sees bookings where they are barberId
 */
exports.getMyReservations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Fetch user to determine role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(
        formatError('User not found')
      );
    }

    const filter = {};
    // If barber, filter by barberId; if customer, filter by customerId
    if (user.role === 'barber') {
      filter.barberId = userId;
    } else {
      filter.customerId = userId;
    }

    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate('barberId', 'name email phone avatar')
      .populate('customerId', 'name email phone avatar')
      .populate('serviceId', 'name price duration')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ appointmentDate: -1 });

    const total = await Reservation.countDocuments(filter);

    res.status(200).json(
      formatPaginated(reservations, page, limit, total)
    );
  } catch (error) {
    console.error('Get my reservations error:', error);
    res.status(500).json(
      formatError('Failed to fetch reservations: ' + error.message)
    );
  }
};
