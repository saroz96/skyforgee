require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const cors = require('cors');
const passport = require('passport');
const path = require('path');
const initializePassport = require('./config/passport-config');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session Configuration
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: 'sessions',
  ttl: 14 * 24 * 60 * 60, // 14 days
  autoRemove: 'native'
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
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

// Passport Configuration
initializePassport(passport);
app.use(passport.initialize());
app.use(passport.session());

// Flash Messages
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Route Imports
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

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server and exit process
  server.close(() => process.exit(1));
});