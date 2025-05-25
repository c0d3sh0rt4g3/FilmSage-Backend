import express from 'express';
import userRoutes from "./routes/user.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import userInteractionRoutes from "./routes/userInteraction.routes.js";

import {connectDB} from "./config/db.js";

// Create an Express application
const app = express();
app.use(express.json());

// Define the port
const PORT = 3000;

app.use('/users', userRoutes);
app.use('/profiles', profileRoutes);
app.use('/reviews', reviewRoutes);
app.use('/userInteractions', userInteractionRoutes);

// Start the server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
