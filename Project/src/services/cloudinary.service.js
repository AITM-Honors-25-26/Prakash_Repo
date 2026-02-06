import { v2 as cloudinary } from "cloudinary";
import CloudinaryConfig from "../config/constants.js"
import fs from "node:fs";

class CloudianaryService {
    constructor() {
        try {
            // Hardcoded keys as per your previous request
            cloudinary.config({
                cloud_name:CloudinaryConfig.cloud_name,
                api_key:CloudinaryConfig.api_key,
                api_secret:CloudinaryConfig.api_secret
            });
        } catch (exception) {
            throw {
                code: 500,
                status: "ERROR_CONNECTING_TO_CLOUDINARY",
                message: "Error while connecting to cloudinary server",
                detail: exception
            };
        }
    }
    removeLocalFile = (filepath) => {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (err) {
            // This throws if the file exists but can't be deleted (permissions, etc.)
            throw {
                code: 500,
                status: "LOCAL_FILE_DELETE_ERROR",
                message: "Cloudinary action finished, but failed to delete local file.",
                detail: err
            };
        }
    };

    fileUpload = async (filepath, dir = '') => {
        let uploadResponse;

        try {
            // 1. Attempt the upload
            uploadResponse = await cloudinary.uploader.upload(filepath, {
                unique_filename: true,
                folder: "prakash_project/" + dir,
            });
            // 2. Success: Delete local file and return URL
            this.removeLocalFile(filepath);

            return {
                url: uploadResponse.secure_url
            };
        } catch (exception) {
            // 3. Failure: Attempt to delete local file anyway
            // We wrap this in a try-catch so we can report the upload error 
            // even if the file deletion also fails.
            try {
                this.removeLocalFile(filepath);
            } catch (deleteError) {
                // Throw combined error if both upload AND delete fail
                throw {
                    code: 500,
                    status: "UPLOAD_AND_DELETE_FAILED",
                    message: "Upload failed and local file could not be removed.",
                    detail: { uploadError: exception, deleteError: deleteError }
                };
            }
            // If only upload failed but delete worked
            throw {
                code: exception.http_code || 500,
                status: "ERROR_UPLOADING_FILE_TO_CLOUDINARY",
                message: exception.message || "Error while uploading file to cloudinary",
                detail: exception
            };
        }
    }
}

const cloudianarySvc = new CloudianaryService();
export default cloudianarySvc;