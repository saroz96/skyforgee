require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cors = require('cors');
const passport = require('passport');
const initializePassport = require('./config/passport-config');
const path = require('path');

const PORT = process.env.PORT || 5000;
const app = express();

// Initialize Passport
initializePassport(passport);

// Database Connection with improved error handling
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000
})
.then(() => console.log("Database connected"))
.catch(err => {
  console.error("Database connection error:", err);
  process.exit(1);
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Database connected"));

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Session Configuration - Fixed duplicate and incorrect setup
const sessionStore = MongoStore.create({
  mongoUrl: mongoUri,
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60, // 14 days
  autoRemove: 'native',
  crypto: {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key'
  }
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Flash middleware
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.messages = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Import routes
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/company');
const itemRoutes = require('./routes/retailer/items');
const categoryRoutes = require('./routes/retailer/category');
const itemsCompanyRoutes = require('./routes/retailer/itemsCompany');
const unitRoutes = require('./routes/retailer/unit');
const mainUnitRoutes = require('./routes/retailer/mainUnit');
const compositionRroutes = require('./routes/retailer/composition');
const accountRoutes = require('./routes/retailer/account');
const accountGroupRoutes = require('./routes/retailer/companyGroup');
const purchaseRoutes = require('./routes/retailer/purchase');
const salesRoutes = require('./routes/retailer/sales');
const purchaseReturnRoutes = require('./routes/retailer/purchaseReturn');
const salesReturnRoutes = require('./routes/retailer/salesReturn');
const miscRoutes = require('./routes/retailer/miscellaneous');
const paymentRoutes = require('./routes/retailer/payment');
const receiptRoutes = require('./routes/retailer/receipt');
const stockAdjustmentRoutes = require('./routes/retailer/stockAdjustments');

// Routes
app.use('/api/auth', userRoutes);
app.use('/api', companyRoutes);

// Retailer routes
app.use('/api/retailer', itemRoutes);
app.use('/api/retailer', categoryRoutes);
app.use('/api/retailer', itemsCompanyRoutes);
app.use('/api/retailer', unitRoutes);
app.use('/api/retailer', mainUnitRoutes);
app.use('/api/retailer', compositionRroutes);
app.use('/api/retailer', accountRoutes);
app.use('/api/retailer', accountGroupRoutes);
app.use('/api/retailer', purchaseRoutes);
app.use('/api/retailer', salesRoutes);
app.use('/api/retailer', purchaseReturnRoutes);
app.use('/api/retailer', salesReturnRoutes);
app.use('/api/retailer', miscRoutes);
app.use('/api/retailer', paymentRoutes);
app.use('/api/retailer', receiptRoutes);
app.use('/api/retailer', stockAdjustmentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For Vercel deployment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; // For Vercel serverless functions