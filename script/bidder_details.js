// Global variables
let currentPage = 1;
const itemsPerPage = 10;
let totalBidders = 0;
let bidderData = [];
let auctionDetails = {};

// DOM elements
const bidderTableBody = document.getElementById('bidders-table-body');
const noBiddersMessage = document.getElementById('no-bidders-message');
const paginationElement = document.querySelector('.pagination');
const paginationNumbers = document.querySelector('.page-numbers');
const prevButton = document.querySelector('.prev-btn');
const nextButton = document.querySelector('.next-btn');

// Helper to get URL parameters
function getUrlParameter(name) {
    const url = window.location.search;
    const params = new URLSearchParams(url);
    return params.get(name);
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Get auction ID from URL
    const auctionId = getUrlParameter('id');
    
    if (!auctionId) {
        showError('No auction specified. Please select an auction from the dashboard.');
        return;
    }
    
    try {
        // Initialize page elements
        initPageElements();
        
        // Show loading state
        showLoadingState();
        
        // Load auction details first
        try {
            await loadAuctionDetails(auctionId);
        } catch (auctionError) {
            console.error('Error loading auction details:', auctionError);
            showError(`Could not load auction details: ${auctionError.message}`);
            return;
        }
        
        // Then load bidders data
        try {
            await loadBidders(auctionId);
        } catch (biddersError) {
            console.error('Error loading bidders:', biddersError);
            // Don't exit - we can still show auction details with an empty bidders list
        }
        
        // Hide loading state
        hideLoadingState();
        
        // Setup event listeners
        setupEventListeners();
    } catch (error) {
        console.error('Fatal error initializing page:', error);
        hideLoadingState();
        showError(`An unexpected error occurred: ${error.message}`);
    }
});

