import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    content:{
        type:String,
        required:function(){ return this.attachments?.length > 0 ? false : true},
        minLength:2,
        MaxLength:50000
    },
    attachments:[String],
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
},
{
    timestamps:true,
    strict:true,
    strictQuery:true,
    toObject:{virtuals : true},
    toJSON:{virtuals : true}
})

export const  MessageModel = mongoose.models.Message || mongoose.model("Message" , MessageSchema);