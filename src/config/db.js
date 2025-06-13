/**
 * Database configuration module
 * Handles MongoDB connection using Mongoose
 * @file db.js
 * @module config/db
 */

import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB database
 * @async
 * @function connectDB
 * @description Connects to MongoDB using the connection string from environment variables
 * @throws {Error} When connection fails
 * @returns {Promise<void>} Promise that resolves when connection is established
 */
export const connectDB = async () => {
    try {
        const connect = await mongoose.connect("mongodb+srv://elopjim829:q3IiZ3rbDVHI89lY@cluster0.ksfehvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
        console.log(`MongoDB Connected: ${connect.connection.host}`)
    } catch (err) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
    }
}