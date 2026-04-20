import mongoose from "mongoose";


const uservendorschema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        phone:{
            type:String,
            required:true
        },
        secondphone:{
            type:String,
            required:true
        },
        email:{
            type:String,
            unique:true,
            required:true
        },
        primaryaddress:{
            type:String,
            required:true
        }
    },{ timestamps:true}
)
export default mongoose.model("Vendor",uservendorschema)