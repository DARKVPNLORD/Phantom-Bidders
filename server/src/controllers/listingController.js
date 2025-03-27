const Listing = require('../models/Listing');
const mongoose = require('mongoose');

// Create a new listing
exports.createListing = async (req, res) => {
    try {
        // Get user info from authenticated request
        const userId = req.user.id;
        const userName = req.user.name;

        // Create new listing with user as seller
        const listingData = {
            ...req.body,
            seller: {
                id: userId,
                name: userName
            }
        };

        const listing = new Listing(listingData);
        await listing.save();

        res.status(201).json({ 
            success: true, 
            message: 'Listing created successfully', 
            listing 
        });
    } catch (error) {
        console.error('Error creating listing:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create listing', 
            error: error.message 
        });
    }
};

// Get all listings with filters
exports.getListings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter - only show active listings to buyers by default
        const filter = { status: 'active' }; 
        
        // Apply search filter if provided
        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }
        
        // Apply category filter if provided
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        // Apply price filter if provided
        if (req.query.minPrice || req.query.maxPrice) {
            filter['pricing.startingPrice'] = {};
            
            if (req.query.minPrice) {
                filter['pricing.startingPrice'].$gte = parseInt(req.query.minPrice);
            }
            
            if (req.query.maxPrice) {
                filter['pricing.startingPrice'].$lte = parseInt(req.query.maxPrice);
            }
        }
        
        // Apply seller filter if provided
        if (req.query.seller) {
            filter['seller.id'] = req.query.seller;
        }
        
        // Count total matching listings
        const total = await Listing.countDocuments(filter);
        
        // Get listings with pagination
        const listings = await Listing.find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);
        
        res.status(200).json({
            success: true,
            count: listings.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            listings
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listings',
            error: error.message
        });
    }
};

// Get a single listing by ID
exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        
        res.status(200).json({
            success: true,
            listing
        });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch listing',
            error: error.message
        });
    }
};

// Update a listing
exports.updateListing = async (req, res) => {
    try {
        // Find the listing
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        
        // Check if user is the seller
        if (listing.seller.id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this listing'
            });
        }
        
        // Update only allowed fields
        const allowedUpdates = [
            'title', 'description', 'category', 'condition', 
            'images', 'pricing', 'shippingOptions', 'status'
        ];
        
        const updates = {};
        for (const key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }
        
        // Apply updates
        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Listing updated successfully',
            listing: updatedListing
        });
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update listing',
            error: error.message
        });
    }
};

// Delete a listing
exports.deleteListing = async (req, res) => {
    try {
        // Find the listing
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        
        // Check if user is the seller
        if (listing.seller.id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this listing'
            });
        }
        
        // Check if listing has bids
        if (listing.bids && listing.bids.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete listing with active bids'
            });
        }
        
        // Delete the listing
        await Listing.findByIdAndDelete(req.params.id);
        
        res.status(200).json({
            success: true,
            message: 'Listing deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting listing:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete listing',
            error: error.message
        });
    }
};

