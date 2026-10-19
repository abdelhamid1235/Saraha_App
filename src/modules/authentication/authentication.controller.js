import { Router } from "express";
import { confirmEmail, login, requestForgetPassword, resentConfirmEmail, resetPassword, signup, signupWithGmail, verifyForgetPassword } from "./authentication.service.js";
import { generateLimiter, successResponse } from "../../common/utils/index.js";
import * as validators from './authentication.validation.js'
import { validation } from "../../middleware/index.js";
import { del } from "../../common/services/index.js";
const router = Router({caseSensitive:true , strict:true});

router.post("/signup-with-gmail", async (req, res, next) => {
    const {status , data} = await signupWithGmail(req.body)
    return successResponse({ res, status, data })
})

router.post("/signup",validation(validators.signup), async (req, res, next) => {
    const data = await signup(req.validate.body)
    return successResponse({ res, status: 201, data })
})

router.patch("/confirm-email",validation(validators.confirmEmail), async (req, res, next) => {
    const data = await confirmEmail(req.validate.body)
    return successResponse({ res, status: 200, data})
})
router.patch("/resent-confirm-email",validation(validators.resentconfirmEmail), async (req, res, next) => {
    const data = await resentConfirmEmail(req.validate.body)
    return successResponse({ res, status: 200 , data})
})
router.post("/request-forget-password-code",validation(validators.resentconfirmEmail), async (req, res, next) => {
    const data = await requestForgetPassword(req.validate.body)
    return successResponse({ res, status: 201 , data})
})
router.post("/verify-forget-password",validation(validators.confirmEmail), async (req, res, next) => {
    const data = await verifyForgetPassword(req.validate.body)
    return successResponse({ res, status: 200 , data})
})
router.patch("/reset-password",validation(validators.resetPassword), async (req, res, next) => {
    const data = await resetPassword(req.validate.body)
    return successResponse({ res, status: 200 , data})
})
const loginLimiter = generateLimiter({limit : 5 , ttl : 5 , skipSuccessfulRequests: true})
router.post("/login",loginLimiter , validation(validators.login), async (req, res, next) => {
    const data = await login(req.validate.body)
    await del({key : req.rateLimit.key})
    return successResponse({ res, data })
})

export default router