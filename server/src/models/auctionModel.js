const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Electronics', 'Collectibles', 'Fashion', 'Home & Garden', 'Art', 'Jewelry', 'Other']
  },
  condition: {
    type: String,
    required: [true, 'Please select a condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Poor']
  },
  startPrice: {
    type: Number,
    required: [true, 'Please provide a starting price'],
    min: [0, 'Starting price must be positive']
  },
  currentBid: {
    type: Number,
    default: function() {
      return this.startPrice;
    }
  },
  images: {
    type: [String],
    default: ['/uploads/placeholder-image1.svg']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bids
auctionSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'auction'
});

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction; 