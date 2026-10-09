import multer from "multer";
import {randomUUID} from "node:crypto"
import { readFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {fileTypeFromBuffer} from "file-type"

export const fileValidation = {
    image : ["image/jpeg" , "image/png" , "image/gif"],
    files  : ["application/pdf" , "application/json"]
}
export const localFileUpload = ({maxSize = 5 , validation = []} = {})=>{
    const storage = multer.diskStorage({
        destination : function(req , file , cb){
            cb(null , "./upload")
        },
        filename : function(req , file , cb){
            console.log({file});
            cb(null , randomUUID() + file.originalname)
        }
    })

    function fileFilter(req , file , cb){
        if(validation.includes(file.mimetype)){
            cb(null , true)
        }else{
            cb(new Error("Invalid Formate" , {cause:{status : 400}}) , false)
        }
    }
    return multer({fileFilter , storage , limits:{fileSize : maxSize * 1024 * 1024} })
}

export const processFile = ({validation = []} = {})=>{
    return async (req , res , next)=>{
        const filePath = resolve(`./${req.file.path}`)
        const readFileBuffer = await readFile(filePath);
        const result = await fileTypeFromBuffer(readFileBuffer);
        if(!result || !validation.includes(result.mime)){
            await unlink(filePath);
            next(new Error("Invalid File Formate" , {cause: {status : 400}}))
        }
        next();
    }
}