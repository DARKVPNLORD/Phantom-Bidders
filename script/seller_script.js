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

    // Logout functionality
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // If auth.js is loaded, use its logout function, otherwise implement basic logout
            if (typeof logoutUser === 'function') {
                logoutUser();
            } else {
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
                window.location.href = '../html/login_signup.html';
            }
        });
    }

    // Animate feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate');
        }, 100 * (index + 1));
        
        const button = card.querySelector('.feature-btn');
        button.addEventListener('click', function() {
            const buttonText = this.querySelector('span').textContent.trim();
            
            // Go to the respective page based on the button text
            if (buttonText.includes('Listing')) {
                window.location.href = '../html/create_listing.html';
            } else if (buttonText.includes('Stats')) {
                // window.location.href = '../html/analytics_dashboard.html';
            } else if (buttonText.includes('Earnings')) {
                // window.location.href = '../html/earnings.html';
            }
        });
    });
    
    // Add scroll observer for animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.1 });
    
    featureCards.forEach(card => {
        observer.observe(card);
    });
});

/**
 * Display user info in profile dropdown and welcome section
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