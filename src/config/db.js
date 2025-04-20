import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connect = await mongoose.connect("mongodb+srv://elopjim829:q3IiZ3rbDVHI89lY@cluster0.ksfehvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        console.log(`MongoDB Connected: ${connect.connection.host}`)
    } catch (err) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
    }
}