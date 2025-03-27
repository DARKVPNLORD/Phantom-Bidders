// Authentication utility functions

/**
 * Check if user is logged in and update UI accordingly
 */
function checkAuthStatus() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const authToken = localStorage.getItem('authToken');
    
    if (userData && authToken) {
        // User is logged in, update UI
        updateUIForLoggedInUser(userData);
        return userData;
    } else {
        // User is not logged in
        updateUIForLoggedOutUser();
        return null;
    }
}

/**
 * Update UI elements for logged in user
 * @param {Object} user - User data
 */
function updateUIForLoggedInUser(user) {
    // Hide login/register links
    const loginLinks = document.querySelectorAll('a[href="/login"], a[href="/html/login_signup.html"]');
    loginLinks.forEach(link => {
        if (link.parentElement && link.parentElement.tagName === 'LI') {
            link.parentElement.classList.add('d-none');
        }
    });
    
    // Show profile elements with user name
    const usernameDisplays = document.querySelectorAll('.username-display');
    usernameDisplays.forEach(element => {
        element.textContent = user.name || user.username || 'User';
    });
    
    // Show profile links if they exist
    const profileLinks = document.querySelectorAll('.profile-link');
    profileLinks.forEach(element => {
        element.textContent = user.name || user.username || 'User';
        if (element.parentElement) {
            element.parentElement.classList.remove('d-none');
        }
    });
    
    // Show logout button
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.classList.remove('d-none');
        // Add logout functionality
        button.addEventListener('click', logoutUser);
    });
    
    // Show role-specific elements
    if (user.role === 'seller') {
        document.querySelectorAll('.seller-only').forEach(element => {
            element.classList.remove('d-none');
        });
        document.querySelectorAll('.buyer-only').forEach(element => {
            element.classList.add('d-none');
        });
    } else {
        document.querySelectorAll('.buyer-only').forEach(element => {
            element.classList.remove('d-none');
        });
        document.querySelectorAll('.seller-only').forEach(element => {
            element.classList.add('d-none');
        });
    }
}

/**
 * Update UI elements for logged out user
 */
function updateUIForLoggedOutUser() {
    // Show login/register links
    const loginLinks = document.querySelectorAll('a[href="/login"], a[href="/html/login_signup.html"]');
    loginLinks.forEach(link => {
        if (link.parentElement && link.parentElement.tagName === 'LI') {
            link.parentElement.classList.remove('d-none');
        }
    });
    
    // Reset username displays
    const usernameDisplays = document.querySelectorAll('.username-display');
    usernameDisplays.forEach(element => {
        if (element.closest('.profile-btn')) {
            element.textContent = 'My Profile';
        } else {
            element.textContent = 'Guest';
        }
    });
    
    // Hide profile elements
    const profileElements = document.querySelectorAll('.profile-link, .logout-btn');
    profileElements.forEach(element => {
        if (element.parentElement) {
            element.parentElement.classList.add('d-none');
        }
    });
    
    // Hide role-specific elements
    document.querySelectorAll('.seller-only, .buyer-only').forEach(element => {
        element.classList.add('d-none');
    });
}

/**
 * Log out the current user
 */
function logoutUser(event) {
    if (event) {
        event.preventDefault();
    }
    
    // Remove user data from local storage
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Update UI
    updateUIForLoggedOutUser();
    
    // Show logout animation
    const logoutAnimationContainer = document.querySelector('.logout-animation-container');
    if (logoutAnimationContainer) {
        logoutAnimationContainer.classList.add('show');
        
        // Add particles for visual effect
        const particlesContainer = document.querySelector('.logout-particles');
        if (particlesContainer) {
            for (let i = 0; i < 15; i++) {
                const particle = document.createElement('div');
                particle.classList.add('particle');
                
                // Randomize position and animation delay
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                particle.style.animationDelay = `${Math.random() * 1.5}s`;
                
                // Add to container
                particlesContainer.appendChild(particle);
            }
        }
        
        // Redirect after animation completes
        setTimeout(() => {
            window.location.href = '/html/login_signup.html';
        }, 3000); // Match this with the animation duration
    } else {
        // Fallback if animation container not found
        window.location.href = '/html/login_signup.html';
    }
}

// Check auth status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
}); 