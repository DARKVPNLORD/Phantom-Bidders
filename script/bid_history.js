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
        
        // Toggle the 'open' class
        dropdownContent.classList.toggle('show');
        
        // If the dropdown is now shown, add the click event listener to the document
        if (dropdownContent.classList.contains('show')) {
            // Add a slight delay before adding the event listener
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 100);
        } else {
            document.removeEventListener('click', closeDropdown);
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    dropdownContent.addEventListener('click', function(e) {
        // Only stop propagation if it's not a link
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
    
    // Handle hover events
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

    // History page functionality
    const searchInput = document.querySelector('.search-box input');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const exportBtn = document.querySelector('.export-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const tableBody = document.getElementById('history-table-body');
    const emptyState = document.querySelector('.empty-history');
    const tableWrapper = document.querySelector('.history-table-wrapper');
    const statCards = document.querySelectorAll('.stat-value');
    const paginationContainer = document.querySelector('.pagination');
    const prevButton = document.querySelector('.prev-btn');
    const nextButton = document.querySelector('.next-btn');
    const pageNumbers = document.querySelector('.page-numbers');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    let totalBids = 0;
    
    // Current view (table or cards)
    let currentView = 'table';
    
    // Bid history data
    let bidHistoryData = [];
    
    // Initialize the page
    init();
    
    // Initial setup
    async function init() {
        try {
            // Check if user is logged in
            const token = localStorage.getItem('authToken');
            if (!token) {
                showError('Please log in to view your bid history');
                return;
            }
            
            // Show loading state
            showLoading();
            
            // Load bid history
            await loadBidHistory();
            
            // Set up event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to load bid history: ' + error.message);
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // View toggle (table/cards)
        viewBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                currentView = view;
                
                // Remove active class from all buttons
                viewBtns.forEach(button => button.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Update the display
                updateBidHistoryDisplay();
            });
        });
        
        // Search functionality
        searchInput.addEventListener('input', debounce(function() {
            updateBidHistoryDisplay();
        }, 300));
        
        // Filter change handlers
        [statusFilter, dateFilter].forEach(filter => {
            filter.addEventListener('change', function() {
                // Reset to page 1 when filters change
                currentPage = 1;
                loadBidHistory();
            });
        });
        
        // Export button
        exportBtn.addEventListener('click', function() {
            exportBidHistory();
        });
        
        // Pagination buttons
        prevButton.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadBidHistory();
            }
        });
        
        nextButton.addEventListener('click', function() {
            if (currentPage < totalPages) {
                currentPage++;
                loadBidHistory();
            }
        });
    }
    
    // Load bid history data
    async function loadBidHistory() {
        try {
            // Show loading state
            showLoading();
            
            // Get filter values
            const status = statusFilter.value;
            const dateRange = dateFilter.value;
            
            // Build filter object
            const filters = {
                page: currentPage,
                limit: 10
            };
            
            // Add status filter if not 'all'
            if (status !== 'all') {
                filters.status = status;
            }
            
            // Add date filter if not 'all'
            if (dateRange !== 'all') {
                filters.dateRange = dateRange;
            }
            
            // Fetch data from API
            const response = await getUserBidHistory(filters);
            
            // Update pagination info
            totalPages = response.pages || 1;
            totalBids = response.total || 0;
            bidHistoryData = response.bids || [];
            
            // Update the display
            updateBidHistoryDisplay();
            updatePagination();
            updateStats();
            
            // Hide loading state
            hideLoading();
        } catch (error) {
            console.error('Error loading bid history:', error);
            showError('Failed to load bid history: ' + error.message);
        }
    }
    
    // Update display based on filters and view mode
    function updateBidHistoryDisplay() {
        const searchTerm = searchInput.value.toLowerCase();
        
        // Filter bids based on search term
        const filteredBids = bidHistoryData.filter(bid => {
            return bid.title.toLowerCase().includes(searchTerm);
        });
        
        // Clear table
        tableBody.innerHTML = '';
        
        if (filteredBids.length === 0) {
            // Show empty state
            emptyState.style.display = 'flex';
            tableWrapper.style.display = 'none';
        } else {
            // Hide empty state
            emptyState.style.display = 'none';
            tableWrapper.style.display = 'block';
            
            // Populate table with data
            filteredBids.forEach(bid => {
                const row = document.createElement('tr');
                
                // Determine status badge class and text
                let statusClass = '';
                let statusText = '';
                
                if (bid.bid.isHighestBidder) {
                    if (new Date(bid.endDate) < new Date()) {
                        statusClass = 'won';
                        statusText = 'Won';
                    } else {
                        statusClass = 'winning';
                        statusText = 'Winning';
                    }
                } else {
                    if (new Date(bid.endDate) < new Date()) {
                        statusClass = 'lost';
                        statusText = 'Lost';
                    } else {
                        statusClass = 'outbid';
                        statusText = 'Outbid';
                    }
                }
                
                // Format dates
                const bidTime = new Date(bid.bid.time);
                const endTime = new Date(bid.endDate);
                
                // Create cells with bid data
                row.innerHTML = `
                    <td>
                        <div class="item-cell">
                            <img src="${bid.images?.[0] || '../assets/placeholder.png'}" alt="${bid.title}">
                            <div class="item-details">
                                <h4>${bid.title}</h4>
                                <span class="category">${bid.category || 'Uncategorized'}</span>
                            </div>
                        </div>
                    </td>
                    <td>${formatCurrency(bid.bid.amount)}</td>
                    <td>${formatCurrency(bid.currentBid)}</td>
                    <td>${formatDate(bidTime)}</td>
                    <td>${formatDate(endTime)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <a href="../html/product_detail.html?id=${bid.listingId}" class="action-btn view-btn" title="View Auction">
                                <i class="fas fa-eye"></i>
                            </a>
                            ${new Date(bid.endDate) > new Date() ? 
                                `<a href="../html/place_bid.html?id=${bid.listingId}" class="action-btn bid-btn" title="Place Bid">
                                    <i class="fas fa-gavel"></i>
                                </a>` : ''}
                        </div>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    }
    
    // Update pagination controls
    function updatePagination() {
        // Update page numbers
        pageNumbers.innerHTML = '';
        
        // Only show pagination if there are multiple pages
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        // Enable/disable prev/next buttons
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        
        // Calculate range of page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust startPage if endPage is at max
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageNumber = document.createElement('span');
            pageNumber.classList.add('page-number');
            if (i === currentPage) {
                pageNumber.classList.add('active');
            }
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => {
                currentPage = i;
                loadBidHistory();
            });
            pageNumbers.appendChild(pageNumber);
        }
    }
    
    // Update statistics
    function updateStats() {
        if (!bidHistoryData || bidHistoryData.length === 0) {
            // Set all stats to zero
            statCards[0].textContent = '0';
            statCards[1].textContent = '0';
            statCards[2].textContent = '0';
            statCards[3].textContent = '₹0';
            return;
        }
        
        // Calculate total bids (use the total from API response)
        statCards[0].textContent = totalBids;
        
        // Calculate won auctions
        const wonAuctions = bidHistoryData.filter(bid => {
            return bid.bid.isHighestBidder && new Date(bid.endDate) < new Date();
        }).length;
        statCards[1].textContent = wonAuctions;
        
        // Calculate active bids
        const activeBids = bidHistoryData.filter(bid => {
            return new Date(bid.endDate) > new Date();
        }).length;
        statCards[2].textContent = activeBids;
        
        // Calculate total spent (on won auctions)
        const totalSpent = bidHistoryData
            .filter(bid => bid.bid.isHighestBidder && new Date(bid.endDate) < new Date())
            .reduce((sum, bid) => sum + bid.bid.amount, 0);
        statCards[3].textContent = formatCurrency(totalSpent);
    }
    
    // Export bid history to CSV
    function exportBidHistory() {
        if (!bidHistoryData || bidHistoryData.length === 0) {
            alert('No bid history to export');
            return;
        }
        
        // Create CSV content
        let csvContent = 'Item,Your Bid,Current Bid,Bid Time,Auction Ends,Status\n';
        
        bidHistoryData.forEach(bid => {
            // Determine status
            let status = '';
            if (bid.bid.isHighestBidder) {
                status = new Date(bid.endDate) < new Date() ? 'Won' : 'Winning';
            } else {
                status = new Date(bid.endDate) < new Date() ? 'Lost' : 'Outbid';
            }
            
            // Format dates
            const bidTime = new Date(bid.bid.time).toLocaleString();
            const endTime = new Date(bid.endDate).toLocaleString();
            
            // Add row to CSV
            csvContent += `"${bid.title}",${bid.bid.amount},${bid.currentBid},"${bidTime}","${endTime}","${status}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'bid_history.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
    
    // Format date
    function formatDate(date) {
        if (!date) return 'N/A';
        
        try {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }
    
    // Show loading state
    function showLoading() {
        // You could add a loading spinner here
        emptyState.style.display = 'none';
        tableWrapper.style.display = 'none';
    }
    
    // Hide loading state
    function hideLoading() {
        // Remove loading spinner
    }
    
    // Show error message
    function showError(message) {
        emptyState.style.display = 'flex';
        tableWrapper.style.display = 'none';
        
        // Update empty state to show error
        const emptyStateIcon = emptyState.querySelector('i');
        const emptyStateHeading = emptyState.querySelector('h3');
        const emptyStateText = emptyState.querySelector('p');
        
        emptyStateIcon.className = 'fas fa-exclamation-circle';
        emptyStateHeading.textContent = 'Error';
        emptyStateText.textContent = message;
        
        // Hide loading state
        hideLoading();
    }
    
    // Helper function to debounce input events
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }
});

/**
 * Display user info in profile dropdown 
 * Fallback function in case auth.js doesn't load
 */
function displayUserInfo() {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    if (userData) {
        const userDisplayElements = document.querySelectorAll('.username-display');
        userDisplayElements.forEach(element => {
            element.textContent = userData.name || userData.username || 'User';
        });
    }
} 