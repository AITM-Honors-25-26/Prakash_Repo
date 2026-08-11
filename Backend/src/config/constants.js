import { config } from 'dotenv';
config();
const CloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};
export default CloudinaryConfig;
export const DBConfig = {
    mongodbUrl: process.env.MONGODB_URL,
    dbName: process.env.MONGO_DB_NAME || "Prakash"
};
export const UserRole = {
    ADMIN: "Admin",
    CHEF: "Chef",
    WAITER: "Waiter",
    RECEPTION: "Reception",
    Employee: "Employee"
};
export const Gender = {
    MALE: "Male",
    FEMALE: "Female",
    OTHER: "Other"
};
export const Category = {
    BREAD: 'Bread',
  CAKE: 'Cake',
  CUPCAKE: 'Cupcake',
  COOKIES: 'Cookies',
  PASTRIES: 'Pastries',
  DONUTS: 'Donuts',
  BEVERAGE: 'Beverage',
  SPECIAL: 'Special'
};
export const OrderStatus = {
    PENDING: 'Pending',
    PREPARING: 'Preparing',
    READY: 'Ready',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
};

export const PaymentStatus = {
    UNPAID: 'Unpaid',
    PENDING: 'Pending',
    PAID: 'Paid',
    FAILED: 'Failed'
};
export const TableStatus = {
    AVAILABLE: 'Available',
    OCCUPIED: 'Occupied',
    RESERVED: 'Reserved',
    NOTAVAILABLE: 'NotAvailable'
};
export const AppConfig = {
    frontend_Url: process.env.FRONTEND_URL,
    backend_Url: process.env.BACKEND_URL,
    jwtSecret: process.env.JWT_SECRET
};
export const SMTPConfig = {
    fromAddress: process.env.SMTP_FROM,
    provider: process.env.SMTP_PROVIDER,
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    port: process.env.SMTP_PORT
};
export const SMSConfig = {
    sparrow: {
        apiUrl: process.env.SPARROW_API_URL || "https://api.sparrowsms.com/v2/sms/",
        token: process.env.SPARROW_TOKEN,
        from: process.env.SPARROW_FROM
    }
};
export const WhatsAppConfig = {
    apiUrl: process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0/",
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || "membership_otp",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en"
};
