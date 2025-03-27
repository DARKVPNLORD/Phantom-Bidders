const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ListingSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['electronics', 'art', 'collectibles', 'fashion', 'home', 'jewelry', 'other']
    },
    condition: {
        type: String,
        required: true,
        enum: ['new', 'like-new', 'excellent', 'good', 'fair', 'poor']
    },
    images: [{
        type: String,
        default: '/uploads/placeholder-image1.jpg'
    }],
    pricing: {
        startingPrice: {
            type: Number,
            required: true,
            min: 1
        },
        reservePrice: {
            type: Number,
            min: 0
        },
        bidIncrement: {
            type: Number,
            required: true,
            min: 1
        },
        currentBid: {
            type: Number
        }
    },
    shippingOptions: {
        shipping: {
            type: Boolean,
            default: true
        },
        localPickup: {
            type: Boolean,
            default: false
        },
        shippingCost: {
            type: Number,
            min: 0
        }
    },
    seller: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    bids: [{
        bidder: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        bidderName: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        time: {
            type: Date,
            default: Date.now
        }
    }],
    winner: {
        bidder: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        bidderName: String,
        amount: Number,
        time: Date
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'ended', 'sold', 'cancelled'],
        default: 'active'
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 14
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
ListingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create text index for search functionality
ListingSchema.index({ 
    title: 'text', 
    description: 'text', 
    category: 'text' 
});

module.exports = mongoose.model('Listing', ListingSchema); 