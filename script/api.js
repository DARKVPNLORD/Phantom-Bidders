// API Utilities for Phantom Bidders

const API_URL = '/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {object} data - Request body for POST, PUT requests
 * @returns {Promise} - Response from API
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        // Ensure endpoint starts with a slash
        if (!endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
        }
        
        // Construct the full URL - Use window.location.origin for absolute URLs
        const url = `${window.location.origin}${API_URL}${endpoint}`;
        console.log(`Making API request to: ${url}`);
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        };

        // Add auth token to headers if available
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('Using auth token for request');
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        console.log(`API Request options:`, {
            method,
            endpoint,
            hasToken: !!token,
            hasData: !!data
        });
        
        const response = await fetch(url, options);
        
        // Log response status
        console.log(`API Response status: ${response.status} ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();
            
            if (!response.ok) {
                console.error('API Error:', json);
                throw new Error(json.message || `Error ${response.status}: ${response.statusText}`);
            }
            
            return json;
        } else {
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            return await response.text();
        }
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Register a new user
 * @param {object} userData - User data for registration
 * @returns {Promise} - Response from API
 */
async function registerUser(userData) {
    return await apiRequest('/users/register', 'POST', userData);
}

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Response from API
 */
async function loginUser(email, password) {
    return await apiRequest('/users/login', 'POST', { email, password });
}

/**
 * Get current user profile
 * @returns {Promise} - Response from API
 */
async function getCurrentUser() {
    return await apiRequest('/users/me');
}

/**
 * Update user profile
 * @param {object} userData - Updated user data
 * @returns {Promise} - Response from API with normalized data
 */
async function updateUserProfile(userData) {
    try {
        console.log('Updating user profile with data:', userData);
        const result = await apiRequest('/users/me', 'PUT', userData);
        console.log('Profile update response:', result);
        
        // Normalize response to ensure consistent format
        if (!result) {
            throw new Error('Empty response from update user API');
        }
        
        // If response is just the raw user object without a wrapper
        if (!result.user && typeof result === 'object' && result.name) {
            console.log('Converting raw user object to expected format');
            return { 
                user: result,
                success: true 
            };
        }
        
        // If the response has data property instead of user property
        if (!result.user && result.data) {
            console.log('Converting data property to user property');
            return {
                user: result.data,
                success: true
            };
        }
        
        // Already in expected format
        if (result.user) {
            return result;
        }
        
        // Unknown format, wrap as best we can
        console.warn('Unknown response format from update user API, normalizing');
        return { 
            user: result,
            success: true 
        };
    } catch (error) {
        console.error('Failed to update user profile:', error);
        throw error;
    }
}

/**
 * Get auctions with filters
 * @param {object} filters - Filters for auctions
 * @returns {Promise} - Response from API
 */
async function getAuctions(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    // Add filters to query parameters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            queryParams.append(key, value);
        }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    console.log(`Getting auctions with query string: ${queryString}`);
    
    try {
        const result = await apiRequest(`/auctions${queryString}`);
        
        // Validate response structure
        if (!result) {
            throw new Error('Empty response from auctions API');
        }
        
        // If response is an array, convert to expected format
        if (Array.isArray(result)) {
            console.log(`Received ${result.length} auctions as array, converting to object format`);
            return {
                listings: result,
                total: result.length,
                page: filters.page || 1,
                limit: filters.limit || result.length
            };
        }
        
        // Ensure result has the expected fields
        if (!result.listings && result.auctions) {
            result.listings = result.auctions;
        }
        
        if (!result.listings) {
            console.warn('No listings found in response, creating empty listings array');
            result.listings = [];
        }
        
        if (!result.total && result.listings) {
            result.total = result.listings.length;
        }
        
        return result;
    } catch (error) {
        console.error('Failed to get auctions:', error);
        throw error;
    }
}

/**
 * Get auction by ID
 * @param {string} auctionId - Auction ID
 * @returns {Promise} - Response from API
 */
async function getAuctionById(auctionId) {
    console.log(`Getting auction by ID: ${auctionId}`);
    try {
        const result = await apiRequest(`/auctions/${auctionId}`);
        console.log('Auction data received:', result);
        return result;
    } catch (error) {
        console.error(`Failed to get auction with ID ${auctionId}:`, error);
        throw error;
    }
}

/**
 * Create a new auction
 * @param {object} auctionData - Auction data
 * @returns {Promise} - Response from API
 */
async function createAuction(auctionData) {
    return await apiRequest('/auctions', 'POST', auctionData);
}

/**
 * Update an existing auction
 * @param {string} auctionId - Auction ID
 * @param {object} auctionData - Updated auction data
 * @returns {Promise} - Response from API
 */
async function updateAuction(auctionId, auctionData) {
    return await apiRequest(`/auctions/${auctionId}`, 'PATCH', auctionData);
}

/**
 * Place a bid on an auction
 * @param {string} auctionId - Auction ID
 * @param {number} amount - Bid amount
 * @returns {Promise} - Response from API
 */
async function placeBid(auctionId, amount) {
    return await apiRequest(`/auctions/${auctionId}/bid`, 'POST', { amount });
}

/**
 * Get seller's listings
 * @param {object} filters - Optional filters (status, page, limit)
 * @returns {Promise} - Response from API containing seller's listings
 */
async function getSellerListings(filters = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            queryParams.append(key, value);
        }
    });
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return await apiRequest(`/auctions/seller/listings${queryString}`);
}

/**
 * Toggle listing visibility (make it visible/invisible to buyers)
 * @param {string} listingId - Listing ID
 * @param {boolean} isVisible - Whether the listing should be visible
 * @returns {Promise} - Response from API
 */
async function toggleListingVisibility(listingId, isVisible) {
    return await apiRequest(`/auctions/${listingId}/visibility`, 'PATCH', { 
        visible: isVisible 
    });
}

// Store auth token in localStorage
function storeAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Remove auth token from localStorage
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// Add auth token to requests
function addAuthTokenToRequest(options) {
    const token = getAuthToken();
    if (token) {
        if (!options.headers) {
            options.headers = {};
        }
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    return options;
}

/**
 * Get user's bid history
 * @param {object} filters - Optional filters (status, page, limit, date)
 * @returns {Promise} - Response from API containing user's bid history
 */
async function getUserBidHistory(filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // Add filters to query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== 'all') {
                queryParams.append(key, value);
            }
        });
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        console.log(`Getting user bid history with query string: ${queryString}`);
        
        // Use the buyer/bids endpoint to get the user's bid history
        const result = await apiRequest(`/auctions/buyer/bids${queryString}`);
        
        // Validate response
        if (!result) {
            throw new Error('Empty response from bid history API');
        }
        
        console.log('Bid history data received:', result);
        
        return result;
    } catch (error) {
        console.error('Failed to get bid history:', error);
        throw error;
    }
}

/**
 * Get bids for a specific auction
 * @param {string} auctionId - Auction ID
 * @param {object} filters - Optional filters (page, limit)
 * @returns {Promise} - Response from API containing auction's bids
 */
async function getAuctionBids(auctionId, filters = {}) {
    try {
        // Build query string from filters
        const queryParams = new URLSearchParams();
        
        // Add filters to query parameters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                queryParams.append(key, value);
            }
        });
        
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        console.log(`Getting bids for auction ${auctionId} with query string: ${queryString}`);
        
        // Custom endpoint to get bids for specific auction - will need to be created on the backend
        const result = await apiRequest(`/auctions/${auctionId}/bids${queryString}`);
        
        // Validate response
        if (!result) {
            throw new Error('Empty response from auction bids API');
        }
        
        console.log('Auction bids data received:', result);
        
        return result;
    } catch (error) {
        console.error(`Failed to get bids for auction ${auctionId}:`, error);
        throw error;
    }
}

/**
 * Delete an auction/listing
 * @param {string} auctionId - Auction ID to delete
 * @returns {Promise} - Response from API
 */
async function deleteAuction(auctionId) {
    try {
        console.log(`Deleting auction with ID: ${auctionId}`);
        const result = await apiRequest(`/auctions/${auctionId}`, 'DELETE');
        console.log('Auction deleted successfully:', result);
        return result;
    } catch (error) {
        console.error(`Failed to delete auction with ID ${auctionId}:`, error);
        throw error;
    }
}

/**
 * Get bidder details by ID
 * @param {string} bidderId - Bidder's user ID
 * @returns {Promise} - Response from API containing bidder's details
 */
async function getBidderDetails(bidderId) {
    try {
        console.log(`Getting bidder details for ID: ${bidderId}`);
        // Add includeContact=true parameter to request contact details including phone
        const result = await apiRequest(`/users/${bidderId}?includeContact=true`);
        console.log('Bidder details received:', result);
        
        // If the API doesn't return the expected structure, try to normalize it
        if (result && !result.user && result.data) {
            return { user: result.data, success: true };
        } else if (result && !result.user && typeof result === 'object') {
            return { user: result, success: true };
        }
        
        return result;
    } catch (error) {
        console.error(`Failed to get bidder details with ID ${bidderId}:`, error);
        throw error;
    }
}

/**
 * Delete user account
 * @param {string} userId - Optional user ID. If not provided, deletes the current user
 * @returns {Promise} - Response from API
 */
async function deleteUserAccount(userId = null) {
    try {
        console.log('Deleting user account from database');
        
        // If userId is provided, delete that specific user (admin functionality)
        // Otherwise delete the current logged-in user
        const endpoint = userId ? `/users/${userId}` : '/users/me';
        const result = await apiRequest(endpoint, 'DELETE');
        
        console.log('User account deleted successfully from database:', result);
        
        // Clear local storage to log user out if they deleted their own account
        if (!userId) {
            localStorage.removeItem('user');
            localStorage.removeItem('authToken');
        }
        
        return result;
    } catch (error) {
        console.error('Failed to delete user account from database:', error);
        throw error;
    }
}

/**
 * Update user password
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password to set
 * @returns {Promise} - Response from API with normalized data
 */
async function updateUserPassword(currentPassword, newPassword) {
    try {
        console.log('Updating user password');
        
        // Validate inputs
        if (!currentPassword || !newPassword) {
            throw new Error('Current password and new password are required');
        }
        
        // Real API request
        const result = await apiRequest('/users/me/password', 'PUT', {
            currentPassword,
            newPassword
        });
        
        console.log('Password update response:', result);
        
        // Normalize response to ensure consistent format
        if (!result) {
            throw new Error('Empty response from update password API');
        }
        
        // If response is an object with success property
        if (typeof result === 'object') {
            if (result.success === false) {
                throw new Error(result.message || 'Password update failed');
            }
            return {
                success: true,
                message: result.message || 'Password updated successfully'
            };
        }
        
        // Return a standardized success response
        return {
            success: true,
            message: 'Password updated successfully'
        };
    } catch (error) {
        console.error('Failed to update password:', error);
        throw error;
    }
} 