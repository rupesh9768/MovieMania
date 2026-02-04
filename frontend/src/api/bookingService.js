// ====================================
// Booking API Service (Placeholder)
// ====================================
import api from './axios';

/**
 * Create a new booking
 * @param {Object} bookingData - Booking details
 * @returns {Promise} - Created booking
 */
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

/**
 * Get user's bookings
 * @returns {Promise} - Array of user bookings
 */
export const getUserBookings = async () => {
  const response = await api.get('/bookings/my-bookings');
  return response.data;
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Booking details
 */
export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} - Cancellation result
 */
export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Get available showtimes for a movie
 * @param {string} movieId - Movie ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {Promise} - Available showtimes
 */
export const getShowtimes = async (movieId, date) => {
  const response = await api.get('/bookings/showtimes', {
    params: { movieId, date }
  });
  return response.data;
};

/**
 * Get available seats for a showtime
 * @param {string} showtimeId - Showtime ID
 * @returns {Promise} - Seat availability
 */
export const getAvailableSeats = async (showtimeId) => {
  const response = await api.get(`/bookings/showtimes/${showtimeId}/seats`);
  return response.data;
};

// Export all functions as default object
export default {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getShowtimes,
  getAvailableSeats
};