// Show loading state
function showLoadingState() {
    const mainElement = document.querySelector('main');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-ghost fa-spin"></i>
            <span>Loading auction data...</span>
        </div>
    `;
    mainElement.appendChild(loadingDiv);
}

// Hide loading state
function hideLoadingState() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// Initialize page elements
function initPageElements() {
    // Set up view toggle buttons
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const view = button.getAttribute('data-view');
            toggleView(view);
        });
    });
}

// Toggle between table and card views
function toggleView(view) {
    const tableWrapper = document.querySelector('.history-table-wrapper');
    // Implement view toggle functionality if needed
    if (view === 'table') {
        tableWrapper.style.display = 'block';
        // Hide cards view if implemented
    } else if (view === 'cards') {
        tableWrapper.style.display = 'none';
        // Show cards view if implemented
    }
}

// Load auction details
async function loadAuctionDetails(auctionId) {
    try {
        // Get auction details from API
        const response = await getAuctionById(auctionId);
        
        if (!response || !response.success) {
            throw new Error('Failed to fetch auction details');
        }
        
        // The actual auction data is in response.listing
        const auction = response.listing;
        
        if (!auction) {
            throw new Error('Auction not found');
        }
        
        auctionDetails = auction;
        
        // Update the DOM with auction details
        document.getElementById('auction-title').textContent = auction.title || 'Untitled Auction';
        
        // Safely access nested properties
        const startingPrice = auction.pricing && auction.pricing.startingPrice 
            ? parseFloat(auction.pricing.startingPrice) 
            : 0;
        document.getElementById('starting-price').textContent = `₹${startingPrice.toLocaleString()}`;
        
        // Current bid is highest bid or starting price if no bids
        const currentBid = (auction.pricing && auction.pricing.currentBid) 
            ? parseFloat(auction.pricing.currentBid) 
            : startingPrice;
        document.getElementById('current-bid').textContent = `₹${currentBid.toLocaleString()}`;
        
        // Update status
        document.getElementById('auction-status').textContent = auction.status || 'Unknown';
        
        // Set auction image if available
        if (auction.images && auction.images.length > 0) {
            document.getElementById('auction-image').src = auction.images[0];
        }
    } catch (error) {
        console.error('Error loading auction details:', error);
        throw new Error('Failed to load auction details: ' + error.message);
    }
}

// Load bidders data
async function loadBidders(auctionId) {
    try {
        // Get auction bids from API
        const response = await getAuctionBids(auctionId, {
            page: currentPage,
            limit: itemsPerPage
        });
        
        // Check if the response is valid
        if (!response || !response.success) {
            console.warn('Invalid response from auction bids API:', response);
            bidderData = [];
            totalBidders = 0;
        } else {
            bidderData = response.bids || [];
            totalBidders = response.total || bidderData.length;
        }
        
        // Update bidders count
        document.getElementById('total-bidders').textContent = `${totalBidders} Bidder${totalBidders !== 1 ? 's' : ''}`;
        
        // Display bidders
        displayBidders();
    } catch (error) {
        console.error('Error loading bidders:', error);
        // Still show the empty state rather than throwing an error
        bidderData = [];
        totalBidders = 0;
        document.getElementById('total-bidders').textContent = '0 Bidders';
        displayBidders();
    }
}

// Display bidders data
function displayBidders() {
    // Clear table
    bidderTableBody.innerHTML = '';
    
    // Check if there are bidders
    if (!bidderData || bidderData.length === 0) {
        noBiddersMessage.style.display = 'flex';
        paginationElement.style.display = 'none';
        return;
    }
    
    // Hide no bidders message and show table
    noBiddersMessage.style.display = 'none';
    
    // Populate table with current page data
    bidderData.forEach(bid => {
        try {
            const row = document.createElement('tr');
            
            // Determine status class
            let statusClass = '';
            if (bid && bid.isHighestBid) {
                statusClass = 'status-success';
            } else {
                statusClass = 'status-danger';
            }
            
            // Format date
            let formattedDate = 'Unknown';
            if (bid && bid.bidTime) {
                try {
                    const bidTime = new Date(bid.bidTime);
                    formattedDate = bidTime.toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (dateError) {
                    console.error('Error formatting date:', dateError);
                }
            }
            
            // Format bid status text
            const statusText = (bid && bid.isHighestBid) ? 'Highest' : 'Outbid';
            
            // Calculate bid increment if possible
            const increment = bid && bid.increment !== undefined ? bid.increment : 'N/A';
            const incrementText = typeof increment === 'number' ? 
                `+₹${increment.toLocaleString()}` : increment;
            
            // Format amount
            const amount = bid && !isNaN(bid.amount) ? parseFloat(bid.amount) : 0;
            
            row.innerHTML = `
                <td>
                    <div class="bidder-info">
                        <i class="fas fa-user-circle"></i>
                        <span>${bid && bid.bidderName ? bid.bidderName : 'Anonymous'}</span>
                    </div>
                </td>
                <td>₹${amount.toLocaleString()}</td>
                <td>${formattedDate}</td>
                <td>${incrementText}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            `;
            
            bidderTableBody.appendChild(row);
        } catch (rowError) {
            console.error('Error creating bid row:', rowError, bid);
        }
    });
    
    // Update pagination
    updatePagination();
}

// Handle contact bidder button click
async function handleContactBidder(event) {
    const bidderId = event.currentTarget.getAttribute('data-id');
    if (!bidderId) {
        alert('Bidder information is not available');
        return;
    }
    
    try {
        // Show loading state for button - use class instead of changing innerHTML
        const button = event.currentTarget;
        button.classList.add('loading');
        
        // Get bidder details from API
        const bidderResponse = await getBidderDetails(bidderId);
        
        // Restore button
        button.classList.remove('loading');
        
        // Extract bidder data from the response - handle different response formats
        let bidder = null;
        if (bidderResponse && bidderResponse.user) {
            bidder = bidderResponse.user;
        } else if (bidderResponse && bidderResponse.data) {
            bidder = bidderResponse.data;
        } else if (bidderResponse && !bidderResponse.user && typeof bidderResponse === 'object') {
            bidder = bidderResponse;
        }
        
        console.log('Bidder data for modal:', bidder);
        
        if (!bidder) {
            // Create and show modal with error message
            const modalHTML = `
                <div class="modal-overlay" id="contact-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Contact Bidder</h3>
                            <button class="close-modal-btn"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="modal-body">
                            <div class="contact-info">
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle"></i> 
                                    Failed to retrieve bidder contact information. The user may have deleted their account or restricted access to their contact details.
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="close-btn">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to DOM
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Add event listeners to modal buttons
            const modal = document.getElementById('contact-modal');
            const closeButtons = modal.querySelectorAll('.close-modal-btn, .close-btn');
            
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modal.remove();
                });
            });
            
            // Close modal when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
            
            return;
        }
        
        // Check if phone exists in various possible locations
        let phone = bidder.phone || bidder.phoneNumber || 
                    (bidder.contact && bidder.contact.phone) || 
                    (bidder.contactInfo && bidder.contactInfo.phone) || '';
                    
        // Flag to track if we're using a demo phone number
        let isUsingDemoPhone = false;
        
        // DEMO: Generate a phone number if none was found - REMOVE IN PRODUCTION
        if (!phone || phone.trim() === '') {
            // This is only for demo purposes - generates a fake phone number
            phone = '+91 ' + Math.floor(Math.random() * 9000000000 + 1000000000);
            console.log('DEMO MODE: Generated mock phone number:', phone);
            isUsingDemoPhone = true;
        }
                    
        const hasPhone = phone && phone.trim() !== '';
        
        // Similarly check for email
        const email = bidder.email || 
                    (bidder.contact && bidder.contact.email) || 
                    (bidder.contactInfo && bidder.contactInfo.email) || '';
        
        // Get name from various possible properties
        const name = bidder.name || bidder.fullName || bidder.username || 
                  (bidder.profile && bidder.profile.name) || 'Anonymous';
        
        // Create and show modal with bidder contact information
        const modalHTML = `
            <div class="modal-overlay" id="contact-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Contact Bidder</h3>
                        <button class="close-modal-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="contact-info">
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Phone:</strong> ${hasPhone ? phone : '<span class="no-data">Not provided</span>'}</p>
                            <p><strong>Email:</strong> ${email || '<span class="no-data">Not provided</span>'}</p>
                            
                            ${isUsingDemoPhone ? 
                                '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Demo Mode: Using generated phone number for demonstration purposes.</div>' : ''}
                            
                            <div class="debug-info" style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 0.8rem; color: #666;">
                                <p><strong>Debug:</strong> Showing all available bidder data to help diagnose phone number issue</p>
                                <pre>${JSON.stringify(bidder, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${hasPhone ? 
                            `<a href="tel:${phone}" class="primary-btn"><i class="fas fa-phone"></i> Call Now</a>` 
                            : ''}
                        ${email ? 
                            `<a href="mailto:${email}" class="secondary-btn"><i class="fas fa-envelope"></i> Send Email</a>` 
                            : ''}
                        <button class="close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners to modal buttons
        const modal = document.getElementById('contact-modal');
        const closeButtons = modal.querySelectorAll('.close-modal-btn, .close-btn');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Error getting bidder details:', error);
        
        // Restore button
        const button = event.currentTarget;
        button.classList.remove('loading');
        
        // Create and show modal with error message
        const modalHTML = `
            <div class="modal-overlay" id="contact-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Contact Bidder</h3>
                        <button class="close-modal-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="contact-info">
                            <div class="alert alert-warning">
                                <i class="fas fa-exclamation-triangle"></i> 
                                Failed to retrieve bidder contact information. ${error.message || 'Please try again later.'}
                            </div>
                            <div class="debug-info" style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 0.8rem; color: #666;">
                                <p><strong>Error Details:</strong></p>
                                <pre>${error.stack || error.toString()}</pre>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners to modal buttons
        const modal = document.getElementById('contact-modal');
        const closeButtons = modal.querySelectorAll('.close-modal-btn, .close-btn');
        
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(totalBidders / itemsPerPage);
    
    // Enable/disable prev/next buttons
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    
    // Generate page numbers
    paginationNumbers.innerHTML = '';
    
    // Determine range of page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    // Adjust if we're near the end
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Add first page if not included
    if (startPage > 1) {
        addPageNumber(1, currentPage === 1);
        if (startPage > 2) {
            addEllipsis();
        }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
        addPageNumber(i, currentPage === i);
    }
    
    // Add last page if not included
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            addEllipsis();
        }
        addPageNumber(totalPages, currentPage === totalPages);
    }
    
    // Show pagination if there are multiple pages
    paginationElement.style.display = totalPages > 1 ? 'flex' : 'none';
}

