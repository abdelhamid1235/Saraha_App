import { BadReaquestException } from "../common/exceptions/index.js";
import { processMulterUpload } from "../common/utils/index.js";

export const uploadMiddleware = ({isrequird = true , multerMiddleware , customPath = "general", validation = []})=>{
    return (req , res , next)=>{
         multerMiddleware(req , res , async (err)=>{
        if(err){
            next(new Error(err.message , {cause : {status : 400}}))
            return;
        }
            try{
                if(isrequird && (!req.file && !(Array.isArray(req.files) && req.files.length) && !(typeof req.files == "object" && Object.keys(req.files)?.length))){
                    next(BadReaquestException({message: "File is Required"}))
                    return;
                }
                await processMulterUpload({req , customPath, validation});
                next();
            }catch(err){
                next(new Error(err.message , {cause : {status : 400}}))
            }
    })
    }
}