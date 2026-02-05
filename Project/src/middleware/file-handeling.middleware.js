import multer from "multer"
import fs from "node:fs"

const myStorage = multer.diskStorage({
    destination:(req, file, callback)=>{
        const path = './public'
        if(!fs.existsSync(path)){
            fs.mkdirSync(path, {recursive:true})
        }
        callback(null, path);
    },
    filename:(req, file, callback)=>{
        const fileName = Date.now()+file.originalname;
        callback(null, fileName)
    }

})

export const uploader = (type = 'image')=>{
    let allowerdExtension = ['jpg', 'jepg', 'png','bmp','webp', 'svg']
    let maxUploadSize = 3 * 1024 * 1024;
    if (type==='doc'){
        allowerdExtension=['pdf','csv','txt','docx','doc','xlsx']
        maxUploadSize = 2 * 1025 * 1024
    }else if (type==='audio'){
        allowerdExtension=['mp3']
        maxUploadSize = 5 * 1025 * 1024
    }
    const filefilterHandile=(req, file, callback)=>{
            let ext = file.originalname.split(".").pop()
            if(allowerdExtension.includes(ext.toLowerCase())){
                callback(null, true)
            }else{
                callback({
                    code:400,
                    message:"File Format not Supported",
                    status:"INVALID_FILE_FORMAT",
                    details:{
                        [file.fieldname]:`File format not suported. supported extensions are:${allowerdExtension.join(",")}`
                    }
                })
            }
        }
    return multer({
        storage: myStorage,
        fileFilter:filefilterHandile,
        limits:{
            fileSize:maxUploadSize
        }
    });
}