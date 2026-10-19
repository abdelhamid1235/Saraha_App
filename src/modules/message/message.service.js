import { NotFoundException } from "../../common/exceptions/index.js";
import * as messageBase from "../../common/repository/message.repository.js"
import * as UserBase from "../../common/repository/user.repository.js"

export const createMessage = async ({content , receiverId} ={}, files=[], user = undefined)=>{
    const checkReceiverIdExist = await UserBase.findById({
        id : receiverId,
    })
    if(!checkReceiverIdExist){
        throw NotFoundException({message:"Invalid Receiver ID"});
    }
    const message = await messageBase.create({
        data : {
            receiverId,
            content,
            attachments: files.map(ele => ele.path),
            ...(user? {senderId : user._id} : {})
        }
    })
    return message;
}


export const getAllMessage = async({type , page  = 1, limit = 5} = {} , user )=>{
    let filter = {};
    if(type == "0"){
        filter = {receiverId : user._id}
    }else if (type == "1"){
        filter = {senderId : user._id}
    }else{
        filter = {
            $or :[
                {senderId : user._id},
                {receiverId : user._id},
            ]
        }
    }
    const message = await messageBase.paginate({
        filter,
        options:{
            sort:{createdAt : -1}
        },
        page,
        limit
    })
    return message
}

export const deleteMessage = async({messageId}, user)=>{
    const message = await messageBase.deleteOne({
        filter:{
            receiverId : user._id,
            _id : messageId
        },
    })
    if(!message.deletedCount) throw NotFoundException("InValid message Id");
    return message
}
export const getMessage = async({messageId}, user)=>{
    const message = await messageBase.findOne({
        filter:{
            receiverId : user._id,
            _id : messageId
        },
    })
    if(!message) throw NotFoundException("InValid message Id");
    return message
}