 // Real-time updates for auctions
class AuctionUpdates {
    constructor() {
        this.pollIntervals = new Map();
        this.updateCallbacks = new Map();
    }
    
    // Start polling for auction updates
    startPolling(auctionId, callback, interval = 5000) {
        // Clear any existing polling for this auction
        this.stopPolling(auctionId);
        
        // Create new polling interval
        const pollInterval = setInterval(async () => {
            try {
                const updatedAuction = await getAuctionById(auctionId);
                if (updatedAuction) {
                    callback(updatedAuction);
                }
            } catch (error) {
                console.error('Error updating auction details:', error);
                this.stopPolling(auctionId);
            }
        }, interval);
        
        // Store the interval
        this.pollIntervals.set(auctionId, pollInterval);
    }
    
    // Stop polling for an auction
    stopPolling(auctionId) {
        const interval = this.pollIntervals.get(auctionId);
        if (interval) {
            clearInterval(interval);
            this.pollIntervals.delete(auctionId);
        }
    }
    
    // Register a callback for auction updates
    registerCallback(auctionId, callback) {
        this.updateCallbacks.set(auctionId, callback);
    }
    
    // Remove a callback for auction updates
    removeCallback(auctionId) {
        this.updateCallbacks.delete(auctionId);
    }
    
    // Update all registered callbacks for an auction
    updateCallbacksForAuction(auctionId, auctionData) {
        const callback = this.updateCallbacks.get(auctionId);
        if (callback) {
            callback(auctionData);
        }
    }
}

// Create a global instance
const auctionUpdates = new AuctionUpdates();

// Export for use in other files
window.auctionUpdates = auctionUpdates;