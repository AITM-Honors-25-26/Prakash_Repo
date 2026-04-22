export const API_BASE_URL = 'http://192.168.1.64:9005/api';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FORGETPASSWORD: `${API_BASE_URL}/auth/forgot_password`,
  RESETPASSWORD:`${API_BASE_URL}/auth/reset-password`,
  LISTALLITEMS:`${API_BASE_URL}/menu/list`

};
export const CATAGOTY = {
  BREAD: 'Bread',
  CAKE: 'Cake',
  Cupcake: 'Cupcake' ,
  COOKIES:'Cookies',
  PASTRIES:'Pastries',
  BONUTS:'Donuts',
  BEVERAGE:'Beverage',
  SPECIAL:'Special'
}

export const MAPURL = {
  MAP:"https://www.google.com/maps/place/27%C2%B043'51.3%22N+85%C2%B019'46.1%22E/@27.7309964,85.3294834,18z/data=!4m4!3m3!8m2!3d27.730905!4d85.329462?entry=ttu&g_ep=EgoyMDI2MDQxOS4wIKXMDSoASAFQAw%3D%3"
}