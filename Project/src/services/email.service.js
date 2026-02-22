import nodemailer from "nodemailer"
import { SMTPConfig } from "../config/constants.js"
class EmailService{
    #trasnport
    constructor(){
        try{
            const mailConfig = {
                host:SMTPConfig.host,
                port:SMTPConfig.port,
                auth:{
                    user:SMTPConfig.user,
                    pass:SMTPConfig.password
                },
            }
            if (SMTPConfig.provider ==="gmail"){
                mailConfig['service'] = SMTPConfig.provider
            }
            this.#trasnport = nodemailer.createTransport(mailConfig)         

        }catch(exception){
            console.log("ERROR WHILE CONNECTING TO THE SMTP SERVER !!!!!!!!!!!!!!!!!!!!!!!!!!")
            throw exception
        }
    }


}
const emailSvc = new EmailService();
export default emailSvc;