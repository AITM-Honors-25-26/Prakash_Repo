// constants.js
import { config } from 'dotenv';
config(); 
const CloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,   
    api_key: process.env.CLOUDINARY_API_KEY,         
    api_secret: process.env.CLOUDINARY_API_SECRET    
};
export const DBConfig ={
    mongodbUrl:process.env.MONGODB_URL,
    dbName:process.env.MANGO_DB_NAME
};
export default CloudinaryConfig;
export const UserRole={
    ADMIN:"Admin",
    CHEF:"Chef",
    WAITER:"Waiter",
    RECEPTION:"Reception",
    Employee:"Employee"
}
export const Gender={
    MALE:"Male",
    FEMALE:"Female",
    OTHER:"Other"
}
export const Category={
    Cake:'Cake',
    BREAD:'Bread',
    PASTERY:'Pastry',
    COOKIE:'Cookie',
    DRINKS: 'Drinks'
}
export const AppConfig={   
    frontend_Url:process.env.FRONTEND_URL,
    backend_Url:process.env.BACKEND_URL,
    jwtSecret:process.env.JWT_SECRET
}
export const SMTPConfig={
    fromAddress:process.env.SMTP_FROM,
    provider: process.env.SMTP_PROVIDER,
    host:process.env.SMTP_HOST,
    user:process.env.SMTP_USER,
    password:process.env.SMTP_PASSWORD,
    port:process.env.SMTP_PORT
}
export const Status={
    AVAILABLE:'Available',
    OCCUPIED:'Occupied',
    RESERVED: 'Reserved',
    NOTAVAILABLE:'NotAvailable'
}