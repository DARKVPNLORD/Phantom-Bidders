const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '../')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Import routes
const userRoutes = require('./src/routes/userRoutes');
const auctionRoutes = require('./src/routes/auctionRoutes');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phantom_bidders', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);

// Route for the home page (login/signup)
app.get('/', (req, res) => {
  res.redirect('/html/login_signup.html');
});

// Routes for HTML pages
app.get('/login', (req, res) => {
  res.redirect('/html/login_signup.html');
});

app.get('/buyer', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/buyer_landing.html'));
});

app.get('/seller', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/seller_landing.html'));
});

app.get('/browse', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/browse_auctions.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/create_listing.html'));
});

app.get('/sales', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/sales_dashboard.html'));
});

app.get('/history', (req, res) => {
  res.sendFile(path.join(__dirname, '../html/bid_history.html'));
});

// Catch-all route for pages not found
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../html/login_signup.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'production' ? null : err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at: http://192.168.214.232:${PORT}`);
  console.log('To find your IP address, run "ipconfig" on Windows or "ifconfig" on Mac/Linux');
}); 