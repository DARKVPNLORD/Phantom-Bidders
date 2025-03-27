const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  auction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auction',
    required: true
  },
  bidder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: [0, 'Bid amount must be positive']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Bid should be higher than the current bid
bidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Auction = mongoose.model('Auction');
    const auction = await Auction.findById(this.auction);
    
    if (!auction) {
      return next(new Error('Auction not found'));
    }
    
    if (this.amount <= auction.currentBid) {
      return next(new Error('Bid must be higher than the current bid'));
    }
    
    // Update the current bid in the auction
    auction.currentBid = this.amount;
    await auction.save();
  }
  
  next();
});

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid; 