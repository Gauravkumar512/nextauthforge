import mongoose from "mongoose";
import { getEnv } from "@/src/lib/env";

export async function connect(){
    
    const MONGO_DB_URL = getEnv().DATABASE_URL

    if(!MONGO_DB_URL){
        throw new Error("Please define the MONGODB_URI environment variable");
    }

    try {
        await mongoose.connect(MONGO_DB_URL)
        const connection = mongoose.connection

        connection.on('connected', ()=>{
            console.log("DB conencted")
        })

        connection.on('error',(err: any)=>{
            console.log(err)
        })

        
    } catch (error) {
        console.log("Something went wrong",error)
        throw error
    }
}