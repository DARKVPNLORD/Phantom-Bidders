const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../../public/uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'listing-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Public routes (no authentication required)
router.get('/', listingController.getListings);
router.get('/:id', listingController.getListingById);

// Protected routes (authentication required)
router.post('/', protect, listingController.createListing);
router.patch('/:id', protect, listingController.updateListing);
router.delete('/:id', protect, listingController.deleteListing);
router.post('/:id/bid', protect, listingController.placeBid);
router.patch('/:id/visibility', protect, listingController.toggleVisibility);

// Route to handle image uploads
router.post('/uploads', protect, upload.array('images', 8), (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }
        
        // Generate URLs for uploaded files
        const uploadedFiles = files.map(file => {
            // Get file path relative to public directory
            const filePath = '/uploads/' + file.filename;
            return {
                originalname: file.originalname,
                filename: file.filename,
                url: filePath
            };
        });
        
        res.status(200).json(uploadedFiles);
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: error.message
        });
    }
});

// Seller and buyer specific routes
router.get('/seller/listings', protect, listingController.getSellerListings);
router.get('/buyer/bids', protect, listingController.getBuyerBids);
router.get('/:id/bids', protect, listingController.getAuctionBids);

module.exports = router; 