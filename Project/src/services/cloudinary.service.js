import { v2 as cloudinary } from "cloudinary";
import { CloudinaryConfig } from "../config/constants";
class CloudianaryService{
    constructor(){
        try{
            cloudinary.config({
                cloud_name:CloudinaryConfig.cloudName,
                api_key:CloudinaryConfig.apiKey,
                api_secret:CloudinaryConfig.apiSecret
            })
        } catch(exception){
            throw {
                code:500,
                status:"ERROR_CONNECTING_TO+CLOUDINARY",
                message:"Error while connecting to cloudinary server",
                detail:exception
            }
        }
    }
    fileUpload= async(filepath, dir='')=>{
        try{
            const response = await cloudinary.uploader.upload(filepath,{
                unique_filename:true,
                folder:"prakash_project/"+dir
            })
        }catch(exception){
            throw {
                code:"",
                status:"ERROR_UPLOADING_FILE_TO_CLOUDINARY",
                message:"Error while uploading file to cloudinary server",
                detail:exception
            }
        }
    }
}

const cloudianarySvc = new CloudianaryService()
export default cloudianarySvc;