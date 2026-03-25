import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh');
        const { data } = await axios.post('http://localhost:8000/api/token/refresh/', { refresh });
        localStorage.setItem('access', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return API(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => API.post('/registration/', data);
export const verifyOtp = (data) => API.post('/verify_otp/', data);
export const loginUser = (data) => API.post('/login/', data);
export const verifyOtp2f = (data) => API.post('/verify_otp_2f/', data);
export const resendOtp = (data) => API.post('/resend_otp/', data);
export const resetPassword = (data) => API.post('/reset_password/', data);

// Products
export const getProducts = (params) => API.get('/all_products/', { params });
export const getProductById = (id) => API.get(`/all_products/?product_id=${id}`);
export const createProduct = (categoryId, data) => API.post(`/product_list_create/${categoryId}/`, data);
export const updateProduct = (id, data) => API.put(`/product_modify/${id}/`, data);
export const deleteProduct = (id) => API.delete(`/product_delete/${id}/`);

// Categories
export const getCategories = () => API.get('/public/categories/');
export const createCategory = (data) => API.post('/admin/category/create/', data);
export const updateCategory = (id, data) => API.put(`/admin/category/${id}/update/`, data);
export const deleteCategory = (id) => API.delete(`/admin/category/${id}/delete/`);

// Cart
export const getCart = () => API.get('/cart/');
export const addToCart = (data) => API.post('/cart/add/', data);
export const updateCartItem = (id, data) => API.put(`/cart/${id}/update/`, data);
export const removeCartItem = (id) => API.delete(`/cart/${id}/delete/`);
export const clearCart = () => API.delete('/cart/clear/');

// Orders
export const checkout = (data) => API.post('/checkout/', data);
export const getMyOrders = () => API.get('/my-orders/');
export const cancelOrder = (id) => API.post(`/checkout/cancel/${id}/`);
export const getAdminOrders = () => API.get('/admin/my-orders/');
export const updateOrderStatus = (id, data) => API.put(`/admin/order/${id}/status/`, data);
export const updatePaymentStatus = (id) => API.put(`/payment/status/${id}/`);
export const getAllPayments = () => API.get('/admin/orders/payment-status/');

// Comments
export const getComments = (productId) => API.get(`/comments/${productId}/`);
export const addComment = (productId, data) => API.post(`/add_comment/${productId}/`, data);
export const replyComment = (productId, commentId, data) => API.post(`/reply_to_comment/${productId}/${commentId}/`, data);
export const updateComment = (id, data) => API.put(`/update_by_user/${id}/`, data);
export const deleteComment = (id) => API.delete(`/delete_by_user/${id}/`);
export const adminDeleteComment = (id) => API.delete(`/admin_delete_comment/${id}/`);

// Admin
export const getAdminDashboard = () => API.get('/admin_dashboard/');
export const getAdminUsers = () => API.get('/admin_user_list/');
export const getAdminUserDetail = (id) => API.get(`/admin_user_detail/${id}/`);

// Wishlist
export const getWishlist = () => API.get('/wishlist/');
export const addToWishlist = (product_id) => API.post('/wishlist/', { product_id });
export const removeFromWishlist = (product_id) => API.delete('/wishlist/', { data: { product_id } });

// Return Requests
export const createReturnRequest = (data) => API.post('/create_return_request/', data);
export const getMyReturns = () => API.get('/user_view_return_requests/');
export const trackReturnStatus = (id) => API.get(`/track_return_status/${id}/`);
export const updatePickupDate = (id, data) => API.patch(`/update_pickup_date/${id}/`, data);
export const requestRefund = (id) => API.patch(`/request_refund/${id}/`);
export const getAdminReturns = () => API.get('/admin_view_return_requests/');
export const approveReturnRequest = (id, data) => API.patch(`/approve_return_request/${id}/`, data);
export const processPickup = (id) => API.patch(`/process_pickup/${id}/`);
export const processRefund = (id) => API.patch(`/process_refund/${id}/`);

// Ratings
export const addRating = (data) => API.post('/product-rating/', data);
export const getProductRatings = (productId) => API.get(`/product-rating/${productId}/`);

// Profile
export const getProfile = () => API.get('/profile/');
export const updateProfile = (data) => API.put('/profile/', data);

// Recommendations & ML
export const getRecommendations = (productId) => API.get(`/product/${productId}/recommendations/`);
export const predictPrice = (data) => API.post('/predict-price/', data);
export const imageSearch = (formData) => API.post('/image-search/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export default API;
