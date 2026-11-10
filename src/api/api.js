import axios from 'axios';

const defaultApiUrl = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:8080';
const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || defaultApiUrl).replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
