// DOM Elements
const mainImage = document.getElementById('mainImage');
const thumbnailGallery = document.getElementById('thumbnailGallery');
const productTitle = document.getElementById('productTitle');
const productCategory = document.getElementById('productCategory');
const currentBid = document.getElementById('currentBid');
const startingPrice = document.getElementById('startingPrice');
const bidIncrement = document.getElementById('bidIncrement');
const totalBids = document.getElementById('totalBids');
const timeLeft = document.getElementById('timeLeft');
const sellerImage = document.getElementById('sellerImage');
const sellerName = document.getElementById('sellerName');
const productCondition = document.getElementById('productCondition');
const endDate = document.getElementById('endDate');
const productDescription = document.getElementById('productDescription');
const placeBidBtn = document.getElementById('placeBidBtn');
const errorMessage = document.getElementById('errorMessage');
const userName = document.getElementById('userName');
const profileBtn = document.querySelector('.profile-btn');
const profileDropdown = document.querySelector('.dropdown-content');

// Get auction ID from URL
const urlParams = new URLSearchParams(window.location.search);
const auctionId = urlParams.get('id');

// State
let currentAuction = null;
let currentUser = null;

// Debug mode - set to true to see more detailed logs
const DEBUG_MODE = true;

// Force test data mode - set to false to fetch real data from database
const USE_TEST_DATA = false;

// Initialize
async function initialize() {
    try {
        console.log('Initializing product detail page...');
        
        // Verify required DOM elements exist
        const container = document.querySelector('.product-detail-container');
        if (!container) {
            throw new Error('Required element with class .product-detail-container not found');
        }
        
        // Show loading state
        container.classList.add('loading');
        showError('Loading auction details...');
        
        // Setup profile dropdown functionality
        setupProfileDropdown();
        
        // Try to get user info if available
        currentUser = await checkAuthentication();
        if (currentUser && document.getElementById('userName')) {
            document.getElementById('userName').textContent = currentUser.name || currentUser.username || 'User';
        }
        
        // Check if we have an auction ID
        if (!auctionId) {
            throw new Error('No auction ID provided in URL');
        }
        
        console.log('Loading auction with ID:', auctionId);
        
        // Load auction details
        const auction = await loadAuctionDetails();
        
        if (!auction) {
            throw new Error('Failed to load auction details');
        }
        
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization error:', error);
        showError(`Error: ${error.message || 'Failed to initialize page'}`);
        
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.classList.remove('loading');
        }
    }
}

// Setup profile dropdown functionality
function setupProfileDropdown() {
    if (!profileBtn || !profileDropdown) {
        console.warn('Profile dropdown elements not found');
        return;
    }
    
    // Toggle dropdown when clicking profile button
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    // Setup logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                window.location.href = '../html/login_signup.html';
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
}

// Check authentication
async function checkAuthentication() {
    try {
        // First check local storage
        const userData = localStorage.getItem('user');
        const authToken = localStorage.getItem('authToken');
        
        if (!userData || !authToken) {
            console.log('No user data found in localStorage');
            return null;
        }
        
        try {
            const user = JSON.parse(userData);
            console.log('User authenticated from localStorage:', user.name || user.username);
            return user;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    } catch (error) {
        console.error('Authentication check error:', error);
        return null;
    }
}

// Custom implementation for getAuctionById for direct database access
async function getAuctionById(auctionId) {
    try {
        console.log('Fetching auction with ID:', auctionId);
        
        // Make a direct AJAX request to the backend API
        const API_BASE_URL = window.location.origin; // Get current domain
        
        // Server API endpoint based on route definitions in server.js and auctionRoutes.js
        const endpoint = `/api/auctions/${auctionId}`;
        const url = `${API_BASE_URL}${endpoint}`;
        
        console.log(`Attempting to fetch auction data from: ${url}`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                }
            });
            
            console.log(`Server response:`, response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Auction not found. Please check the auction ID.');
                } else {
                    const errorText = await response.text();
                    throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
                }
            }
            
            const data = await response.json();
            
            // Debug logging
            if (DEBUG_MODE) {
                console.log('Raw response data:', data);
            }
            
            // The server returns data in the format { success: true, listing: {...} }
            // We need to extract the actual listing data
            if (data.success && data.listing) {
                console.log('Successfully retrieved auction data from server');
                return data.listing;
            } else if (data.listing) {
                return data.listing;
            } else if (typeof data === 'object' && !Array.isArray(data)) {
                // If the response is an object but doesn't have the expected structure,
                // try to use it directly
                return data;
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    } catch (error) {
        console.error('Error fetching auction by ID:', error);
        throw error;
    }
}

