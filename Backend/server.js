require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const userRouter = require("./routes/user");
const { router } = require("./routes/auth");


const app = express();
const PORT = process.env.PORT ;

// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS


// Sample Route
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});
app.use("/users", userRouter);
app.use("/api/auth", router);
// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose
  mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

;
