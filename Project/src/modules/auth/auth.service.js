import bcrypt from "bcryptjs";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { randomStringGenerator } from "../../utils/helpers.js";
import UserModel from "../User/user.model.js";
class AuthService{
    userRegisterDataTrans= async (req, res) => {
        try{
            let data = req.body;
            if (req.file) {
                const upload = await cloudianarySvc.fileUpload(req.file.path, 'user/');
                data.image = {
                    url: upload.url,
                    optmizedUrl: upload.secure_url || upload.url
                };
                data.image_id=upload.public_id;
            }
            data.password = bcrypt.hashSync(data.password, 12);
            data.status= false
            data.activationToken = randomStringGenerator(100,'string')
            return data;
            }catch(exception){
                throw(exception);
        }
    }
    userStore = async(data)=>{
        try{
            const userObj = new UserModel(data)
            return await userObj.save()
        }catch(exception){
            throw(exception)
        }
    }  
    publicUserProfile = (userObj)=>{
        return{
            name:userObj.fullName,
            email:userObj.email,
            role:userObj.role,
            address:userObj.address,
            phone:userObj.phone,
            status:userObj.status,
            image:userObj.image,
            _id:userObj._id,
            createdAt:userObj.createdAt,
            dob:userObj.dob,
        };
    }
    getSingleUserByFilter= async (filter)=>{
        try{
            const user = await UserModel.findOne(filter);
            return user
        }catch(exception){
            throw exception
        }
    }
    updateSingleUserByFilter=async (filter, updateData) =>{
        try{
             let update = await UserModel.findOneAndUpdate(filter, {$set: updateData}, {new:true})
             return update
        }catch (exception){
            throw exception
        }
    }

}
const autSvc = new AuthService
export default autSvc