// Create a dummy function but don't use it
function createTestAuctionData(auctionId) {
    console.warn('Test data function called but not used');
    return null;
}

/**
 * Loads auction details from the API
 */
async function loadAuctionDetails() {
    try {
        console.log('Loading auction details for ID:', auctionId);
        
        if (!auctionId) {
            throw new Error('No auction ID provided');
        }
        
        // Construct API URL
        const apiUrl = `${window.location.origin}/api/auctions/${auctionId}`;
        console.log('Fetching auction data from:', apiUrl);
        
        // Fetch auction data from API
        let response;
        try {
            response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                }
            });
            
            // Log response status
            console.log('API response status:', response.status);
        } catch (fetchError) {
            console.error('Network error when fetching auction:', fetchError);
            throw new Error(`Network error: ${fetchError.message}. Please check your connection and try again.`);
        }
        
        // Check for error response
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Auction with ID ${auctionId} not found. It may have been removed or never existed.`);
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('You are not authorized to view this auction. Please log in and try again.');
            } else {
                throw new Error(`Server error (${response.status}): ${response.statusText}`);
            }
        }
        
        // Parse response data
        let data;
        try {
            data = await response.json();
            console.log('Raw auction data:', data);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            throw new Error('Invalid data received from server. Please try again later.');
        }
        
        // Extract the auction data from the response
        let auctionData = null;
        
        if (data.success && data.listing) {
            auctionData = data.listing;
        } else if (data.listing) {
            auctionData = data.listing;
        } else if (data.auction) {
            auctionData = data.auction;
        } else if (data.data) {
            auctionData = data.data;
        } else if (typeof data === 'object' && !Array.isArray(data)) {
            auctionData = data;
        }
        
        // Ensure we have valid auction data
        if (!auctionData) {
            throw new Error('No valid auction data found in API response');
        }
        
        // Normalize auction data to ensure consistent structure
        const normalizedAuction = normalizeAuctionData(auctionData);
        
        // Update current auction
        currentAuction = normalizedAuction;
        
        // Update UI with auction data
        updateAuctionUI(normalizedAuction);
        
        return normalizedAuction;
    } catch (error) {
        console.error('Error loading auction details:', error);
        
        // Show error message
        showErrorMessage(`Failed to load auction: ${error.message}`);
        
        // Remove loading state
        document.querySelector('.product-detail-container')?.classList.remove('loading');
        
        return null;
    }
}

// Normalize auction data to ensure consistent structure
function normalizeAuctionData(rawData) {
    // Basic validation to avoid errors
    if (!rawData || typeof rawData !== 'object') {
        console.error('Invalid auction data received:', rawData);
        return createDefaultAuction();
    }
    
    console.log('Raw MongoDB data to normalize:', rawData);
    
    // Make a deep copy to avoid modifying the original data
    let normalized;
    try {
        normalized = JSON.parse(JSON.stringify(rawData));
    } catch (error) {
        console.error('Failed to clone raw data:', error);
        normalized = { ...rawData }; // Fallback to shallow copy
    }
    
    try {
        // Map fields according to the Listing model schema
        normalized.id = rawData._id || rawData.id || auctionId;
        normalized.title = rawData.title || 'Unnamed Item';
        normalized.description = rawData.description || '';
        normalized.category = rawData.category || 'Uncategorized';
        normalized.condition = rawData.condition || 'Not specified';
        
        // Handle pricing according to the Listing model schema
        if (rawData.pricing) {
            normalized.startPrice = parseFloat(rawData.pricing.startingPrice || 0);
            normalized.bidIncrement = parseFloat(rawData.pricing.bidIncrement || 100);
            
            // Use current bid from pricing object if available
            if (rawData.pricing.currentBid) {
                normalized.currentBid = parseFloat(rawData.pricing.currentBid);
            } else {
                normalized.currentBid = normalized.startPrice;
            }
        } else {
            // Fallback if pricing object isn't available
            normalized.startPrice = parseFloat(rawData.startingPrice || 0);
            normalized.currentBid = parseFloat(rawData.currentBid || rawData.startingPrice || 0);
            normalized.bidIncrement = parseFloat(rawData.bidIncrement || 100);
        }
        
        // Total bids from the bids array
        normalized.totalBids = Array.isArray(rawData.bids) ? rawData.bids.length : 0;
        
        // End date handling - use the endDate field directly from the model
        normalized.endDate = rawData.endDate;
        
        // Images array handling - directly from the model
        if (Array.isArray(rawData.images) && rawData.images.length > 0) {
            normalized.images = rawData.images;
        } else if (typeof rawData.images === 'string') {
            normalized.images = [rawData.images];
        } else {
            normalized.images = ["../assets/placeholder.png"];
        }
        
        // Seller information - directly from the model
        if (rawData.seller && typeof rawData.seller === 'object') {
            normalized.seller = {
                id: rawData.seller.id || rawData.seller._id || 'unknown',
                name: rawData.seller.name || 'Unknown Seller',
                image: rawData.seller.image || "../assets/placeholder.png"
            };
        } else {
            normalized.seller = {
                id: 'unknown',
                name: 'Unknown Seller',
                image: "../assets/placeholder.png"
            };
        }
        
        // Ensure all fields are valid
        ensureValidAuctionFields(normalized);
        
        console.log('Normalized auction data:', normalized);
        return normalized;
    } catch (error) {
        console.error('Error normalizing MongoDB data:', error);
        return createDefaultAuction();
    }
}

// Create a default auction object when normalization fails
function createDefaultAuction() {
    return {
        id: auctionId || 'unknown',
        title: 'Auction Item',
        description: 'No description available',
        startPrice: 0,
        currentBid: 0,
        bidIncrement: 100,
        totalBids: 0,
        condition: 'Not specified',
        category: 'Uncategorized',
        endDate: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        images: ["../assets/placeholder.png"],
        seller: {
            id: 'unknown',
            name: 'Unknown Seller',
            image: "../assets/placeholder.png"
        }
    };
}

// Ensure all required fields are present
function ensureValidAuctionFields(auction) {
    if (!auction.id) auction.id = auctionId || 'unknown';
    if (!auction.title) auction.title = 'Auction Item';
    if (!auction.description) auction.description = 'No description available';
    if (isNaN(auction.startPrice)) auction.startPrice = 0;
    if (isNaN(auction.currentBid)) auction.currentBid = 0;
    if (isNaN(auction.bidIncrement)) auction.bidIncrement = 100;
    if (isNaN(auction.totalBids)) auction.totalBids = 0;
    if (!auction.condition) auction.condition = 'Not specified';
    if (!auction.category) auction.category = 'Uncategorized';
    
    // Ensure endDate is a valid date
    try {
        new Date(auction.endDate).toISOString();
    } catch (e) {
        auction.endDate = new Date(Date.now() + 86400000).toISOString(); // 1 day from now
    }
    
    // Ensure images is an array
    if (!Array.isArray(auction.images) || auction.images.length === 0) {
        auction.images = ["../assets/placeholder.png"];
    }
    
    // Ensure seller exists
    if (!auction.seller || typeof auction.seller !== 'object') {
        auction.seller = {
            id: 'unknown',
            name: 'Unknown Seller',
            image: "../assets/placeholder.png"
        };
    }
}

/**
 * Updates the UI with auction details
 * @param {Object} auction - The normalized auction object
 */
function updateAuctionUI(auction) {
    try {
        console.log("Updating UI with auction data:", auction);
        
        // Update product title and description
        const productTitleElem = document.getElementById('productTitle');
        if (productTitleElem) {
            productTitleElem.textContent = auction.title || 'Unknown Product';
        }
        
        const productDescriptionElem = document.getElementById('productDescription');
        if (productDescriptionElem) {
            productDescriptionElem.textContent = auction.description || 'No description available';
        }
        
        // Update category
        const productCategoryElem = document.getElementById('productCategory');
        if (productCategoryElem) {
            productCategoryElem.textContent = auction.category || 'Uncategorized';
        }
        
        // Update pricing information - ensure we're formatting currency properly
        const currentBidElem = document.getElementById('currentBid');
        if (currentBidElem) {
            currentBidElem.textContent = formatCurrency(auction.currentBid);
        }
        
        const startingPriceElem = document.getElementById('startingPrice');
        if (startingPriceElem) {
            startingPriceElem.textContent = formatCurrency(auction.startPrice);
        }
        
        const bidIncrementElem = document.getElementById('bidIncrement');
        if (bidIncrementElem) {
            bidIncrementElem.textContent = formatCurrency(auction.bidIncrement);
        }
        
        // Update total bids
        const totalBidsElem = document.getElementById('totalBids');
        if (totalBidsElem) {
            totalBidsElem.textContent = auction.totalBids || 0;
        }
        
        // Update condition
        const productConditionElem = document.getElementById('productCondition');
        if (productConditionElem) {
            productConditionElem.textContent = auction.condition || 'Not specified';
        }
        
        // Update end date
        const endDateElem = document.getElementById('endDate');
        if (endDateElem) {
            const endDate = auction.endDate ? new Date(auction.endDate) : new Date();
            endDateElem.textContent = formatDate(endDate);
            
            // Start countdown if timeLeft element exists
            const timeLeftElem = document.getElementById('timeLeft');
            if (timeLeftElem) {
                startCountdown(endDate);
            }
        }
        
        // Update seller info
        if (auction.seller) {
            const sellerNameElem = document.getElementById('sellerName');
            if (sellerNameElem) {
                sellerNameElem.textContent = auction.seller.name || 'Unknown Seller';
            }
            
            // Update seller image if available
            const sellerImageElem = document.getElementById('sellerImage');
            if (sellerImageElem) {
                if (auction.seller.image) {
                    sellerImageElem.src = getImageUrl(auction.seller.image);
                    sellerImageElem.alt = auction.seller.name || 'Seller';
                } else if (auction.seller.imageUrl) {
                    sellerImageElem.src = getImageUrl(auction.seller.imageUrl);
                    sellerImageElem.alt = auction.seller.name || 'Seller';
                }
            }
        }
        
        // Update main product image and thumbnails
        updateProductImages(auction);
        
        // Update place bid button
        const placeBidBtn = document.getElementById('placeBidBtn');
        if (placeBidBtn) {
            // Set the correct URL with auction ID
            const auctionId = auction._id || auction.id;
            placeBidBtn.href = `../html/place_bid.html?id=${auctionId}`;
        }
        
        // Hide loading state
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.classList.remove('loading');
        }
        
        // Hide error message
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
        
    } catch (error) {
        console.error("Error updating UI:", error);
        showErrorMessage("Failed to display auction details: " + error.message);
    }
}

// Helper function to format currency
function formatCurrency(amount) {
    // Convert to number if it's a string
    if (typeof amount === 'string') {
        amount = parseFloat(amount);
    }
    
    // Check for null, undefined, NaN, or zero 
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
        return '₹0.00';
    }
    
    // Format with two decimal places and commas for thousands
    return '₹' + formatNumber(amount);
}

// Helper function to format numbers with commas
function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
        return '0.00';
    }
    
    // Convert to number if it's a string
    if (typeof number === 'string') {
        number = parseFloat(number);
    }
    
    // Format with two decimal places
    const withDecimals = number.toFixed(2);
    
    // Add commas for thousands
    return withDecimals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to ensure image URLs are properly formatted
function getImageUrl(imagePath) {
    if (!imagePath) return '../assets/placeholder.png';
    
    // If it's already an absolute URL (starts with http or https), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // If it starts with /uploads/, add the base URL 
    if (imagePath.startsWith('/uploads/')) {
        return `${window.location.origin}${imagePath}`;
    }
    
    // If it's just a filename without path, assume it's in the uploads directory
    if (!imagePath.includes('/')) {
        return `${window.location.origin}/uploads/${imagePath}`;
    }
    
    // If it's a relative path without leading slash, add the leading slash
    if (!imagePath.startsWith('/') && imagePath.includes('/')) {
        return `${window.location.origin}/${imagePath}`;
    }
    
    // If it has a leading slash but not /uploads/, add the origin
    if (imagePath.startsWith('/') && !imagePath.startsWith('/uploads/')) {
        return `${window.location.origin}${imagePath}`;
    }
    
    // Otherwise return as is, but log a warning
    console.warn('Unexpected image path format:', imagePath);
    return imagePath;
}

// Function to update product images
function updateProductImages(auction) {
    try {
        const mainImage = document.getElementById('mainImage');
        const thumbnailGallery = document.getElementById('thumbnailGallery');
        
        if (!mainImage) {
            console.warn('Main image element not found');
            return;
        }
        
        // Get images array, ensuring it's always an array
        let images = [];
        
        if (auction.images && Array.isArray(auction.images)) {
            images = auction.images;
        } else if (auction.images && typeof auction.images === 'string') {
            // Handle case where images might be a single string
            images = [auction.images];
        } else if (auction.imageUrl) {
            // Handle case where image might be in imageUrl property
            images = [auction.imageUrl];
        } else if (auction.image) {
            // Handle case where image might be in image property
            images = [auction.image];
        }
        
        // Process each image through getImageUrl to ensure proper formatting
        images = images.map(img => getImageUrl(img));
        
        // Set main image
        if (images.length > 0) {
            mainImage.src = images[0];
            mainImage.alt = auction.title || 'Product image';
            console.log('Setting main image to:', images[0]);
        } else {
            // Use placeholder if no images available
            mainImage.src = '../assets/placeholder.png';
            mainImage.alt = 'No image available';
            console.log('No images available, using placeholder');
        }
        
        // Update thumbnails if gallery exists
        if (thumbnailGallery && images.length > 1) {
            // Clear existing thumbnails
            thumbnailGallery.innerHTML = '';
            
            // Add thumbnails
            images.forEach((image, index) => {
                const thumbnail = document.createElement('div');
                thumbnail.className = 'thumbnail';
                thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}">`;
                
                // Add active class to first thumbnail
                if (index === 0) {
                    thumbnail.classList.add('active');
                }
                
                // Add click event to switch main image
                thumbnail.addEventListener('click', () => {
                    // Update main image
                    mainImage.src = image;
                    
                    // Update active thumbnail
                    document.querySelectorAll('.thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                });
                
                thumbnailGallery.appendChild(thumbnail);
            });
        } else if (thumbnailGallery) {
            // Hide thumbnail gallery if no images or only one image
            thumbnailGallery.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating product images:', error);
    }
}

