const Auction = require('../models/auctionModel');
const Bid = require('../models/bidModel');

/**
 * @desc    Get all auctions
 * @route   GET /api/auctions
 * @access  Public
 */
const getAuctions = async (req, res) => {
  try {
    const { 
      featured,
      category, 
      sort = 'createdAt', 
      order = 'desc', 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter object
    const filter = {};
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    if (category) {
      filter.category = category;
    }
    
    // Get total count
    const total = await Auction.countDocuments(filter);
    
    // Get auctions
    const auctions = await Auction.find(filter)
      .sort({ [sort]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('seller', 'name');
    
    res.json({
      listings: auctions,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get auction by ID
 * @route   GET /api/auctions/:id
 * @access  Public
 */
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate({
        path: 'bids',
        populate: {
          path: 'bidder',
          select: 'name'
        },
        options: {
          sort: { amount: -1 }
        }
      });
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    res.json(auction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Create a new auction
 * @route   POST /api/auctions
 * @access  Private/Seller
 */
const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      startPrice,
      images,
      endDate
    } = req.body;
    
    // Create auction
    const auction = await Auction.create({
      title,
      description,
      category,
      condition,
      startPrice,
      currentBid: startPrice,
      images: images || ['/uploads/placeholder-image1.svg'],
      endDate,
      seller: req.user._id
    });
    
    res.status(201).json(auction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Update auction
 * @route   PUT /api/auctions/:id
 * @access  Private/Seller
 */
const updateAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if user is the seller
    if (auction.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this auction' });
    }
    
    // Update fields
    const {
      title,
      description,
      category,
      condition,
      startPrice,
      images,
      endDate,
      featured,
      status
    } = req.body;
    
    if (title) auction.title = title;
    if (description) auction.description = description;
    if (category) auction.category = category;
    if (condition) auction.condition = condition;
    if (startPrice) auction.startPrice = startPrice;
    if (images) auction.images = images;
    if (endDate) auction.endDate = endDate;
    if (featured !== undefined && req.user.role === 'admin') auction.featured = featured;
    if (status) auction.status = status;
    
    const updatedAuction = await auction.save();
    
    res.json(updatedAuction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete auction
 * @route   DELETE /api/auctions/:id
 * @access  Private/Seller
 */
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if user is the seller
    if (auction.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this auction' });
    }
    
    // Check if there are bids
    const hasBids = await Bid.exists({ auction: auction._id });
    if (hasBids) {
      return res.status(400).json({ message: 'Cannot delete auction with existing bids' });
    }
    
    await auction.deleteOne();
    
    res.json({ message: 'Auction removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Place a bid on an auction
 * @route   POST /api/auctions/:id/bid
 * @access  Private
 */
const placeBid = async (req, res) => {
  try {
    const { amount } = req.body;
    const auctionId = req.params.id;
    
    // Check if auction exists
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    // Check if auction is active
    if (auction.status !== 'active') {
      return res.status(400).json({ message: 'Cannot bid on inactive auction' });
    }
    
    // Check if auction has ended
    if (new Date(auction.endDate) < new Date()) {
      return res.status(400).json({ message: 'Auction has ended' });
    }
    
    // Check if user is not the seller
    if (auction.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot bid on your own auction' });
    }
    
    // Check if bid amount is higher than current bid
    if (amount <= auction.currentBid) {
      return res.status(400).json({ message: 'Bid must be higher than current bid' });
    }
    
    // Create new bid
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount
    });
    
    // Update auction with new current bid
    auction.currentBid = amount;
    await auction.save();
    
    res.status(201).json(bid);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  placeBid
}; 