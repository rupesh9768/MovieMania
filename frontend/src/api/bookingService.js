// Booking API Service
import api from './axios';

/**
 * Create a new booking
 * POST /api/bookings
 * @param {Object} bookingData - { movieId, showtimeId, movieTitle, hall, date, time, seats, totalPrice, paymentMethod }
 * @returns {Promise} - Created booking
 */
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to create booking');
};

/**
 * Reserve seats for 5 minutes
 * POST /api/bookings/reserve
 * @param {Object} bookingData
 * @returns {Promise} - Reserved booking
 */
export const reserveBooking = async (bookingData) => {
  const response = await api.post('/bookings/reserve', bookingData);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to reserve seats');
};

/**
 * Confirm reserved booking
 * PATCH /api/bookings/:id/confirm
 * @param {string} bookingId
 * @param {Object} data
 * @returns {Promise}
 */
export const confirmBooking = async (bookingId, data = {}) => {
  const response = await api.patch(`/bookings/${bookingId}/confirm`, data);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to confirm booking');
};

/**
 * Get booked seats for a specific movie showtime
 * GET /api/bookings/seats?movieId=xxx&showtimeId=yyy
 * @param {string} movieId
 * @param {string} showtimeId
 * @returns {Promise<string[]>} - Array of booked seat IDs (e.g. ['A3', 'B5'])
 */
export const getBookedSeats = async (movieId, showtimeId) => {
  const response = await api.get('/bookings/seats', {
    params: { movieId, showtimeId }
  });
  if (response.data?.success) {
    return {
      allSeats: response.data.data || [],
      bookedSeats: response.data.bookedSeats || [],
      reservedSeats: response.data.reservedSeats || []
    };
  }
  return { allSeats: [], bookedSeats: [], reservedSeats: [] };
};

/**
 * Get current user's bookings
 * GET /api/bookings/my
 * @returns {Promise} - Array of user bookings
 */
export const getMyBookings = async () => {
  const response = await api.get('/bookings/my');
  if (response.data?.success) return response.data.data;
  return [];
};

/**
 * Get bookings by user ID
 * GET /api/bookings/user/:userId
 * @param {string} userId
 * @returns {Promise}
 */
export const getBookingsByUserId = async (userId) => {
  const response = await api.get(`/bookings/user/${userId}`);
  if (response.data?.success) return response.data.data;
  return [];
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Booking details
 */
export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  if (response.data?.success) return response.data.data;
  return null;
};

/**
 * Cancel a booking
 * PATCH /api/bookings/:id/cancel
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Cancellation result
 */
export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/bookings/${bookingId}`);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to cancel booking');
};

/**
 * Initiate Khalti Payment
 * POST /api/payments/khalti/initiate
 * @param {string} bookingId
 * @returns {Promise} - { pidx, payment_url }
 */
export const initiateKhaltiPayment = async (bookingId) => {
  const response = await api.post('/payments/khalti/initiate', { bookingId });
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to initiate payment');
};

/**
 * Verify Khalti Payment
 * POST /api/payments/khalti/verify
 * @param {string} pidx
 * @param {string} bookingId
 * @returns {Promise} - Confirmed booking
 */
export const verifyKhaltiPayment = async (pidx, bookingId) => {
  const response = await api.post('/payments/khalti/verify', { pidx, bookingId });
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to verify payment');
};

// Export all functions as default object
export default {
  createBooking,
  reserveBooking,
  confirmBooking,
  getBookedSeats,
  getMyBookings,
  getBookingsByUserId,
  getBookingById,
  cancelBooking,
  initiateKhaltiPayment,
  verifyKhaltiPayment
};
