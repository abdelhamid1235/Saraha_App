import { EmailSubjectEnum, ProviderEnum } from "../../common/enum/index.js";
import { BadReaquestException, ConflictException, NotFoundException, TooManyRequestException } from "../../common/exceptions/index.js";
import { create, findOne } from "../../common/repository/index.js";
import { compare, createLoginCradential, encrypt, hash, userBaseRevokeTokenKey } from "../../common/security/index.js";
import { del, expire, get, incrBy, keys, set, ttl } from "../../common/services/index.js";
import { createOtp, emailEvent, userEmailKey, userEmailTrialsKey} from "../../common/utils/email/index.js";
import { WEB_CLIENT_ID } from "../../config.js";
import { UserModel } from "../../DB/model/index.js"
import {OAuth2Client} from 'google-auth-library';

const client = new OAuth2Client();
async function verifyGoogleAccount(idToken) {
    const ticket = await client.verifyIdToken({
        idToken,
        audience: WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if(!payload.email_verified){
        throw BadReaquestException({message : "Email Not Verified"})
    }
    return payload
}
export const signupWithGmail = async ({idToken}) => {
    const {email , name , picture} = await verifyGoogleAccount(idToken);
    const duplicatedAccount = await findOne({
        filter : {email},
        model : UserModel,
    })
    if(duplicatedAccount){
        if(duplicatedAccount.provider != ProviderEnum.GOOGLE) throw ConflictException({message:"Invalid account"});
        return {status : 200 , data : createLoginCradential({user : duplicatedAccount})};
    }
    const user = await create({
        data:{
            userName : name,
            email : email,
            image : picture,
            confirmEmail : new Date(),
            provider : ProviderEnum.GOOGLE
        },
        model : UserModel
    })
    return {status : 201 , data : createLoginCradential({user})};
}
const sendEmailOtp = async({email , subject , userName, expireIn = 120 , maxTrials = 3, blockInSecond = 300})=>{
    const existOtp_ttl = await ttl({key:userEmailKey({email, subject})}) ?? 0;
    if(existOtp_ttl > 0){
        throw ConflictException({message:`Sorry we cannt create new otp while existing one still valid please try again after ${existOtp_ttl}`})
    }
    const oldOtpTrials = await get({key: userEmailTrialsKey({email , subject})});
    if(oldOtpTrials >= maxTrials){
        throw TooManyRequestException({message: "Max Otp Trials has been reached"})
    }
    const code = createOtp();
    await set({
        key:userEmailKey({email, subject}),
        value:await hash(code.toString()),
        ttl:expireIn
    })
    const currentTrials = await incrBy({key:userEmailTrialsKey({email , subject}) , value : 1 });
    if(currentTrials == maxTrials){
        await expire({key:userEmailTrialsKey({email , subject}) , ttl:blockInSecond})
    }
    emailEvent.emit("sendEmail" , {
        recipients:{to:email} , 
        subject, 
        data:{
            code, 
            userName,
        }
    })
}
export const signup = async (inputs) => {
    const {password , phone} = inputs
    const duplicatedAccount = await findOne({
        filter: {email : inputs.email},
        option: {select : "email"},
        model:UserModel
    })
    if(duplicatedAccount){
        throw ConflictException({message:"Email Exist"});
    }
    const user = await create({
        data:{
            ...inputs,
            password : await hash(password),
            phone: await encrypt(phone),
        },
        model: UserModel
    });
    await sendEmailOtp({email : inputs.email , subject:EmailSubjectEnum.confirm_Email, userName:inputs.userName})
    return user;
}

export const confirmEmail = async({email , otp}) => {
    const account = await findOne({
        filter: {email , provider : ProviderEnum.SYSTEM , confirmEmail:{$exists : false} },
        model:UserModel
    })
    if(!account){
        throw NotFoundException({message:"Invalid Account"});
    }
    const hashOtp = await get({
        key:userEmailKey({email, subject: EmailSubjectEnum.confirm_Email})
    })
    if(!hashOtp || !await compare(otp , hashOtp)){
        throw ConflictException({message : "Invalid OTP"});
    }
    account.confirmEmail = new Date();
    await account.save();

    await del({key : await keys({prefix : userEmailKey({email, subject: EmailSubjectEnum.confirm_Email}) })});
    return;
}
export const resentConfirmEmail = async({email}) => {
    const account = await findOne({
        filter: {email , provider : ProviderEnum.SYSTEM , confirmEmail:{$exists : false} },
        model:UserModel
    })
    if(!account){
        throw NotFoundException({message:"Invalid Account"});
    }
    await sendEmailOtp({email , subject : EmailSubjectEnum.confirm_Email , userName : account.userName})
}
export const requestForgetPassword = async({email}) => {
    const account = await findOne({
        filter: {email , provider : ProviderEnum.SYSTEM , confirmEmail:{$exists : true} },
        model:UserModel
    })
    if(!account){
        throw NotFoundException({message:"Invalid Account"});
    }
    await sendEmailOtp({email , subject : EmailSubjectEnum.forget_password , userName : account.userName})
}

export const verifyForgetPassword = async({email , otp}) => {
    const account = await findOne({
        filter: {email , provider : ProviderEnum.SYSTEM , confirmEmail:{$exists : true} },
        model:UserModel
    })
    if(!account){
        throw NotFoundException({message:"Invalid Account"});
    }
    const hashOtp = await get({
        key:userEmailKey({email, subject: EmailSubjectEnum.forget_password})
    })
    if(!hashOtp || !await compare(otp , hashOtp)){
        throw ConflictException({message : "Invalid OTP"});
    }
    return account;
}
export const resetPassword = async({email , otp , password}) => {
    const account = await verifyForgetPassword({email , otp});
    account.password = await hash(password);
    account.changeCradentialTime = Date.now();
    await account.save();
    const result = await Promise.all([
        keys({prefix : userBaseRevokeTokenKey({userId : account._id})}),
        keys({prefix : userEmailKey({email, subject: EmailSubjectEnum.forget_password}) })
    ])
    await del({key:[...result[0] , ...result[1]]});
    return ;
}


const userLoginTrialsKey = ({email}) => {
    return `User::${email}::Login::Trials`
}
const userLoginTrials = async ({email, maxLoginTrials = 5 , blockInSecond = 300})=>{
    const oldLoginTrials = await get({key: userLoginTrialsKey({email})}) ?? 0;
    if(oldLoginTrials >= maxLoginTrials){
        throw TooManyRequestException({message: "Max Login Trials has been reached"})
    }
    const currentLogin = await incrBy({key:userLoginTrialsKey({email}) , value : 1 });
    if(currentLogin == maxLoginTrials){
        await expire({key:userLoginTrialsKey({email}) , ttl:blockInSecond})
    }
}
export const login = async({email , password}) => {
    const account = await findOne({
        filter: {email , provider : ProviderEnum.SYSTEM ,confirmEmail:{$exists : true}},
        model:UserModel
    })
    if(!account){
        throw NotFoundException({message:"Invalid Email Or Password"});
    }
    const match = await compare(password  , account.password);
    if(!match){
        await userLoginTrials({email});
        throw NotFoundException({message:"Invalid Email Or Password"});
    }
    await del({key : userLoginTrialsKey({email})})
    return await createLoginCradential({user:account})
}