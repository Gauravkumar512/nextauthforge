import mongoose from "mongoose";

export async function connect(){
    
    const MONGO_DB_URL = process.env.DB_CONFIG

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