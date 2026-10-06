import { API_BASE_URL } from '../utils/constants';

const BASE_URL = API_BASE_URL;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('smarterp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login page, remove token
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('smarterp_token');
      localStorage.removeItem('smarterp_user');
      window.location.href = '/login';
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.detail) || response.statusText || 'API Request Failed';
    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiRequest;
