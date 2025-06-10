import express from 'express';
import userRoutes from "./routes/user.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userInteractionRoutes from "./routes/userInteraction.routes.js";
import {connectDB} from "./config/db.js";
import cors from "cors";

const app = express();
app.use(express.json());

const PORT = 3000;

// Orígenes permitidos - CORREGIDO
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://filmsage-frontend.onrender.com"
];

// Configuración CORS mejorada
const corsOptions = {
    origin: (origin, callback) => {
        console.log(`Request from origin: ${origin}`); // Para debug
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

app.use('/users', userRoutes);
app.use('/reviews', reviewRoutes);
app.use('/userInteractions', userInteractionRoutes);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
