import { Router } from "express";
import { fileValidation, localFileUpload,successResponse } from "../../common/utils/index.js";
import { logout, profile, rotate_token, update } from "./user.service.js";
import { authentication, authorization, uploadMiddleware } from "../../middleware/index.js";
import { RoleEnum, TokenTypeEnum } from "../../common/enum/index.js";
const router = Router()

router.patch("/profile-image",
    authentication(),
    uploadMiddleware({
        multerMiddleware : localFileUpload({maxSize : 3}).single("attachment"),
        customPath : "User" , 
        validation : fileValidation.image
    }),
    async(req, res, next) => {
        req.user.image = req.file.finalPath;
        await req.user.save()
    return successResponse({ res, data:{user : req.user}})
})

router.get("/",authentication() ,async(req, res, next) => {
    const account = await profile(req.user);
    return successResponse({ res, data: account })
})
router.patch("/",authentication(),authorization(RoleEnum.USER) ,async(req, res, next) => {
    const account = await update(req.user , req.body);
    return successResponse({ res,message: "Update Successfully", data: account })
})
router.post("/rotate_token",authentication(TokenTypeEnum.REFRESH) ,async(req, res, next) => {
    const account = await rotate_token(req.payload, req.user);
    return successResponse({ res ,  data: account })
})
router.post("/logout",authentication() ,async(req, res, next) => {
    const account = await logout(req.payload, req.user , req.body);
    return successResponse({ res ,  data: account })
})

export default router