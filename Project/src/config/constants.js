// constants.js
import { config } from 'dotenv';
config(); 

const CloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,    // underscore
    api_key: process.env.CLOUDINARY_API_KEY,          // underscore
    api_secret: process.env.CLOUDINARY_API_SECRET     // underscore
};

export const UserStatus = {
    ACTIVE:"Active",
    INACTIVE:"Inactive"
}



export const DBConfig ={
    mongodbUrl:process.env.MONGODB_URL,
    dbName:process.env.MANGO_DB_NAME
};

export default CloudinaryConfig;