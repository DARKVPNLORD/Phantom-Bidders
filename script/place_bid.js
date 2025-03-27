document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const backToListingBtn = document.getElementById('back-to-listing');
    const bidForm = document.getElementById('bid-form');
    const bidAmountInput = document.getElementById('bid-amount');
    const decreaseBidBtn = document.getElementById('decrease-bid');
    const increaseBidBtn = document.getElementById('increase-bid');
    const bidValidation = document.getElementById('bid-validation');
    const cancelBidBtn = document.getElementById('cancel-bid');
    const submitBidBtn = document.getElementById('submit-bid');
    const bidConfirmation = document.getElementById('bid-confirmation');
    const bidError = document.getElementById('bid-error');
    const errorMessage = document.getElementById('error-message');
    const tryAgainBtn = document.getElementById('try-again-btn');
    
    // Item details elements
    const itemImage = document.getElementById('item-image');
    const itemTitle = document.getElementById('item-title');
    const currentBidElement = document.getElementById('current-bid');
    const minimumBidElement = document.getElementById('minimum-bid');
    const bidIncrementElement = document.getElementById('bid-increment');
    const timeLeftElement = document.getElementById('time-left');
    
    // Variables to store auction data
    let auctionId;
    let currentBid = 0;
    let minimumBid = 0;
    let bidIncrement = 0;
    let endDate;
    let auctionData;
    let redirectUrl;
    
    // Get auction ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    auctionId = urlParams.get('id');
    
    if (!auctionId) {
        // No auction ID provided, redirect to browse
        window.location.href = 'browse_auctions.html';
    }
    
    // Load auction data
    loadAuction();
    
    // Set up the back button to return to the auction
    backToListingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = `browse_auctions.html`;
        }
    });
    
    // Bid adjustment buttons
    decreaseBidBtn.addEventListener('click', function() {
        let currentValue = parseInt(bidAmountInput.value) || minimumBid;
        if (currentValue > minimumBid) {
            bidAmountInput.value = currentValue - bidIncrement;
            validateBidAmount();
        }
    });
    
    increaseBidBtn.addEventListener('click', function() {
        let currentValue = parseInt(bidAmountInput.value) || minimumBid;
        bidAmountInput.value = currentValue + bidIncrement;
        validateBidAmount();
    });
    
    // Validate bid on input change
    bidAmountInput.addEventListener('input', validateBidAmount);
    
    // Cancel button
    cancelBidBtn.addEventListener('click', function() {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = `browse_auctions.html`;
        }
    });
    
    // Try again button
    tryAgainBtn.addEventListener('click', function() {
        hideBidError();
    });
    
    // Form submission
    bidForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateBidAmount()) {
            placeBid();
        }
    });
    
    // Load auction data from the API
    async function loadAuction() {
        try {
            // Show loading state
            itemTitle.textContent = 'Loading...';
            currentBidElement.textContent = '₹0';
            minimumBidElement.textContent = '₹0';
            bidIncrementElement.textContent = '₹0';
            timeLeftElement.textContent = '--:--:--';
            
            // Try to get the redirect URL from referrer
            if (document.referrer) {
                const referrer = new URL(document.referrer);
                if (referrer.pathname.includes('product_detail.html') || 
                    referrer.pathname.includes('browse_auctions.html')) {
                    redirectUrl = document.referrer;
                }
            }
            
            console.log(`Loading auction details for ID: ${auctionId}`);
            
            // Fetch auction data with direct API call to ensure fresh data
            const apiUrl = `${window.location.origin}/api/auctions/${auctionId}`;
            
            // Make the request with auth token
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Server error: ${response.status}`);
            }
            
            // Parse response data
            const responseData = await response.json();
            console.log('Auction data received:', responseData);
            
            // Extract the auction data from the response structure
            let auctionData = null;
            
            if (responseData.success && responseData.listing) {
                auctionData = responseData.listing;
            } else if (responseData.listing) {
                auctionData = responseData.listing;
            } else if (responseData.auction) {
                auctionData = responseData.auction;
            } else if (typeof responseData === 'object' && !Array.isArray(responseData)) {
                auctionData = responseData;
            }
            
            if (!auctionData) {
                throw new Error('Auction not found or invalid data format');
            }
            
            // Validate required fields
            if (!auctionData.title) {
                throw new Error('Invalid auction data: Missing title');
            }
            
            // Check if auction is active (check different status fields)
            let isActive = true;
            if (auctionData.status && auctionData.status !== 'active') {
                isActive = false;
            }
            
            if (!isActive) {
                throw new Error('This auction is no longer active');
            }
            
            // Check end date from different possible fields
            let endDateTime;
            if (auctionData.endDate) {
                endDateTime = new Date(auctionData.endDate);
            } else if (auctionData.end_date) {
                endDateTime = new Date(auctionData.end_date);
            } else if (auctionData.endTime) {
                endDateTime = new Date(auctionData.endTime);
            }
            
            // Check if auction has ended
            if (endDateTime && endDateTime < new Date()) {
                console.log('End date comparison:', {
                    endDateTime: endDateTime.toISOString(),
                    currentTime: new Date().toISOString()
                });
                
                // Add a buffer of 2 minutes to account for clock differences
                const bufferTime = 2 * 60 * 1000; // 2 minutes in milliseconds
                if (endDateTime.getTime() + bufferTime < new Date().getTime()) {
                    throw new Error('This auction has ended');
                }
            }
            
            // Store auction data globally
            auctionData = normalizeAuctionData(auctionData);
            
            // Update UI with auction data
            updateAuctionDisplay(auctionData);
            
            // Start countdown timer
            startCountdown();
            
            // Set up real-time updates
            setupRealtimeUpdates();
        } catch (error) {
            console.error('Error loading auction:', error);
            showError(error.message || 'Failed to load auction details');
            disableBidForm();
        }
    }
    
    // Normalize auction data to consistent format
    function normalizeAuctionData(data) {
        // Create a result object with defaults
        const result = {
            id: data._id || data.id || auctionId,
            title: data.title || 'Unknown Item',
            description: data.description || 'No description available',
            images: [],
            status: data.status || 'active',
            endDate: null,
            currentBid: 0,
            startPrice: 0,
            bidIncrement: 100
        };
        
        // Handle images
        if (data.images) {
            if (Array.isArray(data.images)) {
                result.images = data.images;
            } else if (typeof data.images === 'string') {
                result.images = [data.images];
            }
        } else if (data.image) {
            if (typeof data.image === 'string') {
                result.images = [data.image];
            }
        } else if (data.imageUrl) {
            result.images = [data.imageUrl];
        }
        
        if (result.images.length === 0) {
            result.images = ['../assets/placeholder.png'];
        }
        
        // Get end date
        if (data.endDate) {
            result.endDate = new Date(data.endDate);
        } else if (data.end_date) {
            result.endDate = new Date(data.end_date);
        } else if (data.endTime) {
            result.endDate = new Date(data.endTime);
        } else {
            // Default: 1 day from now
            result.endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        
        // Handle pricing from MongoDB structure
        if (data.pricing && typeof data.pricing === 'object') {
            // MongoDB schema
            result.startPrice = parseFloat(data.pricing.startingPrice || 0);
            result.currentBid = parseFloat(data.pricing.currentBid || result.startPrice);
            result.bidIncrement = parseFloat(data.pricing.bidIncrement || 100);
        } else {
            // Direct fields
            result.startPrice = parseFloat(data.startPrice || data.startingPrice || 0);
            result.currentBid = parseFloat(data.currentBid || result.startPrice);
            result.bidIncrement = parseFloat(data.bidIncrement || 100);
        }
        
        return result;
    }
    
    // Update auction display with data
    function updateAuctionDisplay(auction) {
        try {
            if (!auction) {
                throw new Error('Invalid auction data');
            }

            console.log('Updating UI with auction data:', auction);

            // Set item details
            if (auction.images && auction.images.length > 0) {
                itemImage.src = auction.images[0];
            } else {
                itemImage.src = '../assets/placeholder.png';
            }
            
            itemImage.alt = auction.title;
            itemTitle.textContent = auction.title || 'Untitled Auction';
            
            // Set bid information
            currentBid = parseFloat(auction.currentBid || 0);
            minimumBid = currentBid + parseFloat(auction.bidIncrement || 100);
            bidIncrement = parseFloat(auction.bidIncrement || 100);
            
            // Update display with proper formatting
            currentBidElement.textContent = formatCurrency(currentBid);
            minimumBidElement.textContent = formatCurrency(minimumBid);
            bidIncrementElement.textContent = formatCurrency(bidIncrement);
            
            // Set bid amount input
            bidAmountInput.value = minimumBid;
            bidAmountInput.min = minimumBid;
            bidAmountInput.step = bidIncrement;
            
            // Set end date
            if (auction.endDate) {
                endDate = new Date(auction.endDate);
            } else {
                throw new Error('Auction end date not specified');
            }
            
            // Enable form
            enableBidForm();
            
            // Update time left
            updateTimeLeft();
        } catch (error) {
            console.error('Error updating auction display:', error);
            showError(error.message || 'Failed to update auction display');
            disableBidForm();
        }
    }
    
    // Format currency with rupee symbol
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
    
    // Validate bid amount
    function validateBidAmount() {
        const bidAmount = parseInt(bidAmountInput.value);
        
        if (!bidAmount || isNaN(bidAmount)) {
            bidValidation.textContent = 'Please enter a valid bid amount';
            return false;
        }
        
        if (bidAmount < minimumBid) {
            bidValidation.textContent = `Bid must be at least ₹${formatCurrency(minimumBid)}`;
            return false;
        }
        
        // Check if bid is a multiple of the increment
        const remainder = (bidAmount - currentBid) % bidIncrement;
        if (remainder !== 0) {
            bidValidation.textContent = `Bid must be in increments of ₹${formatCurrency(bidIncrement)}`;
            return false;
        }
        
        // Valid bid
        bidValidation.textContent = '';
        return true;
    }
    
    // Place a bid
    async function placeBid() {
        const bidAmount = parseInt(bidAmountInput.value);
        
        // Disable form during submission
        disableBidForm();
        
        try {
            // Check if auction is still active
            const updatedAuction = await getAuctionById(auctionId);
            if (!updatedAuction) {
                throw new Error('Auction not found');
            }
            
            // Check auction status - it could be in different properties depending on API structure
            const status = updatedAuction.status || 'active';
            if (status !== 'active') {
                throw new Error('This auction is no longer active');
            }
            
            // Check if auction has ended
            if (updatedAuction.endDate) {
                const auctionEndDate = new Date(updatedAuction.endDate);
                const now = new Date();
                // Add a 2-minute buffer to account for clock differences
                const bufferTime = 2 * 60 * 1000; // 2 minutes in milliseconds
                
                console.log('Checking if auction has ended:', {
                    auctionEndDate: auctionEndDate.toISOString(),
                    currentTime: now.toISOString(),
                    timeDifference: auctionEndDate.getTime() - now.getTime()
                });
                
                if (auctionEndDate.getTime() + bufferTime < now.getTime()) {
                    throw new Error('This auction has ended');
                }
            }
            
            // Extract current bid from MongoDB structure
            let currentHighestBid = 0;
            if (updatedAuction.pricing && updatedAuction.pricing.currentBid) {
                currentHighestBid = parseFloat(updatedAuction.pricing.currentBid);
            } else if (updatedAuction.currentBid) {
                currentHighestBid = parseFloat(updatedAuction.currentBid);
            } else if (updatedAuction.pricing && updatedAuction.pricing.startingPrice) {
                currentHighestBid = parseFloat(updatedAuction.pricing.startingPrice);
            } else if (updatedAuction.startPrice) {
                currentHighestBid = parseFloat(updatedAuction.startPrice);
            }
            
            // Extract bid increment from MongoDB structure
            let bidIncrementAmount = 100;  // Default increment
            if (updatedAuction.pricing && updatedAuction.pricing.bidIncrement) {
                bidIncrementAmount = parseFloat(updatedAuction.pricing.bidIncrement);
            } else if (updatedAuction.bidIncrement) {
                bidIncrementAmount = parseFloat(updatedAuction.bidIncrement);
            }
            
            // Calculate minimum bid
            const minBid = currentHighestBid + bidIncrementAmount;
            
            // Check if bid amount is still valid
            if (bidAmount < minBid) {
                throw new Error(`Bid must be at least ₹${formatCurrency(minBid)}`);
            }
            
            console.log(`Placing bid of ₹${bidAmount} on auction ${auctionId}`);
            
            // Place the bid using the API function (avoiding name collision)
            const response = await submitBidToAPI(auctionId, bidAmount);
            
            console.log('Bid response:', response);
            
            // Show success message
            showBidConfirmation();
            
            // Update UI with new bid
            currentBidElement.textContent = formatCurrency(bidAmount);
            minimumBidElement.textContent = formatCurrency(bidAmount + bidIncrementAmount);
        } catch (error) {
            console.error('Error placing bid:', error);
            showError(error.message || 'Unable to place bid. Please try again.');
        } finally {
            // Re-enable form
            enableBidForm();
        }
    }
    
    // Show error message
    function showError(message) {
        bidError.style.display = 'block';
        errorMessage.textContent = message;
        bidConfirmation.style.display = 'none';
        
        // Update UI to show error state
        itemTitle.textContent = 'Error Loading Auction';
        currentBidElement.textContent = '--';
        minimumBidElement.textContent = '--';
        bidIncrementElement.textContent = '--';
        timeLeftElement.textContent = '--:--:--';
    }
    
    // Disable bid form
    function disableBidForm() {
        bidForm.classList.add('disabled');
        submitBidBtn.disabled = true;
        bidAmountInput.disabled = true;
        decreaseBidBtn.disabled = true;
        increaseBidBtn.disabled = true;
    }
    
    // Enable bid form
    function enableBidForm() {
        bidForm.classList.remove('disabled');
        submitBidBtn.disabled = false;
        bidAmountInput.disabled = false;
        decreaseBidBtn.disabled = false;
        increaseBidBtn.disabled = false;
    }
    
    // Show bid confirmation
    function showBidConfirmation() {
        bidConfirmation.classList.remove('hidden');
    }
    
    // Hide bid error
    function hideBidError() {
        bidError.classList.add('hidden');
    }
    
    // Start countdown timer
    function startCountdown() {
        // Update immediately
        updateTimeLeft();
        
        // Then update every second
        setInterval(updateTimeLeft, 1000);
    }
    
    // Update time left display
    function updateTimeLeft() {
        if (!endDate) {
            console.error('End date not set');
            timeLeftElement.textContent = 'Time unavailable';
            return;
        }
        
        console.log('Calculating time left with end date:', endDate.toISOString());
        const now = new Date();
        let timeLeftMs = endDate - now;
        
        // Add a small buffer (30 seconds) to account for minor clock differences
        const bufferTime = 30 * 1000; // 30 seconds in milliseconds
        
        if (timeLeftMs <= -bufferTime) {
            // Auction has definitely ended (more than buffer time has passed)
            console.log('Auction ended. Time difference:', timeLeftMs);
            timeLeftElement.textContent = 'Auction Ended';
            timeLeftElement.classList.add('urgent');
            
            // Disable bidding if auction has ended
            disableBidForm();
            bidValidation.textContent = 'This auction has ended';
            return;
        } else if (timeLeftMs <= 0) {
            // Within buffer zone - show "Ending now" instead of ended
            console.log('Auction ending. Time difference:', timeLeftMs);
            timeLeftElement.textContent = 'Ending now';
            timeLeftElement.classList.add('urgent');
            return;
        }
        
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
        timeLeftMs -= days * (1000 * 60 * 60 * 24);
        
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        timeLeftMs -= hours * (1000 * 60 * 60);
        
        const minutes = Math.floor(timeLeftMs / (1000 * 60));
        timeLeftMs -= minutes * (1000 * 60);
        
        const seconds = Math.floor(timeLeftMs / 1000);
        
        // Format time left
        let timeLeftText = '';
        
        if (days > 0) {
            timeLeftText += `${days}d `;
        }
        
        timeLeftText += `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
        
        // Add urgent class if less than 1 hour left
        if (days === 0 && hours < 1) {
            timeLeftElement.classList.add('urgent');
        } else {
            timeLeftElement.classList.remove('urgent');
        }
        
        timeLeftElement.textContent = timeLeftText;
    }
    
    // Helper function to pad numbers with leading zero
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    function setupRealtimeUpdates() {
        /* Poll for updates every 5 seconds */
        const pollInterval = setInterval(async () => {
            try {
                const updatedAuction = await getAuctionById(auctionId);
                if (updatedAuction) {
                    console.log("Real-time update received:", updatedAuction);
                    
                    /* Normalize the updated auction data to ensure consistent format */
                    const normalizedAuction = normalizeAuctionData(updatedAuction);
                    
                    /* Update current bid from normalized data */
                    currentBid = parseFloat(normalizedAuction.currentBid);
                    
                    /* Get bid increment from normalized data */
                    bidIncrement = parseFloat(normalizedAuction.bidIncrement);
                    
                    /* Calculate minimum bid properly using bid increment */
                    minimumBid = currentBid + bidIncrement;
                    
                    /* Update UI */
                    currentBidElement.textContent = formatCurrency(currentBid);
                    minimumBidElement.textContent = formatCurrency(minimumBid);
                    bidIncrementElement.textContent = formatCurrency(bidIncrement);
                    
                    /* Also update the input value if it is below the new minimum */
                    const currentInputValue = parseInt(bidAmountInput.value) || 0;
                    if (currentInputValue < minimumBid) {
                        bidAmountInput.value = minimumBid;
                    }
                    
                    /* Update bid input constraints */
                    bidAmountInput.min = minimumBid;
                    bidAmountInput.step = bidIncrement;
                    
                    /* Update the end date if it has changed */
                    if (normalizedAuction.endDate) {
                        const newEndDate = new Date(normalizedAuction.endDate);
                        if (!endDate || newEndDate.getTime() !== endDate.getTime()) {
                            console.log("End date updated:", {
                                old: endDate ? endDate.toISOString() : "undefined",
                                new: newEndDate.toISOString()
                            });
                            endDate = newEndDate;
                        }
                    }
                    
                    /* Update time left */
                    updateTimeLeft();
                    
                    /* Check if auction has ended with a generous buffer (5 minutes) */
                    const now = new Date();
                    const bufferTime = 5 * 60 * 1000; /* 5 minute buffer */
                    
                    if (normalizedAuction.status !== "active" || 
                        (normalizedAuction.endDate && new Date(normalizedAuction.endDate).getTime() + bufferTime < now.getTime())) {
                        
                        console.log("Auction detected as ended in real-time updates", {
                            status: normalizedAuction.status,
                            endDate: normalizedAuction.endDate,
                            currentTime: now.toISOString(),
                            timeDifference: new Date(normalizedAuction.endDate).getTime() - now.getTime()
                        });
                        
                        clearInterval(pollInterval);
                        timeLeftElement.textContent = "Auction Ended";
                        timeLeftElement.classList.add("urgent");
                        disableBidForm();
                        bidValidation.textContent = "This auction has ended";
                    }
                }
            } catch (error) {
                console.error("Error updating auction details:", error);
                /* Do not clear interval on error to allow recovery */
            }
        }, 5000);
        
        /* Clear interval when page is unloaded */
        window.addEventListener("beforeunload", () => {
            clearInterval(pollInterval);
        });
    }
});

// Handle API function name collision
// The placeBid function in this file and the API file have the same name
// Rename the API function reference to avoid collision
async function submitBidToAPI(auctionId, amount) {
    try {
        console.log(`Submitting bid to API: auction=${auctionId}, amount=${amount}`);
        
        // Ensure endpoint starts with a slash
        const endpoint = `/auctions/${auctionId}/bid`;
        
        // Construct the full URL
        const url = `${window.location.origin}/api${endpoint}`;
        console.log(`Making API request to: ${url}`);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        };

        // Add auth token to headers if available
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for request');
        } else {
            throw new Error('Authentication required. Please log in to place a bid.');
        }
        
        const response = await fetch(url, options);
        
        // Log response status
        console.log(`API Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
} 