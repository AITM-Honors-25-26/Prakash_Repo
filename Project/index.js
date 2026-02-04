import app from "./src/config/express.config.js";
import http from "http";
const httpServer = http.createServer(app);

httpServer.listen(9005, "192.168.1.67",(err)=>{
    if(!err){
        console.log("server is running on port: ",9005)
        console.log("Press CTRL + C to discontinue the code......")
    }
})                                                                                                                                                                                                                                                                                                              