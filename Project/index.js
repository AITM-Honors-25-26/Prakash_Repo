import http from "http";
const httpServer = http.createServer((request, response)=>{
    response.end("hello world");
});

httpServer.listen(9005, "192.168.1.67",(err)=>{
    if(!err){
        console.log("server is running on port: ",9005)
        console.log("Press CTRL + C to discontinue the code......")
    }
})