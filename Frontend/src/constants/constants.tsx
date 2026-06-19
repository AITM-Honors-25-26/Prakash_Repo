export const API_BASE_URL = 'http://192.168.1.64:9005/api';
export const API_FRONTEND = 'http://192.168.1.64:5173';
export const SOCKET_URL = 'http://192.168.1.64:9005';

export const API_ENDPOINTS = {
  // Auth Routes
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  FORGETPASSWORD: `${API_BASE_URL}/auth/forgot_password`,
  RESETPASSWORD: `${API_BASE_URL}/auth/reset-password`,

  // Menu Routes
  LISTALLITEMS: `${API_BASE_URL}/menu/list`,
  MENU_ACTION: `${API_BASE_URL}/menu`,
  ADDMENUITEM: `${API_BASE_URL}/menu/add-item`,
  DELETEMENUITEM: `${API_BASE_URL}/menu`,

  // Table Routes
  TABLEMANAGEMENT: `${API_BASE_URL}/TableManagement`,
  LISTALLTABLE: `${API_BASE_URL}/table/list`,
  ADDTABLE: `${API_BASE_URL}/table/add`,
  DELETETABLE: `${API_BASE_URL}/table`,
  UPDATETABLE: `${API_BASE_URL}/table`,

  LISTALLORDERS: `${API_BASE_URL}/order/list`,
  UPDATEORDERSTATUS: `${API_BASE_URL}/order/status`,
  ORDER_ACTION: `${API_BASE_URL}/order`,

  // Frontend Navigation Links
  TABLENUMBER: `${API_FRONTEND}/MenuPage/:id`,
  TABLE_BASE: `${API_BASE_URL}/table`,

  CONTACTADMIN:`${API_BASE_URL}/conatctAdmin`
};

export const CATEGORY = {
  BREAD: 'Bread',
  CAKE: 'Cake',
  CUPCAKE: 'Cupcake',
  COOKIES: 'Cookies',
  PASTRIES: 'Pastries',
  DONUTS: 'Donuts',
  BEVERAGE: 'Beverage',
  SPECIAL: 'Special'
};

export const MAPURL = {
  MAP: "https://www.google.com/maps/place/27%C2%B043'51.3%22N+85%C2%B019'46.1%22E/@27.7309964,85.3294834,18z/data=!4m4!3m3!8m2!3d27.730905!4d85.329462?entry=ttu&g_ep=EgoyMDI2MDQxOS4wIKXMDSoASAFQAw%3D%3",
  LOCATION: "https://www.google.com/maps/embed?pb=!1m13!1m8!1m3!1d22901.190745384483!2d85.32925641091472!3d27.733165611841958!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjfCsDQzJzUxLjMiTiA4NcKwMTknNDYuMSJF!5e1!3m2!1sen!2snp!4v1777114019686!5m2!1sen!2snp"
};

export const OrderStatus={
  PENDING:'Pending',
  PREPARING:'Preparing',
  READY:'Ready',
  COMPLETED:'Completed',
  CANCELLED:'Cancelled'
}