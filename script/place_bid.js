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
    
    let auctionId;
    let currentBid = 0;
    let minimumBid = 0;
    let bidIncrement = 0;
    let endDate;
    let auctionData;
    let redirectUrl;
    
    const urlParams = new URLSearchParams(window.location.search);
    auctionId = urlParams.get('id');
    
    if (!auctionId) {
        window.location.href = 'browse_auctions.html';
    }
    
    loadAuction();
    
    // Event Listeners
    backToListingBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = `browse_auctions.html`;
        }
    });
    
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
    
    bidAmountInput.addEventListener('input', validateBidAmount);
    
    cancelBidBtn.addEventListener('click', function() {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        } else {
            window.location.href = `browse_auctions.html`;
        }
    });
    
    tryAgainBtn.addEventListener('click', function() {
        hideBidError();
    });
    
    bidForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (validateBidAmount()) {
            placeBid();
        }
    });
    
    // Auction Loading
    async function loadAuction() {
        try {
            const auction = await getAuctionById(auctionId);
            
            if (!auction) {
                throw new Error('Auction not found');
            }
            
            console.log('Loaded auction data:', auction);
            
            if (auction.status && auction.status !== 'active') {
                throw new Error('This auction is no longer active');
            }
            
            const normalizedAuction = normalizeAuctionData(auction);
            
            updateAuctionDisplay(normalizedAuction);
            
            endDate = normalizedAuction.endDate;
            console.log('Setting end date for countdown:', endDate.toISOString());
            startCountdown();
            
            setupRealtimeUpdates();
        } catch (error) {
            console.error('Error loading auction:', error);
            showError(error.message || 'Failed to load auction details');
            disableBidForm();
        }
    }
    
    // Data Normalization
    function normalizeAuctionData(data) {
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
        
        if (data.endDate) {
            result.endDate = new Date(data.endDate);
        } else if (data.end_date) {
            result.endDate = new Date(data.end_date);
        } else if (data.endTime) {
            result.endDate = new Date(data.endTime);
        } else {
            result.endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        
        if (data.pricing && typeof data.pricing === 'object') {
            result.startPrice = parseFloat(data.pricing.startingPrice || 0);
            result.currentBid = parseFloat(data.pricing.currentBid || result.startPrice);
            result.bidIncrement = parseFloat(data.pricing.bidIncrement || 100);
        } else {
            result.startPrice = parseFloat(data.startPrice || data.startingPrice || 0);
            result.currentBid = parseFloat(data.currentBid || result.startPrice);
            result.bidIncrement = parseFloat(data.bidIncrement || 100);
        }
        
        return result;
    }
    
    // UI Update
    function updateAuctionDisplay(auction) {
        try {
            if (!auction) {
                throw new Error('Invalid auction data');
            }

            console.log('Updating UI with auction data:', auction);

            if (auction.images && auction.images.length > 0) {
                itemImage.src = auction.images[0];
            } else {
                itemImage.src = '../assets/placeholder.png';
            }
            
            itemImage.alt = auction.title;
            itemTitle.textContent = auction.title || 'Untitled Auction';
            
            currentBid = parseFloat(auction.currentBid || 0);
            minimumBid = currentBid + parseFloat(auction.bidIncrement || 100);
            bidIncrement = parseFloat(auction.bidIncrement || 100);
            
            currentBidElement.textContent = formatCurrency(currentBid);
            minimumBidElement.textContent = formatCurrency(minimumBid);
            bidIncrementElement.textContent = formatCurrency(bidIncrement);
            
            bidAmountInput.value = minimumBid;
            bidAmountInput.min = minimumBid;
            bidAmountInput.step = bidIncrement;
            
            if (auction.endDate) {
                endDate = new Date(auction.endDate);
                console.log('Setting end date in updateAuctionDisplay:', endDate.toISOString());
            } else {
                throw new Error('Auction end date not specified');
            }
            
            enableBidForm();
            
            updateTimeLeft();
        } catch (error) {
            console.error('Error updating auction display:', error);
            showError(error.message || 'Failed to update auction display');
            disableBidForm();
        }
    }
    
    // Formatting Helpers
    function formatCurrency(amount) {
        if (typeof amount === 'string') {
            amount = parseFloat(amount);
        }
        
        if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
            return '₹0.00';
        }
        
        return '₹' + formatNumber(amount);
    }
    
    function formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '0.00';
        }
        
        if (typeof number === 'string') {
            number = parseFloat(number);
        }
        
        const withDecimals = number.toFixed(2);
        
        return withDecimals.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    // Bid Validation
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
        
        const remainder = (bidAmount - currentBid) % bidIncrement;
        if (remainder !== 0) {
            bidValidation.textContent = `Bid must be in increments of ₹${formatCurrency(bidIncrement)}`;
            return false;
        }
        
        bidValidation.textContent = '';
        return true;
    }
    
    // Bid Placement
    async function placeBid() {
        const bidAmount = parseInt(bidAmountInput.value);
        
        disableBidForm();
        
        try {
            const updatedAuction = await getAuctionById(auctionId);
            if (!updatedAuction) {
                throw new Error('Auction not found');
            }
            
            const status = updatedAuction.status || 'active';
            if (status !== 'active') {
                throw new Error('This auction is no longer active');
            }
            
            if (updatedAuction.endDate) {
                const auctionEndDate = new Date(updatedAuction.endDate);
                const now = new Date();
                const bufferTime = 2 * 60 * 1000;
                
                console.log('Checking if auction has ended:', {
                    auctionEndDate: auctionEndDate.toISOString(),
                    currentTime: now.toISOString(),
                    timeDifference: auctionEndDate.getTime() - now.getTime()
                });
                
                if (auctionEndDate.getTime() + bufferTime < now.getTime()) {
                    throw new Error('This auction has ended');
                }
            }
            
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
            
            let bidIncrementAmount = 100;
            if (updatedAuction.pricing && updatedAuction.pricing.bidIncrement) {
                bidIncrementAmount = parseFloat(updatedAuction.pricing.bidIncrement);
            } else if (updatedAuction.bidIncrement) {
                bidIncrementAmount = parseFloat(updatedAuction.bidIncrement);
            }
            
            const minBid = currentHighestBid + bidIncrementAmount;
            
            if (bidAmount < minBid) {
                throw new Error(`Bid must be at least ₹${formatCurrency(minBid)}`);
            }
            
            console.log(`Placing bid of ₹${bidAmount} on auction ${auctionId}`);
            
            const response = await submitBidToAPI(auctionId, bidAmount);
            
            console.log('Bid response:', response);
            
            showBidConfirmation();
            
            currentBidElement.textContent = formatCurrency(bidAmount);
            minimumBidElement.textContent = formatCurrency(bidAmount + bidIncrementAmount);
        } catch (error) {
            console.error('Error placing bid:', error);
            showError(error.message || 'Unable to place bid. Please try again.');
        } finally {
            enableBidForm();
        }
    }
    
    // UI Helpers
    function showError(message) {
        bidError.style.display = 'block';
        errorMessage.textContent = message;
        bidConfirmation.style.display = 'none';
        
        itemTitle.textContent = 'Error Loading Auction';
        currentBidElement.textContent = '--';
        minimumBidElement.textContent = '--';
        bidIncrementElement.textContent = '--';
        timeLeftElement.textContent = '--:--:--';
    }
    
    function disableBidForm() {
        bidForm.classList.add('disabled');
        submitBidBtn.disabled = true;
        bidAmountInput.disabled = true;
        decreaseBidBtn.disabled = true;
        increaseBidBtn.disabled = true;
    }
    
    function enableBidForm() {
        bidForm.classList.remove('disabled');
        submitBidBtn.disabled = false;
        bidAmountInput.disabled = false;
        decreaseBidBtn.disabled = false;
        increaseBidBtn.disabled = false;
    }
    
    function showBidConfirmation() {
        bidConfirmation.classList.remove('hidden');
    }
    
    function hideBidError() {
        bidError.classList.add('hidden');
    }
    
    // Countdown Timer
    function startCountdown() {
        updateTimeLeft();
        setInterval(updateTimeLeft, 1000);
    }
    
    function updateTimeLeft() {
        if (!endDate) {
            console.error('End date not set');
            timeLeftElement.textContent = 'Time unavailable';
            return;
        }
        
        console.log('Calculating time left with end date:', endDate.toISOString());
        const now = new Date();
        let timeLeftMs = endDate - now;
        
        const bufferTime = 30 * 1000;
        
        if (timeLeftMs <= -bufferTime) {
            console.log('Auction ended. Time difference:', timeLeftMs);
            timeLeftElement.textContent = 'Auction Ended';
            timeLeftElement.classList.add('urgent');
            
            disableBidForm();
            bidValidation.textContent = 'This auction has ended';
            return;
        } else if (timeLeftMs <= 0) {
            console.log('Auction ending. Time difference:', timeLeftMs);
            timeLeftElement.textContent = 'Ending now';
            timeLeftElement.classList.add('urgent');
            return;
        }
        
        const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
        timeLeftMs -= days * (1000 * 60 * 60 * 24);
        
        const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
        timeLeftMs -= hours * (1000 * 60 * 60);
        
        const minutes = Math.floor(timeLeftMs / (1000 * 60));
        timeLeftMs -= minutes * (1000 * 60);
        
        const seconds = Math.floor(timeLeftMs / 1000);
        
        let timeLeftText = '';
        
        if (days > 0) {
            timeLeftText += `${days}d `;
        }
        
        timeLeftText += `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
        
        if (days === 0 && hours < 1) {
            timeLeftElement.classList.add('urgent');
        } else {
            timeLeftElement.classList.remove('urgent');
        }
        
        timeLeftElement.textContent = timeLeftText;
    }
    
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    // Real-time Updates
    function setupRealtimeUpdates() {
        const pollInterval = setInterval(async () => {
            try {
                const updatedAuction = await getAuctionById(auctionId);
                if (updatedAuction) {
                    console.log("Real-time update received:", updatedAuction);
                    
                    const normalizedAuction = normalizeAuctionData(updatedAuction);
                    
                    currentBid = parseFloat(normalizedAuction.currentBid);
                    
                    bidIncrement = parseFloat(normalizedAuction.bidIncrement);
                    
                    minimumBid = currentBid + bidIncrement;
                    
                    currentBidElement.textContent = formatCurrency(currentBid);
                    minimumBidElement.textContent = formatCurrency(minimumBid);
                    bidIncrementElement.textContent = formatCurrency(bidIncrement);
                    
                    const currentInputValue = parseInt(bidAmountInput.value) || 0;
                    if (currentInputValue < minimumBid) {
                        bidAmountInput.value = minimumBid;
                    }
                    
                    bidAmountInput.min = minimumBid;
                    bidAmountInput.step = bidIncrement;
                    
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
                    
                    updateTimeLeft();
                    
                    const now = new Date();
                    const bufferTime = 5 * 60 * 1000;
                    
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
            }
        }, 5000);
        
        window.addEventListener("beforeunload", () => {
            clearInterval(pollInterval);
        });
    }
});

// API Handling
async function submitBidToAPI(auctionId, amount) {
    try {
        console.log(`Submitting bid to API: auction=${auctionId}, amount=${amount}`);
        
        const endpoint = `/auctions/${auctionId}/bid`;
        
        const url = `${window.location.origin}/api${endpoint}`;
        console.log(`Making API request to: ${url}`);
        
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ amount })
        };

        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for request');
        } else {
            throw new Error('Authentication required. Please log in to place a bid.');
        }
        
        const response = await fetch(url, options);
        
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

// Auction Data Fetching
async function getAuctionById(auctionId) {
    try {
        console.log(`Fetching auction details for ID: ${auctionId}`);
        
        const apiUrl = `${window.location.origin}/api/auctions/${auctionId}`;
        
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
        
        const responseData = await response.json();
        console.log('API response for auction:', responseData);
        
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
        
        return auctionData;
    } catch (error) {
        console.error('Error fetching auction:', error);
        throw error;
    }
} 