import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istekten önce header'lara user bilgilerini ekle
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('filmrate_user') || 'null');
    if (user) {
      config.headers['X-User-Id'] = user.id;
      config.headers['X-User-Role'] = user.role;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Film API
export const filmAPI = {
  getAllFilms: () => api.get('/films'),
  getFilmById: (id) => api.get(`/films/${id}`),
  createFilm: (filmData) => api.post('/films', filmData),
  updateFilm: (id, filmData) => api.put(`/films/${id}`, filmData),
  deleteFilm: (id) => api.delete(`/films/${id}`),
};

// User API
export const userAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (userData) => api.post('/users/login', userData),
  getAllUsers: () => api.get('/users'), // YENİ
  updateUserRole: (id, role) => api.put(`/users/${id}/role`, { role }), // YENİ
  deleteUser: (id) => api.delete(`/users/${id}`), // YENİ
};

// Review API
export const reviewAPI = {
  createReview: (reviewData) => api.post('/reviews', reviewData),
  getFilmReviews: (filmId) => api.get(`/reviews/film/${filmId}`),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// Watchlist API
export const watchlistAPI = {
  // services/api.js'de watchlistAPI objesine ekle:
getUserFilmWatchlist: (userId, filmId) => api.get(`/watchlist/user/${userId}/film/${filmId}`),
  addToWatchlist: (watchlistData) => api.post('/watchlist', watchlistData),
  getUserWatchlist: (userId) => api.get(`/watchlist/user/${userId}`),
  updateWatchlistItem: (id, watchlistData) => api.put(`/watchlist/${id}`, watchlistData),
  removeFromWatchlist: (id) => api.delete(`/watchlist/${id}`),
};

export default api;