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
  if (response.data?.success) return response.data.data;
  return [];
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
  const response = await api.patch(`/bookings/${bookingId}/cancel`);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to cancel booking');
};

// Export all functions as default object
export default {
  createBooking,
  getBookedSeats,
  getMyBookings,
  getBookingById,
  cancelBooking
};
