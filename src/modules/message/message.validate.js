import {z} from "zod"
import { generaValidationFields } from "../../common/validation.js"
import { LanguageEnum } from "../../common/enum/user.enum.js";


export const createMessage = (lang)=>{
    return z.object({
        body:z.strictObject({
            content:z.string().min(2).max(50000).optional(),
            receiverId: generaValidationFields.id(lang)
        }),
        files: z.array(generaValidationFields.file(lang)).max(3).optional()
    }).superRefine((data , ctx)=>{
        if(!data.body.content && !data.files?.length){
            ctx.addIssue({
                code : "custom",
                path:[`content`],
                message:lang === LanguageEnum.AR ?`لازم يبقي في محتوي ` : `missing message Content`
            })
}
    })
}

export const allMessage = (lang)=>{
    return z.object({
        query:z.strictObject({
            type:z.enum(["0" , "1" , "2"]).default("0"),
            page:z.coerce.number().min(1).default(1),
            limit:z.coerce.number().default(5)
        })
    })
}
export const deleteMessage = (lang)=>{
    return z.object({
        params:z.strictObject({
            messageId:generaValidationFields.id(lang)
        })
    })
}