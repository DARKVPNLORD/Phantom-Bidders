document.addEventListener('DOMContentLoaded', async function() {
    // Load user data from database
    await loadUserData();
    
    // Tab switching functionality
    const navItems = document.querySelectorAll('.settings-nav li');
    const tabs = document.querySelectorAll('.settings-tab');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the tab ID to show
            const tabId = this.getAttribute('data-tab');
            
            // Hide all tabs
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabId).classList.add('active');
            
            // Add animation
            document.getElementById(tabId).style.animation = 'none';
            setTimeout(() => {
                document.getElementById(tabId).style.animation = 'fadeIn 0.5s ease';
            }, 10);
        });
    });
    
    // Range slider value display
    const rangeSliders = document.querySelectorAll('.slider');
    rangeSliders.forEach(slider => {
        if (slider) {
            const rangeValue = slider.nextElementSibling;
            if (rangeValue && rangeValue.classList.contains('range-value')) {
                slider.addEventListener('input', function() {
                    rangeValue.textContent = `${this.value}% above starting bid`;
                });
            }
        }
    });
    
    // Toggle for return policy
    const returnToggle = document.querySelector('#selling .toggle-item input[type="checkbox"]');
    const returnOptions = document.querySelector('#selling .indent-form');
    
    if (returnToggle && returnOptions) {
        returnToggle.addEventListener('change', function() {
            if (this.checked) {
                returnOptions.classList.add('visible');
            } else {
                returnOptions.classList.remove('visible');
            }
        });
    }
    
    // Show/hide reserve price options based on radio selection
    const reserveRadios = document.querySelectorAll('input[name="reserve"]');
    const reserveForm = document.querySelector('.indent-form');
    
    if (reserveRadios.length > 0 && reserveForm) {
        reserveRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'percentage' || this.value === 'fixed') {
                    reserveForm.classList.add('visible');
                } else {
                    reserveForm.classList.remove('visible');
                }
            });
        });
    }
    
    // Load user data into form fields
    async function loadUserData() {
        try {
            // Get user data from API instead of localStorage
            const response = await getCurrentUser();
            console.log('User data from API:', response);
            
            let userData = null;
            
            // Normalize response
            if (response && response.user) {
                userData = response.user;
            } else if (response && typeof response === 'object' && response.name) {
                // Direct user object
                userData = response;
            } else if (response && response.data) {
                // Data wrapper
                userData = response.data;
            }
            
            if (userData) {
                // Store user data in localStorage for other parts of the app
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Fill form fields
                fillFormFields(userData);
                
                console.log('User data loaded from database');
            } else {
                console.warn('Failed to load user data from API');
                // Try to load from localStorage as fallback
                const localUserData = JSON.parse(localStorage.getItem('user'));
                
                if (localUserData) {
                    fillFormFields(localUserData);
                }
            }
        } catch (error) {
            console.error('Error loading user data from database:', error);
            showNotification('Could not load user data from server. Using cached data.', 'warning');
            
            // Try to load from localStorage as fallback
            const localUserData = JSON.parse(localStorage.getItem('user'));
            
            if (localUserData) {
                fillFormFields(localUserData);
            }
        }
    }
    
    // Helper function to fill form fields
    function fillFormFields(userData) {
        // Populate name field
        const nameInput = document.querySelector('.user-name-input');
        if (nameInput) {
            nameInput.value = userData.name || '';
        }
        
        // Populate email field
        const emailInput = document.querySelector('.user-email-input');
        if (emailInput) {
            emailInput.value = userData.email || '';
        }
        
        // Populate phone field if exists
        const phoneInput = document.querySelector('.user-phone-input');
        if (phoneInput && userData.details && userData.details.phone) {
            phoneInput.value = userData.details.phone || '';
        } else if (phoneInput && userData.phone) {
            phoneInput.value = userData.phone || '';
        }
    }
    
    // Form submission handlers
    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    
    // Handle profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Add loading state to submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Saving...';
            submitBtn.disabled = true;
            
            try {
                const nameInput = this.querySelector('#display-name');
                const phoneInput = this.querySelector('#phone');
                
                if (nameInput) {
                    // Prepare data for API update
                    const updateData = {};
                    
                    // Update name
                    updateData.name = nameInput.value;
                    
                    // Update phone if exists
                    if (phoneInput) {
                        updateData.phone = phoneInput.value;
                        
                        // Also update nested structure for API compatibility
                        updateData.details = { phone: phoneInput.value };
                    }
                    
                    // Update in database
                    const result = await updateUserProfile(updateData);
                    console.log('User profile updated in database:', result);
                    
                    if (result && result.user) {
                        // Update local storage
                        localStorage.setItem('user', JSON.stringify(result.user));
                        
                        // Update displayed username
                        const usernameDisplays = document.querySelectorAll('.username-display');
                        usernameDisplays.forEach(element => {
                            if (!element.closest('.profile-btn')) {
                                element.textContent = result.user.name || result.user.username || 'User';
                            }
                        });
                        
                        // Show success notification
                        showNotification('Profile updated successfully! Reloading page...', 'success');
                        
                        // Reload the page after a short delay to show the notification
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        // Still show success notification even with unexpected data format
                        showNotification('Profile updated successfully! Reloading page...', 'success');
                        
                        // Reload the page after a short delay
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification(`Failed to update profile: ${error.message}`, 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Handle password form submission
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Password form submitted');
            
            // Add loading state to submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Updating...';
            submitBtn.disabled = true;
            
            // Reset previous error messages
            const errorElements = this.querySelectorAll('.input-error');
            errorElements.forEach(element => element.remove());
            
            try {
                const currentPassword = this.querySelector('#current-password').value;
                const newPassword = this.querySelector('#new-password').value;
                const confirmPassword = this.querySelector('#confirm-password').value;
                
                // Validate passwords
                let hasError = false;
                
                if (!currentPassword) {
                    showInputError(this.querySelector('#current-password'), 'Current password is required');
                    hasError = true;
                }
                
                if (!newPassword) {
                    showInputError(this.querySelector('#new-password'), 'New password is required');
                    hasError = true;
                } else if (newPassword.length < 6) {
                    showInputError(this.querySelector('#new-password'), 'Password must be at least 6 characters');
                    hasError = true;
                }
                
                if (!confirmPassword) {
                    showInputError(this.querySelector('#confirm-password'), 'Please confirm your new password');
                    hasError = true;
                } else if (newPassword !== confirmPassword) {
                    showInputError(this.querySelector('#confirm-password'), 'Passwords do not match');
                    hasError = true;
                }
                
                if (hasError) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    return;
                }
                
                console.log('Attempting to update password...');
                
                // Send password change request
                try {
                    // Use the dedicated function instead of direct API request
                    const result = await updateUserPassword(currentPassword, newPassword);
                    
                    if (result && result.success) {
                        showNotification('Password updated successfully!', 'success');
                        
                        // Clear password fields
                        this.querySelector('#current-password').value = '';
                        this.querySelector('#new-password').value = '';
                        this.querySelector('#confirm-password').value = '';
                    } else {
                        throw new Error(result.message || 'Unknown error occurred');
                    }
                } catch (passwordError) {
                    console.error('Password update error:', passwordError);
                    
                    // Check specific error messages
                    if (passwordError.message.includes('incorrect')) {
                        showInputError(this.querySelector('#current-password'), 'Current password is incorrect');
                    } else {
                        showNotification(`Password update failed: ${passwordError.message}`, 'error');
                    }
                    
                    // Reset current password field for security
                    this.querySelector('#current-password').value = '';
                }
            } catch (error) {
                console.error('Error handling password form:', error);
                showNotification(`An unexpected error occurred: ${error.message}`, 'error');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    } else {
        console.error('Password form not found in the document');
    }
    
    // Helper function to show input errors
    function showInputError(inputElement, message) {
        // Remove any existing error for this input
        const parent = inputElement.parentElement;
        const existingError = parent.querySelector('.input-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and add error message
        const errorElement = document.createElement('div');
        errorElement.className = 'input-error';
        errorElement.textContent = message;
        parent.appendChild(errorElement);
        
        // Highlight the input
        inputElement.classList.add('error');
        
        // Add event listener to remove error when input changes
        inputElement.addEventListener('input', function() {
            const error = parent.querySelector('.input-error');
            if (error) {
                error.remove();
                inputElement.classList.remove('error');
            }
        }, { once: true });
    }
    
    // Payment card action buttons
    const editBtns = document.querySelectorAll('.edit-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.payment-card');
            const cardName = card.querySelector('h5').textContent;
            showNotification(`Editing ${cardName}`, 'info');
            // In a real app, this would open an edit form/modal
        });
    });
    
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.payment-card');
            const cardName = card.querySelector('h5').textContent;
            
            // Confirm before delete
            if (confirm(`Are you sure you want to delete ${cardName}?`)) {
                // Animation for removal
                card.style.opacity = '0';
                card.style.transform = 'translateY(-10px)';
                card.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    card.remove();
                    showNotification(`${cardName} has been removed`, 'warning');
                }, 300);
            }
        });
    });
    
    // Add payment method button
    const addPaymentBtn = document.querySelector('.add-btn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            showNotification('Add payment method form would open here', 'info');
            // In a real app, this would open a form/modal
        });
    }
    
    // Danger zone - Delete account button
    const deleteAccountBtn = document.querySelector('.danger-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted from our servers.')) {
                try {
                    // Show loading state
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
                    this.disabled = true;
                    
                    // Delete account from database
                    await deleteUserAccount();
                    
                    showNotification('Account deleted successfully. Redirecting to login page...', 'success');
                    
                    // Redirect to login page after a delay
                    setTimeout(() => {
                        window.location.href = 'login_signup.html';
                    }, 2000);
                } catch (error) {
                    console.error('Error deleting account:', error);
                    showNotification(`Failed to delete account: ${error.message}`, 'error');
                    
                    // Reset button
                    this.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Account';
                    this.disabled = false;
                }
            }
        });
    }
    
    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification badge
        const notification = document.createElement('div');
        notification.className = `notification-badge ${type}`;
        
        // Add appropriate icon based on notification type
        let iconClass = 'info-circle';
        if (type === 'success') iconClass = 'check-circle';
        if (type === 'warning') iconClass = 'exclamation-triangle';
        if (type === 'error') iconClass = 'times-circle';
        
        // Set content with icon and message
        notification.innerHTML = `
            <i class="fas fa-${iconClass}"></i>
            <span>${message}</span>
        `;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.5s forwards';
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
}); 