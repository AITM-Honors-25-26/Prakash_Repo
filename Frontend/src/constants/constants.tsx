export const API_BASE_URL = 'http://192.168.1.64:9005/api';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FORGETPASSWORD: `${API_BASE_URL}/auth/forgot_password`,
  RESETPASSWORD:`/api/auth/reset-password`,
  LISTALLITEMS:`${API_BASE_URL}/menu/list`

};