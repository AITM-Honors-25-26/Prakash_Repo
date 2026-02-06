// constants.js
import { config } from 'dotenv';
config(); 

const CloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,    // underscore
    api_key: process.env.CLOUDINARY_API_KEY,          // underscore
    api_secret: process.env.CLOUDINARY_API_SECRET     // underscore
};

export default CloudinaryConfig;
