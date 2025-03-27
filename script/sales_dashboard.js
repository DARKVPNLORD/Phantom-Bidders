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

    // Sales dashboard functionality
    const searchInput = document.querySelector('.search-box input');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const exportBtn = document.querySelector('.export-btn');
    const viewBtns = document.querySelectorAll('.view-btn');
    const insightCards = document.querySelectorAll('.insight-card');
    const tableBody = document.getElementById('history-table-body');
    const emptyState = document.querySelector('.empty-history');
    const statValues = document.querySelectorAll('.stat-value');
    const tableWrapper = document.querySelector('.history-table-wrapper');
    const prevPageBtn = document.querySelector('.prev-btn');
    const nextPageBtn = document.querySelector('.next-btn');
    const pageNumbersContainer = document.querySelector('.page-numbers');
    
    // Pagination variables
    let currentPage = 1;
    let totalPages = 1;
    let itemsPerPage = 10;
    
    // Initial load of data
    loadSellerListings();
    
    // Add hover effect for insight cards
    insightCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // View toggle (table/cards)
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Remove active class from all buttons
            viewBtns.forEach(button => button.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Toggle between table and card views
            if (view === 'table') {
                tableWrapper.style.display = 'block';
                document.querySelector('.history-table').classList.remove('card-view');
            } else {
                tableWrapper.style.display = 'block';
                document.querySelector('.history-table').classList.add('card-view');
            }
        });
    });
    
    // Search functionality
    searchInput.addEventListener('input', debounce(function() {
        currentPage = 1;
        loadSellerListings();
    }, 300));
    
    // Filter change handlers
    [statusFilter, dateFilter].forEach(filter => {
        filter.addEventListener('change', function() {
            currentPage = 1;
            loadSellerListings();
        });
    });
    
    // Pagination event listeners
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadSellerListings();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            loadSellerListings();
        }
    });
    
    // Export button
    exportBtn.addEventListener('click', function() {
        // In a real app, this would generate a CSV or PDF of the sales dashboard
        alert('Export functionality would go here. This would typically generate a CSV or PDF of your sales dashboard which can be used for tax purposes or business analytics.');
    });
    
    // Fetch listings from the database
    async function loadSellerListings() {
        try {
            // Show loading state
            tableBody.innerHTML = '<tr><td colspan="7" class="loading-message">Loading your listings...</td></tr>';
            
            // Get filters
            const filters = {
                search: searchInput.value.trim(),
                status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
                page: currentPage,
                limit: itemsPerPage
            };
            
            // Add date filter if selected
            if (dateFilter.value !== 'all') {
                filters.dateRange = dateFilter.value;
            }
            
            // Fetch listings from API
            const response = await getSellerListings(filters);
            displaySalesDashboard(response.listings, response.pagination);
            updateStats(response.stats);
        } catch (error) {
            console.error('Error loading listings:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="error-message">
                Failed to load listings: ${error.message}
                <button class="retry-btn">Retry</button>
            </td></tr>`;
            
            // Add retry button functionality
            const retryBtn = tableBody.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadSellerListings);
            }
            
            // Show empty state
            emptyState.style.display = 'block';
            tableWrapper.style.display = 'none';
        }
    }
    
    // Display listings in the dashboard
    function displaySalesDashboard(listings, pagination) {
        // Clear table
        tableBody.innerHTML = '';
        
        // Update pagination
        if (pagination) {
            totalPages = pagination.totalPages || 1;
            updatePagination();
        }
        
        if (!listings || listings.length === 0) {
            // Show empty state
            emptyState.style.display = 'flex';
            tableWrapper.style.display = 'none';
        } else {
            // Hide empty state
            emptyState.style.display = 'none';
            tableWrapper.style.display = 'block';
            
            // Populate table
            listings.forEach(listing => {
                const row = document.createElement('tr');
                
                // Format the end date
                const endDate = new Date(listing.endDate);
                const formattedDate = endDate.toLocaleDateString('en-IN', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
                
                // Format prices
                const startingPrice = `₹${parseFloat(listing.pricing.startingPrice).toLocaleString('en-IN')}`;
                const soldPrice = listing.winningBid 
                    ? `₹${parseFloat(listing.winningBid.amount).toLocaleString('en-IN')}` 
                    : '-';
                
                // Status badge class
                let statusClass = '';
                switch(listing.status) {
                    case 'active':
                        statusClass = 'status-active';
                        break;
                    case 'inactive':
                        statusClass = 'status-inactive';
                        break;
                    case 'sold':
                        statusClass = 'status-success';
                        break;
                    case 'unsold':
                        statusClass = 'status-danger';
                        break;
                    case 'draft':
                        statusClass = 'status-draft';
                        break;
                    default:
                        statusClass = 'status-pending';
                }
                
                // Is the listing visible to buyers?
                const isVisible = listing.status === 'active';
                const eyeIcon = isVisible ? 'fa-eye' : 'fa-eye-slash';
                const eyeTitle = isVisible ? 'Make Invisible to Buyers' : 'Make Visible to Buyers';
                
                // Create row content
                row.innerHTML = `
                    <td class="item-cell">
                        <div class="item-info">
                            <img src="${listing.images && listing.images.length > 0 ? listing.images[0] : '../public/uploads/placeholder-image1.jpg'}" alt="${listing.title}" class="item-thumbnail">
                            <div>
                                <div class="item-title">${listing.title}</div>
                                <div class="item-category ${listing.category}">${listing.category}</div>
                            </div>
                        </div>
                    </td>
                    <td>${startingPrice}</td>
                    <td>${soldPrice}</td>
                    <td>${listing.bids ? listing.bids.length : 0}</td>
                    <td>${formattedDate}</td>
                    <td><span class="status-badge ${statusClass}">${listing.status}</span></td>
                    <td class="actions-cell">
                        <button class="action-btn view-details-btn" data-id="${listing._id}" title="View Details">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="action-btn visibility-btn" data-id="${listing._id}" data-visible="${isVisible}" title="${eyeTitle}">
                            <i class="fas ${eyeIcon}"></i>
                        </button>
                        ${listing.status !== 'sold' ? 
                            `<button class="action-btn delete-btn" data-id="${listing._id}" title="Delete Listing">
                                <i class="fas fa-trash"></i>
                            </button>` : ''
                        }
                    </td>
                `;
                
                // Add event listeners for action buttons
                const viewDetailsBtn = row.querySelector('.view-details-btn');
                if (viewDetailsBtn) {
                    viewDetailsBtn.addEventListener('click', () => {
                        window.location.href = `bidder_details.html?id=${listing._id}`;
                    });
                }
                
                const visibilityBtn = row.querySelector('.visibility-btn');
                if (visibilityBtn) {
                    visibilityBtn.addEventListener('click', () => toggleVisibility(listing._id, !isVisible));
                }
                
                const deleteBtn = row.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => deleteListing(listing._id));
                }
                
                tableBody.appendChild(row);
            });
        }
    }
    
    // Update stats based on seller's listings
    function updateStats(stats) {
        if (stats) {
            // Update stat values
            statValues[0].textContent = stats.totalListings || 0;
            statValues[1].textContent = stats.soldItems || 0;
            statValues[2].textContent = stats.activeListings || 0;
            statValues[3].textContent = `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`;
        } else {
            // Reset stats if no data available
            statValues.forEach(stat => stat.textContent = '0');
            statValues[3].textContent = '₹0';
        }
    }
    
    // Update pagination controls
    function updatePagination() {
        // Enable/disable pagination buttons
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
        
        // Update page numbers
        pageNumbersContainer.innerHTML = '';
        
        // Determine range of page numbers to display
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust start if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Add first page if not included
        if (startPage > 1) {
            const pageSpan = document.createElement('span');
            pageSpan.className = 'page-number';
            pageSpan.textContent = '1';
            pageSpan.addEventListener('click', () => {
                currentPage = 1;
                loadSellerListings();
            });
            pageNumbersContainer.appendChild(pageSpan);
            
            // Add ellipsis if needed
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
        }
        
        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageSpan = document.createElement('span');
            pageSpan.className = 'page-number';
            pageSpan.textContent = i;
            
            if (i === currentPage) {
                pageSpan.classList.add('active');
            }
            
            pageSpan.addEventListener('click', () => {
                if (i !== currentPage) {
                    currentPage = i;
                    loadSellerListings();
                }
            });
            
            pageNumbersContainer.appendChild(pageSpan);
        }
        
        // Add last page if not included
        if (endPage < totalPages) {
            // Add ellipsis if needed
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
            
            const pageSpan = document.createElement('span');
            pageSpan.className = 'page-number';
            pageSpan.textContent = totalPages;
            pageSpan.addEventListener('click', () => {
                currentPage = totalPages;
                loadSellerListings();
            });
            pageNumbersContainer.appendChild(pageSpan);
        }
    }
    
    // Actions for listings
    function deleteListing(listingId) {
        if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            // Show loading state
            const button = document.querySelector(`.delete-btn[data-id="${listingId}"]`);
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
            }
            
            // Use the deleteAuction API function instead of fetch
            deleteAuction(listingId)
                .then(response => {
                    // Reload listings after deletion
                    loadSellerListings();
                    // Show success notification
                    showNotification('Listing deleted successfully', 'success');
                })
                .catch(error => {
                    console.error('Error deleting listing:', error);
                    showNotification(`Failed to delete listing: ${error.message}`, 'error');
                    
                    // Reset button state
                    if (button) {
                        button.innerHTML = originalHTML;
                        button.disabled = false;
                    }
                });
        }
    }
    
    // Toggle listing visibility (show/hide from buyers)
    function toggleVisibility(listingId, makeVisible) {
        const action = makeVisible ? 'visible' : 'invisible';
        const confirmMsg = `Make this listing ${action} to buyers?`;
        
        if (confirm(confirmMsg)) {
            // Show loading state on the button
            const button = document.querySelector(`.visibility-btn[data-id="${listingId}"]`);
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                button.disabled = true;
            }
            
            // Call API to toggle visibility
            toggleListingVisibility(listingId, makeVisible)
                .then(response => {
                    // Reload listings to reflect changes
                    loadSellerListings();
                    
                    // Show success message
                    const message = makeVisible 
                        ? 'Listing is now visible to buyers' 
                        : 'Listing is now hidden from buyers';
                    showNotification(message, 'success');
                })
                .catch(error => {
                    console.error('Error toggling listing visibility:', error);
                    showNotification(`Failed to update listing: ${error.message}`, 'error');
                    
                    // Reset button state
                    if (button) {
                        button.innerHTML = originalHTML;
                        button.disabled = false;
                    }
                });
        }
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
    
    // Notification helper
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Fade out and remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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