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
    WORKER:"Worker"
}
export const Gender={
    MALE:"Male",
    FEMALE:"Female",
    OTHER:"Other"
}
export const AppConfig={
    frontend_Url:process.env.FRONTEND_URL
}
export const SMTPConfig={
    fromAddress:process.env.SMTP_FROM
}