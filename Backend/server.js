require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const path = require('path');





const app = express();
const PORT = process.env.PORT ;

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 180 * 60 * 1000 } // 3 hours
}));

//Routes
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});
app.use('/api/auth', authRoutes);
app.use('/api/profile', authRoutes);

// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

;
