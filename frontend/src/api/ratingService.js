import api from './axios';

export const submitRating = async (movieId, rating) => {
  const response = await api.post('/ratings', { movieId, rating });
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to submit rating');
};

export const getMovieRatings = async (movieId) => {
  const response = await api.get(`/ratings/${movieId}`);
  if (response.data?.success) return response.data.data;
  throw new Error(response.data?.message || 'Failed to fetch ratings');
};
