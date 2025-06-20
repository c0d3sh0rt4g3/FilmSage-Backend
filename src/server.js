/**
 * FilmSage Backend Server
 * Main application entry point that configures Express server, middleware, routes, and database connection
 * @file server.js
 * @author FilmSage Team
 */

import express from 'express';
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userInteractionRoutes from "./routes/userInteraction.routes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import {connectDB} from "./config/db.js";
import cors from "cors";
import 'dotenv/config';

const app = express();
app.use(express.json());

const PORT = process.env.PORT;

/**
 * Allowed origins for CORS configuration
 * Retrieved from environment variables for security
 */
const allowedOrigins = [
    process.env.FRONTEND_URL_DEV ,
    process.env.FRONTEND_URL_LOCAL, 
    process.env.FRONTEND_URL_PROD
];

/**
 * Enhanced CORS configuration with origin validation
 * Allows specific origins and includes credentials support
 */
const corsOptions = {
    origin: (origin, callback) => {
        console.log(`Request from origin: ${origin}`);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin"
    ],
    credentials: true
};

app.use(cors(corsOptions));

/**
 * Route middleware configuration
 */
app.use('/users', userRoutes);
app.use('/reviews', reviewRoutes);
app.use('/userInteractions', userInteractionRoutes);
app.use('/api/recommendations', recommendationRoutes);

/**
 * Server initialization with database connection
 * Starts the Express server and establishes MongoDB connection
 */
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
