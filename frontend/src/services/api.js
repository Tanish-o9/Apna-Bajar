import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://apna-bajar-cq1a.vercel.app/api'
    : 'http://localhost:5000/api');

// Create configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});


/**
 * Format paise to Indian Rupee (INR) currency string
 * e.g., 299900 -> ₹2,999.00 or ₹2,999
 */
export const formatPrice = (paise) => {
  if (typeof paise !== 'number') return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
};

// API Services
export const fetchProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const fetchCategories = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};

export const createOrderApi = async (orderData, demoSessionId, token) => {
  const headers = {
    'x-demo-session-id': demoSessionId,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await apiClient.post('/orders', orderData, {
    headers,
  });
  return response.data;
};

export const fetchOrdersApi = async (demoSessionId) => {
  const response = await apiClient.get('/orders', {
    headers: {
      'x-demo-session-id': demoSessionId,
    },
  });
  return response.data;
};

export const fetchOrderByIdApi = async (id, demoSessionId) => {
  const response = await apiClient.get(`/orders/${id}`, {
    headers: {
      'x-demo-session-id': demoSessionId,
    },
  });
  return response.data;
};

// Auth Services
export const loginApi = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerApi = async (name, email, password) => {
  const response = await apiClient.post('/auth/register', { name, email, password });
  return response.data;
};

export const getMeApi = async (token) => {
  const response = await apiClient.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export default apiClient;