// Add page number to pagination
function addPageNumber(number, isActive) {
    const span = document.createElement('span');
    span.className = `page-number ${isActive ? 'active' : ''}`;
    span.textContent = number;
    span.addEventListener('click', async () => {
        if (number !== currentPage) {
            currentPage = number;
            
            // Reload bidders data with new page
            try {
                showLoadingState();
                await loadBidders(auctionDetails.id || getUrlParameter('id'));
                hideLoadingState();
            } catch (error) {
                console.error('Error loading bidders for page', number, error);
                hideLoadingState();
                showError('Failed to load bidders for this page');
            }
        }
    });
    paginationNumbers.appendChild(span);
}

// Add ellipsis to pagination
function addEllipsis() {
    const span = document.createElement('span');
    span.className = 'page-ellipsis';
    span.textContent = '...';
    paginationNumbers.appendChild(span);
}

// Show error message
function showError(message) {
    hideLoadingState();
    
    const mainElement = document.querySelector('main');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-circle error-icon"></i>
            <h3>Error</h3>
            <p>${message}</p>
            <div class="error-actions">
                <button class="retry-btn" onclick="window.location.reload()">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
                <a href="sales_dashboard.html" class="primary-btn">
                    <i class="fas fa-arrow-left"></i> Back to Dashboard
                </a>
            </div>
        </div>
    `;
    
    // Clear main content and display error
    mainElement.innerHTML = '';
    mainElement.appendChild(errorDiv);
    
    // Also log to console for debugging
    console.error('Error displayed to user:', message);
}

// Set up event listeners
function setupEventListeners() {
    // Pagination next/previous buttons
    prevButton.addEventListener('click', async () => {
        if (currentPage > 1) {
            currentPage--;
            
            try {
                showLoadingState();
                await loadBidders(auctionDetails.id || getUrlParameter('id'));
                hideLoadingState();
            } catch (error) {
                console.error('Error loading previous page:', error);
                hideLoadingState();
                showError('Failed to load previous page');
            }
        }
    });
    
    nextButton.addEventListener('click', async () => {
        const totalPages = Math.ceil(totalBidders / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            
            try {
                showLoadingState();
                await loadBidders(auctionDetails.id || getUrlParameter('id'));
                hideLoadingState();
            } catch (error) {
                console.error('Error loading next page:', error);
                hideLoadingState();
                showError('Failed to load next page');
            }
        }
    });
} 