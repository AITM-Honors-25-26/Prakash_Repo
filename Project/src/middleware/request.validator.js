export const bodyValidator = (schema)=>{
    return async(req, res, next)=>{
        try{
            let data = req.body;
            await schema.validateAsync(data, {abortEarly:false})
            console.log(data)
            next()
        }catch(exception){
            // console.log(exception)
            let errBag = {}
            if(exception.details){
                exception.details.map((error)=>{
                    console.log(error)
                    errBag[error.context.label] = error.message})
                    
            }
            next({
                code:400,
                error:errBag,
                message:"Validation Faild",
                status:"VALIDATION_FAILED"

            })
        }
    }
}