// Function to setup bid form
function setupBidForm(auction) {
    const bidForm = document.getElementById('bid-form');
    const placeBidBtn = document.getElementById('place-bid-btn');
    
    if (!bidForm) {
        console.warn('Bid form not found');
        return;
    }
    
    // Set auction ID in form
    const auctionIdInput = bidForm.querySelector('input[name="auction_id"]');
    if (auctionIdInput) {
        auctionIdInput.value = auction._id || auction.id;
    }
    
    // Calculate minimum bid amount
    const minBid = calculateMinimumBid(auction);
    
    // Update minimum bid input if it exists
    const bidAmountInput = bidForm.querySelector('input[name="bid_amount"]');
    if (bidAmountInput) {
        bidAmountInput.min = minBid;
        bidAmountInput.placeholder = `Min bid: ${formatCurrency(minBid)}`;
    }
    
    // Update place bid button
    if (placeBidBtn) {
        placeBidBtn.disabled = false;
        placeBidBtn.textContent = `Place Bid (min ${formatCurrency(minBid)})`;
    }
}

// Calculate minimum bid amount based on current bid and increment
function calculateMinimumBid(auction) {
    let currentBid = parseFloat(auction.currentBid || 0);
    let bidIncrement = parseFloat(auction.bidIncrement || 1);
    let startPrice = parseFloat(auction.startPrice || 0);
    
    // If no bids yet, minimum bid is the starting price
    if (currentBid === 0 || isNaN(currentBid)) {
        return startPrice;
    }
    
    // Otherwise, it's current bid + increment
    return currentBid + bidIncrement;
}

