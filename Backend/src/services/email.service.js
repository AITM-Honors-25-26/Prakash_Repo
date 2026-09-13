import nodemailer from "nodemailer"
import { SMTPConfig } from "../config/constants.js"
class EmailService{
    #transport
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
            this.#transport = nodemailer.createTransport(mailConfig)
        }catch(exception){
            console.error("Error while connecting to the SMTP server:", exception);
            throw exception;
        }
    }

    sendEmail = async({
        to,sub, message
    })=>{
        try{
            return await this.#transport.sendMail({
                to:to,
                from:SMTPConfig.fromAddress,
                subject:sub,
                html:message
            })

        }catch(exception){
            throw{
                message:"sending email failed",
                status:"EMAIL_SEND_FAILED"
            }
        }
    }

}
const emailSvc = new EmailService();
export default emailSvc;