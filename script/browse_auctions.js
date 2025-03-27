document.addEventListener('DOMContentLoaded', function() {
    // Check if auth.js has loaded, if not, manually display user name
    if (typeof checkAuthStatus !== 'function') {
        displayUserInfo();
    }
    
    // Dropdown menu functionality
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    let dropdownTimeout;

    // Toggle dropdown on click
    profileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        dropdownContent.classList.toggle('show');
        
        if (dropdownContent.classList.contains('show')) {
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 100);
        } else {
            document.removeEventListener('click', closeDropdown);
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', function(e) {
        if (!e.target.closest('a')) {
            e.stopPropagation();
        }
    });
    
    // Close dropdown when clicking outside
    function closeDropdown(e) {
        if (!dropdownContent.contains(e.target) && e.target !== profileBtn) {
            dropdownContent.classList.remove('show');
            document.removeEventListener('click', closeDropdown);
        }
    }
    
    // Handle hover events for dropdown
    profileBtn.addEventListener('mouseenter', function() {
        clearTimeout(dropdownTimeout);
        dropdownContent.classList.add('show');
    });
    
    dropdownContent.addEventListener('mouseenter', function() {
        clearTimeout(dropdownTimeout);
    });
    
    profileBtn.addEventListener('mouseleave', function() {
        dropdownTimeout = setTimeout(() => {
            if (!dropdownContent.matches(':hover')) {
                dropdownContent.classList.remove('show');
            }
        }, 300);
    });
    
    dropdownContent.addEventListener('mouseleave', function() {
        dropdownTimeout = setTimeout(() => {
            if (!profileBtn.matches(':hover')) {
                dropdownContent.classList.remove('show');
            }
        }, 300);
    });

    // Filter functionality
    const filterBtn = document.querySelector('.filter-btn');
    const searchInput = document.querySelector('.search-box input');
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const statusFilter = document.getElementById('status-filter');
    const resetBtn = document.querySelector('.reset-filters-btn');
    const auctionsContainer = document.querySelector('.auctions-container');
    const emptyMessage = document.querySelector('.no-auctions-message');
    const pageNumbers = document.querySelector('.page-numbers');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let pageSize = 12; // Number of listings per page
    
    // Load listings on page load
    loadListings();
    
    // Event handlers for filter changes
    [categoryFilter, priceFilter, statusFilter].forEach(element => {
        element.addEventListener('change', function() {
            currentPage = 1; // Reset to first page when filters change
            updateAuctionDisplay();
        });
    });
    
    searchInput.addEventListener('keyup', debounce(function() {
        currentPage = 1; // Reset to first page when search changes
        updateAuctionDisplay();
    }, 300));
    
    // Reset filters button
    resetBtn.addEventListener('click', function() {
        searchInput.value = '';
        categoryFilter.value = 'all';
        priceFilter.value = 'all';
        statusFilter.value = 'all';
        currentPage = 1;
        updateAuctionDisplay();
    });
    
    // Pagination buttons
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateAuctionDisplay();
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            updateAuctionDisplay();
        }
    });
    
    // More filters button
    filterBtn.addEventListener('click', function() {
        // This would typically show a modal or expanded filter options
        alert('Additional filter options would appear here.');
    });
    
    // Function to update the auction display based on filters
    function updateAuctionDisplay() {
        loadListings();
    }
    
    // Load listings from database
    async function loadListings() {
        // Show loading indicator
        auctionsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading listings...</div>';
        
        // Get filters
        const filters = {
            search: searchInput.value.trim(),
            category: categoryFilter.value !== 'all' ? categoryFilter.value : null,
            status: statusFilter.value !== 'all' ? statusFilter.value : 'active',
            page: currentPage,
            limit: pageSize
        };
        
        // Add price filter if selected
        if (priceFilter.value !== 'all') {
            const priceRange = priceFilter.value.split('-');
            if (priceRange.length === 2) {
                filters.minPrice = parseInt(priceRange[0]) || 0;
                if (priceRange[1]) {
                    filters.maxPrice = parseInt(priceRange[1]);
                }
            } else if (priceFilter.value.endsWith('+')) {
                filters.minPrice = parseInt(priceFilter.value);
            }
        }
        
        try {
            // Fetch listings from the server
            console.log('Fetching auctions with filters:', filters);
            const response = await getAuctions(filters);
            console.log('Auctions response:', response);
            
            // Update pagination
            totalPages = Math.ceil(response.total / pageSize);
            updatePagination();
            
            // Display the listings
            displayListings(response.listings);
        } catch (error) {
            console.error('Error loading listings:', error);
            auctionsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Listings</h3>
                    <p>${error.message || 'Unable to load listings. Please try again later.'}</p>
                    <button class="retry-btn">Retry</button>
                </div>
            `;
            
            // Add event listener to retry button
            const retryBtn = auctionsContainer.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadListings);
            }
        }
    }
    
    // Display the listings in the UI
    function displayListings(listings) {
        // Clear the container
        auctionsContainer.innerHTML = '';
        
        if (!listings || listings.length === 0) {
            // Show empty state
            emptyMessage.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        emptyMessage.style.display = 'none';
        
        // Create listings grid
        const listingsGrid = document.createElement('div');
        listingsGrid.className = 'listings-grid';
        
        // Add each listing
        listings.forEach(listing => {
            const listingCard = createListingCard(listing);
            if (listingCard) {
                listingsGrid.appendChild(listingCard);
            }
        });
        
        // Add the grid to the container
        auctionsContainer.appendChild(listingsGrid);
    }
    
    // Create a listing card element
    function createListingCard(auction) {
        if (!auction) {
            console.error('Invalid auction data:', auction);
            return null;
        }

        // Debug auction data for debugging purposes 
        console.log('Creating card for auction:', {
            id: auction._id || auction.id,
            title: auction.title,
            pricing: auction.pricing
        });

        const card = document.createElement('div');
        card.className = 'listing-card';
        
        // Check if the auction is ending soon
        const timeLeftInfo = calculateTimeLeft(auction.endDate);
        if (timeLeftInfo.isUrgent) {
            card.classList.add('urgent');
        }
        
        // Handle pricing based on MongoDB schema
        let currentBid;
        let startingPrice;
        
        // Check if pricing is in the MongoDB pricing object structure
        if (auction.pricing && typeof auction.pricing === 'object') {
            startingPrice = auction.pricing.startingPrice;
            // Use current bid if available, otherwise use starting price
            currentBid = auction.pricing.currentBid || auction.pricing.startingPrice;
        } else {
            // Fallback for direct properties
            startingPrice = auction.startingPrice || 0;
            currentBid = auction.currentBid || auction.startingPrice || 0;
        }
        
        // Ensure we have valid values for all fields
        const title = auction.title || 'Untitled Auction';
        const category = auction.category || 'Uncategorized';
        const imageUrl = (auction.images && auction.images.length > 0) ? auction.images[0] : '../assets/placeholder.png';
        const totalBids = Array.isArray(auction.bids) ? auction.bids.length : (auction.totalBids || 0);
        const categoryIcon = getCategoryIcon(category);
        
        // Create auction ID (support both _id and id formats)
        // MongoDB typically uses _id
        const auctionId = auction._id || auction.id;
        
        console.log(`Auction ${title} - ID: ${auctionId}, Price: ${formatCurrency(currentBid)}`);

        card.innerHTML = `
            <div class="listing-image">
                ${timeLeftInfo.isUrgent ? '<div class="urgent-badge">Ending Soon</div>' : ''}
                <img src="${imageUrl}" alt="${title}">
                <div class="category-badge">
                    <i class="${categoryIcon}"></i>
                    <span>${category}</span>
                </div>
            </div>
            <div class="listing-details">
                <h3 class="listing-title">${title}</h3>
                <div class="listing-info">
                    <span class="listing-price">${formatCurrency(currentBid)}</span>
                    <span class="listing-bids">${totalBids} bid${totalBids !== 1 ? 's' : ''}</span>
                </div>
                <div class="listing-time-left ${timeLeftInfo.isUrgent ? 'urgent' : ''}">
                    <i class="fas fa-clock"></i>
                    <span>${timeLeftInfo.display}</span>
                </div>
            </div>
        `;

        // Ensure we have a valid auction ID to pass to the product detail page
        if (!auctionId) {
            console.error('Missing auction ID for:', auction);
            return card; // Return card without click handler
        }

        // Store auction ID as a data attribute for reliable access
        card.dataset.auctionId = auctionId;

        // Add click handler to redirect to product detail page with the correct path
        card.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the auction ID from the data attribute
            const clickedAuctionId = card.dataset.auctionId;
            
            // Use a direct reference to the auction ID
            const detailUrl = `../html/product_detail.html?id=${clickedAuctionId}`;
            console.log(`Navigating to product detail: ${detailUrl}`);
            
            // Use location.href for navigation
            window.location.href = detailUrl;
        });

        return card;
    }
    
    // Update pagination UI
    function updatePagination() {
        // Clear existing page numbers
        pageNumbers.innerHTML = '';
        
        // Enable/disable prev and next buttons
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        
        // No pages to show
        if (totalPages === 0) {
            return;
        }
        
        // Show appropriate page numbers based on current page
        if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                addPageNumber(i);
            }
        } else {
            // Show first page
            addPageNumber(1);
            
            if (currentPage > 3) {
                // Add ellipsis if current page is far from first
                addEllipsis();
            }
            
            // Show pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = start; i <= end; i++) {
                addPageNumber(i);
            }
            
            if (currentPage < totalPages - 2) {
                // Add ellipsis if current page is far from last
                addEllipsis();
            }
            
            // Show last page
            addPageNumber(totalPages);
        }
    }
    
    // Add a page number to the pagination
    function addPageNumber(pageNum) {
        const span = document.createElement('span');
        span.className = 'page-number' + (pageNum === currentPage ? ' active' : '');
        span.textContent = pageNum;
        
        // Add click event to change page
        span.addEventListener('click', function() {
            if (pageNum !== currentPage) {
                currentPage = pageNum;
                updateAuctionDisplay();
            }
        });
        
        pageNumbers.appendChild(span);
    }
    
    // Add ellipsis to pagination
    function addEllipsis() {
        const span = document.createElement('span');
        span.className = 'ellipsis';
        span.textContent = '...';
        pageNumbers.appendChild(span);
    }
    
    // Format currency with proper null checks and convert to number
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
    
    // Format number with commas for thousands
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
    
    // Calculate time left for an auction with proper null checks
    function calculateTimeLeft(endDate) {
        if (!endDate) {
            return {
                display: 'Ended',
                isUrgent: false
            };
        }

        const end = new Date(endDate);
        const now = new Date();
        const timeLeft = end - now;
        
        if (timeLeft <= 0) {
            return {
                display: 'Ended',
                isUrgent: false
            };
        }
        
        // Convert to days, hours, minutes
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        let display = '';
        const isUrgent = days === 0 && hours < 12; // Less than 12 hours is urgent
        
        if (days > 0) {
            display = `${days}d ${hours}h`;
        } else if (hours > 0) {
            display = `${hours}h ${minutes}m`;
        } else {
            display = `${minutes}m`;
        }
        
        return {
            display,
            isUrgent
        };
    }
    
    // Get Font Awesome icon for category
    function getCategoryIcon(category) {
        switch (category?.toLowerCase()) {
            case 'art':
            case 'art & collectibles':
                return 'fas fa-palette';
            case 'electronics':
                return 'fas fa-laptop';
            case 'fashion':
                return 'fas fa-tshirt';
            case 'home':
            case 'home & garden':
                return 'fas fa-home';
            case 'jewelry':
            case 'jewelry & watches':
                return 'fas fa-gem';
            default:
                return 'fas fa-box';
        }
    }
    
    // Helper function to pad numbers with leading zero
    function padZero(num) {
        return num.toString().padStart(2, '0');
    }
    
    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }
}); 

// Display user info if not handled by auth.js
function displayUserInfo() {
    const userDisplayElements = document.querySelectorAll('.username-display');
    
    // Try to get username from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user.username || user.name || 'User';
    
    // Update all username display elements
    userDisplayElements.forEach(element => {
        element.textContent = username;
    });
} 