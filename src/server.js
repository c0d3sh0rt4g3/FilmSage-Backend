import express from 'express';
import userRoutes from "./routes/user.routes.js";
import {connectDB} from "./config/db.js";

// Create an Express application
const app = express();
app.use(express.json());

// Define the port
const PORT = 3000;

// Create a basic route
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.use('/users', userRoutes);

// Start the server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