// Show error message function
function showErrorMessage(message) {
    try {
        console.error(message);
        
        const errorElem = document.getElementById('errorMessage');
        if (!errorElem) {
            console.error('Error message element not found in DOM');
            alert(`Error: ${message}`);
            return;
        }
        
        // Check if message contains HTML
        if (message.includes('<') && message.includes('>')) {
            errorElem.innerHTML = message;
        } else {
            // Add an icon and format the message
            errorElem.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <span>${message}</span>
            `;
        }
        
        // Show the error message
        errorElem.style.display = 'block';
        
        // Scroll to the error message
        errorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Hide loading indicators if they exist
        const container = document.querySelector('.product-detail-container');
        if (container) {
            container.classList.remove('loading');
        }
        
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    } catch (error) {
        // Fallback if the function itself errors
        console.error('Error in showErrorMessage function:', error);
        console.error('Original message:', message);
        alert(`Error: ${message}`);
    }
}

/**
 * Starts the countdown timer for the auction
 * @param {string|Date} endDateStr - The end date of the auction
 */
function startCountdown(endDateStr) {
    // Safely get the timeLeft element
    if (!timeLeft) {
        console.error('Time left element not found');
        return;
    }
    
    console.log('Starting countdown for end date:', endDateStr);
    
    // Parse end date
    const endDate = new Date(endDateStr);
    
    // Clear any existing interval
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }
    
    // Function to update countdown
    const updateCountdown = () => {
        try {
            const now = new Date();
            const timeDiff = endDate - now;
            
            // Check if auction has ended
            if (timeDiff <= 0) {
                timeLeft.textContent = 'Auction Ended';
                timeLeft.classList.add('urgent');
                
                // Disable bid button
                if (placeBidBtn) {
                    placeBidBtn.disabled = true;
                    placeBidBtn.classList.add('disabled');
                }
                
                // Clear interval
                clearInterval(window.countdownInterval);
                return;
            }
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            // Format countdown string
            let countdownStr = '';
            if (days > 0) {
                countdownStr += `${days}d `;
            }
            countdownStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update UI
            timeLeft.textContent = countdownStr;
            
            // Add urgent class if less than 1 hour left
            if (timeDiff < 60 * 60 * 1000) {
                timeLeft.classList.add('urgent');
            } else {
                timeLeft.classList.remove('urgent');
            }
        } catch (error) {
            console.error('Error updating countdown:', error);
            clearInterval(window.countdownInterval);
        }
    };
    
    // Update initially
    updateCountdown();
    
    // Set interval to update every second
    window.countdownInterval = setInterval(updateCountdown, 1000);
}

// Utility Functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', dateString);
            return 'Date not available';
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date not available';
    }
}

function showError(message) {
    console.error(message);
    const errorElem = document.getElementById('errorMessage');
    if (errorElem) {
        errorElem.textContent = message;
        errorElem.style.display = 'block';
    }
}

// Get current user ID
function getCurrentUserId() {
    try {
        if (currentUser && (currentUser._id || currentUser.id)) {
            return currentUser._id || currentUser.id;
        }
        return null;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
}

/**
 * Toggles an auction in the user's watchlist
 * @param {string} auctionId - The ID of the auction to toggle
 */
function toggleWatchAuction(auctionId) {
    try {
        const watchBtn = document.getElementById('watch-auction-btn');
        if (!watchBtn) return;
        
        // Get current watchlist from localStorage
        const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
        
        // Check if auction is already in watchlist
        const index = watchlist.indexOf(auctionId);
        
        if (index === -1) {
            // Add to watchlist
            watchlist.push(auctionId);
            watchBtn.innerHTML = '<i class="fas fa-heart"></i> Watching';
            watchBtn.classList.add('watching');
            
            // Show toast notification
            showNotification('Auction added to watchlist');
        } else {
            // Remove from watchlist
            watchlist.splice(index, 1);
            watchBtn.innerHTML = '<i class="far fa-heart"></i> Watch';
            watchBtn.classList.remove('watching');
            
            // Show toast notification
            showNotification('Auction removed from watchlist');
        }
        
        // Save updated watchlist
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        
        // Update API if user is logged in
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            // This would typically be an API call
            console.log('Would update watchlist on server for user');
        }
    } catch (error) {
        console.error('Error toggling watchlist:', error);
        showNotification('Error updating watchlist', 'error');
    }
}

/**
 * Shows a notification toast
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    // Set content and type
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Start countdown timer for auction end date
function updateCountdown(endDate) {
    if (!endDate) {
        console.error('No end date provided for countdown');
        return;
    }
    
    const timeLeftElement = document.getElementById('time-left');
    if (!timeLeftElement) {
        console.warn('Time left element not found');
        return;
    }
    
    // Clear any existing interval
    if (window.countdownInterval) {
        clearInterval(window.countdownInterval);
    }
    
    // Function to update the countdown
    const updateTime = () => {
        try {
            // Calculate time difference
            const now = new Date();
            const auctionEndTime = new Date(endDate);
            const timeDiff = auctionEndTime - now;
            
            // If auction has ended
            if (timeDiff <= 0) {
                timeLeftElement.textContent = 'Auction ended';
                timeLeftElement.classList.add('ended');
                clearInterval(window.countdownInterval);
                return;
            }
            
            // Calculate days, hours, minutes, seconds
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
            
            // Format countdown string
            let countdownStr = '';
            if (days > 0) {
                countdownStr += `${days}d `;
            }
            countdownStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update UI
            timeLeftElement.textContent = countdownStr;
            
            // Add urgent class if less than 1 hour left
            if (timeDiff < 60 * 60 * 1000) {
                timeLeftElement.classList.add('urgent');
            } else {
                timeLeftElement.classList.remove('urgent');
            }
        } catch (error) {
            console.error('Error updating countdown:', error);
            clearInterval(window.countdownInterval);
        }
    };
    
    // Update immediately
    updateTime();
    
    // Update every second
    window.countdownInterval = setInterval(updateTime, 1000);
}

// Add event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing product detail page');
    
    // Check if the container exists using class selector
    const container = document.querySelector('.product-detail-container');
    if (!container) {
        console.error('Missing required element: .product-detail-container');
        alert('Page error: Missing required container element');
        return;
    }
    
    // Check if error message element exists
    const errorMessageElement = document.getElementById('errorMessage');
    if (!errorMessageElement) {
        console.error('Missing required element: #errorMessage');
        alert('Page error: Missing error message element');
        return;
    }
    
    // Initialize the page
    initialize().catch(error => {
        console.error('Uncaught initialization error:', error);
        showError(`Critical error: ${error.message}`);
    });
}); 