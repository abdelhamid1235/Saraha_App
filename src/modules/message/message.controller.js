import { Router } from "express";
import { fileValidation, localFileUpload, successResponse } from "../../common/utils/index.js";
import { createMessage, deleteMessage, getAllMessage, getMessage } from "./message.service.js";
import { uploadMiddleware } from "../../middleware/multer.middleware.js";
import {authentication, bearAuth, validation } from "../../middleware/index.js";
import * as validatore from "./message.validate.js"
const router = Router({caseSensitive:true , strict:true});

const messageFolderName = "message";

router.post("/",
    async(req , res , next)=>{
        if(req.headers["authorization"]){
            await bearAuth({req})
        }
        next()
    },
    uploadMiddleware({
        isrequird : false , 
        multerMiddleware : localFileUpload().array("attachment" , 3),
        customPath : messageFolderName,
        validation : fileValidation.image
    }),
    validation(validatore.createMessage),
    async(req, res, next) => {
        const message = await createMessage(req.body , req.files , req.user)        
        return successResponse({ res, status: 201 , data : message })
    }
)

router.get("/" , 
    authentication(),
    validation(validatore.allMessage),
    async(req , res , next)=>{
        const message = await getAllMessage(req.validate.query , req.user);
        return successResponse({ res , data : message })
    }
)
router.get("/:messageId" , 
    authentication(),
    validation(validatore.deleteMessage),
    async(req , res , next)=>{
        const message = await getMessage(req.validate.params , req.user);
        return successResponse({ res , data : message })
    }
)
router.delete("/:messageId" , 
    authentication(),
    validation(validatore.deleteMessage),
    async(req , res , next)=>{
        const message = await deleteMessage(req.validate.params , req.user);
        return successResponse({ res , data : message })
    }
)
export default router