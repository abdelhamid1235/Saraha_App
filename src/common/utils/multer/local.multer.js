import multer from "multer";
import {randomUUID} from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {fileTypeFromBuffer} from "file-type"
import { BadReaquestException } from "../../exceptions/index.js";

export const fileValidation = {
    image : ["image/jpeg" , "image/png" , "image/gif"],
    files  : ["application/pdf" , "application/json"]
}
export const localFileUpload = ({maxSize = 5} = {})=>{
    // const storage = multer.diskStorage({
    //     destination : function(req , file , cb){
    //         cb(null , "./upload")
    //     },
    //     filename : function(req , file , cb){
    //         console.log({file});
    //         cb(null , randomUUID() + file.originalname)
    //     }
    // })
    const storage = multer.memoryStorage();
    return multer({storage , limits:{fileSize : maxSize * 1024 * 1024} })
}

export const processFile = async ({customPath = "general" , file , validation = []} = {})=>{
        const result = await fileTypeFromBuffer(file.buffer);
        if(!result || !validation.includes(result.mime)){
            throw BadReaquestException({message: "Invalid File Formate"})
        }else{
            await mkdir(resolve(`./upload/${customPath}`) , {recursive : true});
            const uniquePath = `upload/${customPath}/${randomUUID()}.${result.ext}`
            await writeFile(resolve(`./${uniquePath}`), file.buffer)
            file.finalPath = uniquePath;
            return file;
        }
}
export const processFiles = async ({customPath, files= [] , validation = []} = {})=>{
    const upload = []
    try {
        for(const file of files){
            const fileUpload = await processFile({customPath,file , validation})
            upload.push(fileUpload)
        }
        return upload;
    } catch (error) {
        await Promise.all(
            upload.map(file =>
                unlink(resolve(`./${file.finalPath}`))
            )
        );
    }
}
export const processFields = async ({customPath,fields = {}  , validation = []} = {})=>{
    const upload = []
    for(const field of Object.keys(fields)){
        const fileUpload = await processFiles({customPath,files : fields[field] , validation})
        upload.push({field , fileUpload})
    }
    return upload;
}

export const processMulterUpload = async ({req , customPath = "general", validation = []})=>{
        if(req.file){
            await processFile({customPath,file: req.file, validation})
        }else if(Array.isArray(req.files)){
            await processFiles({customPath,files:req.files , validation})
        }else if(typeof req.files == "object" && Object.keys(req.files)?.length){
            await processFields({customPath,Fields :req.files , validation})
        }
}