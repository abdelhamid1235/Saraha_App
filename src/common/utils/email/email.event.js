import {EventEmitter} from 'node:events'
import { sendEmail } from './send.email.js';
import { verifyEmailTemplate } from './email.templates.js';

export const emailEvent = new EventEmitter();

emailEvent.on("sendEmail" , async({recipients , subject , data})=>{
    try {
        await sendEmail({
            ...recipients,
            subject,
            html:verifyEmailTemplate({
                subject , 
                code:data.code , 
                title:data.title ?? subject ,
                userName : data.userName
            })
        })
    } catch (error) {
        console.log(error);
    }
})