// Place a bid on a listing
exports.placeBid = async (req, res) => {
    try {
        // Find the listing
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        
        // Check if listing is active
        if (listing.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot bid on an inactive listing'
            });
        }
        
        // Check if auction has ended
        if (new Date(listing.endDate) < new Date()) {
            // Update listing status
            listing.status = 'ended';
            await listing.save();
            
            return res.status(400).json({
                success: false,
                message: 'Auction has ended'
            });
        }
        
        // Check if user is not the seller
        if (listing.seller.id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Sellers cannot bid on their own listings'
            });
        }
        
        // Get bid amount from request
        const bidAmount = parseFloat(req.body.amount);
        
        // Check if bid amount is valid
        if (!bidAmount || isNaN(bidAmount)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid bid amount'
            });
        }
        
        // Get current highest bid or starting price
        const currentBid = listing.pricing.currentBid || listing.pricing.startingPrice;
        const minBid = currentBid + listing.pricing.bidIncrement;
        
        // Check if bid is high enough
        if (bidAmount < minBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be at least ${minBid}`
            });
        }
        
        // Create bid object
        const bid = {
            bidder: req.user.id,
            bidderName: req.user.name,
            amount: bidAmount,
            time: new Date()
        };
        
        // Add bid to listing
        listing.bids.push(bid);
        listing.pricing.currentBid = bidAmount;
        
        // Save the listing
        await listing.save();
        
        res.status(200).json({
            success: true,
            message: 'Bid placed successfully',
            bid,
            listing
        });
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place bid',
            error: error.message
        });
    }
};

// Get seller's listings
exports.getSellerListings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter for seller's listings
        const filter = { 'seller.id': req.user.id };
        
        // Apply status filter if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        // Apply search filter if provided
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
                { category: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Apply date range filter if provided
        if (req.query.dateRange) {
            const now = new Date();
            let startDate;
            
            switch (req.query.dateRange) {
                case 'today':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    break;
                case 'month':
                    startDate = new Date(now.setMonth(now.getMonth() - 1));
                    break;
                case 'year':
                    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                filter.createdAt = { $gte: startDate };
            }
        }
        
        // Count total matching listings
        const total = await Listing.countDocuments(filter);
        
        // Get listings with pagination
        const listings = await Listing.find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);
        
        // Calculate stats for all seller's listings (without pagination)
        const allListings = await Listing.find({ 'seller.id': req.user.id });
        
        const stats = {
            totalListings: allListings.length,
            activeListings: allListings.filter(item => item.status === 'active').length,
            soldItems: allListings.filter(item => item.status === 'sold').length,
            totalRevenue: allListings
                .filter(item => item.status === 'sold')
                .reduce((sum, item) => {
                    // Use winning bid amount or current highest bid
                    const soldAmount = item.winningBid ? item.winningBid.amount : 
                                      (item.pricing.currentBid || item.pricing.startingPrice);
                    return sum + soldAmount;
                }, 0)
        };
        
        res.status(200).json({
            success: true,
            count: listings.length,
            total,
            pagination: {
                page,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            },
            stats,
            listings
        });
    } catch (error) {
        console.error('Error fetching seller listings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller listings',
            error: error.message
        });
    }
};

// Get buyer's bidding history
exports.getBuyerBids = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Find listings where user has placed bids
        const filter = { 'bids.bidder': req.user.id };
        
        // Apply status filter if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        // Count total matching listings
        const total = await Listing.countDocuments(filter);
        
        // Get listings with pagination
        const listings = await Listing.find(filter)
            .sort({ 'bids.time': -1 }) // Sort by most recent bid
            .skip(skip)
            .limit(limit);
        
        // Transform data to include bid information
        const bids = listings.map(listing => {
            // Find user's highest bid
            const userBids = listing.bids.filter(bid => bid.bidder.toString() === req.user.id);
            const highestBid = userBids.reduce((highest, bid) => 
                bid.amount > highest.amount ? bid : highest, userBids[0]);
            
            return {
                listingId: listing._id,
                title: listing.title,
                images: listing.images,
                category: listing.category,
                endDate: listing.endDate,
                status: listing.status,
                startingPrice: listing.pricing.startingPrice,
                currentBid: listing.pricing.currentBid,
                bid: {
                    amount: highestBid.amount,
                    time: highestBid.time,
                    isHighestBidder: listing.pricing.currentBid === highestBid.amount
                }
            };
        });
        
        res.status(200).json({
            success: true,
            count: bids.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            bids
        });
    } catch (error) {
        console.error('Error fetching buyer bids:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bids',
            error: error.message
        });
    }
};

// Toggle listing visibility
exports.toggleVisibility = async (req, res) => {
    try {
        // Find the listing
        const listing = await Listing.findById(req.params.id);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }
        
        // Check if user is the seller
        if (listing.seller.id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this listing'
            });
        }
        
        // Determine new status based on visibility parameter
        const makeVisible = req.body.visible;
        const newStatus = makeVisible ? 'active' : 'inactive';
        
        // Update listing status
        listing.status = newStatus;
        await listing.save();
        
        res.status(200).json({
            success: true,
            message: `Listing is now ${makeVisible ? 'visible' : 'invisible'} to buyers`,
            listing
        });
    } catch (error) {
        console.error('Error toggling listing visibility:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update listing visibility',
            error: error.message
        });
    }
};

// Get bids for a specific auction
exports.getAuctionBids = async (req, res) => {
    try {
        const auctionId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Find the listing/auction
        const listing = await Listing.findById(auctionId);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }
        
        // Check if user is the seller
        if (listing.seller.id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view bids for this auction'
            });
        }
        
        // Get all bids for this auction, sorted by amount (highest first)
        const allBids = [...listing.bids].sort((a, b) => b.amount - a.amount);
        
        // Get highest bid amount
        const highestBidAmount = allBids.length > 0 ? allBids[0].amount : 0;
        
        // Total number of bids
        const totalBids = allBids.length;
        
        // Apply pagination
        const paginatedBids = allBids.slice(skip, skip + limit);
        
        // Transform bid data for response
        const formattedBids = paginatedBids.map(bid => {
            // Find previous bid by same bidder to calculate increment if possible
            const previousBids = allBids.filter(b => 
                b.bidder.toString() === bid.bidder.toString() && 
                b.amount < bid.amount
            ).sort((a, b) => b.amount - a.amount);
            
            const previousBid = previousBids.length > 0 ? previousBids[0] : null;
            const increment = previousBid ? bid.amount - previousBid.amount : null;
            
            return {
                bidId: bid._id,
                bidderId: bid.bidder,
                bidderName: bid.bidderName || 'Anonymous', // Use bidder name if available
                amount: bid.amount,
                bidTime: bid.time,
                isHighestBid: bid.amount === highestBidAmount,
                increment: increment
            };
        });
        
        res.status(200).json({
            success: true,
            auctionId: auctionId,
            count: formattedBids.length,
            total: totalBids,
            page,
            pages: Math.ceil(totalBids / limit),
            bids: formattedBids
        });
    } catch (error) {
        console.error('Error fetching auction bids:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bids for this auction',
            error: error.message
        });
    }
};