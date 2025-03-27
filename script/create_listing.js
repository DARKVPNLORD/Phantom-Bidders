document.addEventListener('DOMContentLoaded', function() {
    // Check if auth.js has loaded, if not, manually display user name
    if (typeof checkAuthStatus !== 'function') {
        displayUserInfo();
    }
    
    // Dropdown menu functionality
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    let dropdownTimeout;

    // Variables for edit mode
    let isEditMode = false;
    let listingId = null;
    let originalListing = null;

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('edit')) {
        isEditMode = true;
        listingId = urlParams.get('edit');
        // Update page UI for edit mode
        updateUIForEditMode();
        // Load the listing data
        loadListingData(listingId);
    }

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

    // Create Listing Form Functionality
    const listingForm = document.getElementById('listing-form');
    const itemTitle = document.getElementById('item-title');
    const itemCategory = document.getElementById('item-category');
    const itemCondition = document.getElementById('item-condition');
    const itemDescription = document.getElementById('item-description');
    const startingPrice = document.getElementById('starting-price');
    const reservePriceToggle = document.getElementById('reserve-price-toggle');
    const reservePrice = document.getElementById('reserve-price');
    const reservePriceContainer = document.getElementById('reserve-price-container');
    const bidIncrement = document.getElementById('bid-increment');
    const auctionDuration = document.getElementById('auction-duration');
    const shippingOption = document.getElementById('shipping-option');
    const pickupOption = document.getElementById('pickup-option');
    const shippingDetails = document.getElementById('shipping-details');
    const shippingCost = document.getElementById('shipping-cost');
    const photoUpload = document.getElementById('photo-upload');
    const photoPreviewContainer = document.querySelector('.photo-preview-container');
    const cancelBtn = document.querySelector('.cancel-btn');
    const saveDraftBtn = document.querySelector('.save-draft-btn');
    const publishBtn = document.querySelector('.publish-btn');
    const charCount = document.querySelector('.char-count');
    
    // Character counter for description
    itemDescription.addEventListener('input', function() {
        const currentLength = this.value.length;
        charCount.textContent = `${currentLength}/2000 characters`;
        
        if (currentLength > 2000) {
            charCount.style.color = '#ff4d4d';
        } else {
            charCount.style.color = '';
        }
    });
    
    // Toggle reserve price
    reservePriceToggle.addEventListener('change', function() {
        reservePriceContainer.classList.toggle('hidden', !this.checked);
    });
    
    // Toggle shipping details
    shippingOption.addEventListener('change', function() {
        shippingDetails.classList.toggle('hidden', !this.checked);
    });
    
    // Ensure at least one shipping option is selected
    [shippingOption, pickupOption].forEach(option => {
        option.addEventListener('change', function() {
            if (!shippingOption.checked && !pickupOption.checked) {
                // Re-check the one that was just unchecked
                this.checked = true;
                alert('Please select at least one shipping option.');
            }
        });
    });
    
    // Photo upload preview
    let selectedFiles = [];
    let existingImageUrls = [];
    
    photoUpload.addEventListener('change', function() {
        // Store the selected files
        selectedFiles = Array.from(this.files);
        
        // Check total files (existing + new)
        const totalImages = selectedFiles.length + existingImageUrls.length;
        if (totalImages > 8) {
            alert(`Maximum 8 photos allowed. You already have ${existingImageUrls.length} images.`);
            selectedFiles = [];
            this.value = '';
            return;
        }
        
        if (selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
                const previewItem = document.createElement('div');
                previewItem.className = 'photo-preview-item new-image';
                
                // Create image preview if it's an image file
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(file);
                    img.onload = function() {
                        URL.revokeObjectURL(this.src);
                    };
                    previewItem.appendChild(img);
                    
                    // Add delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-preview';
                    deleteBtn.innerHTML = '&times;';
                    deleteBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        previewItem.remove();
                        // Remove file from selectedFiles
                        selectedFiles = selectedFiles.filter(f => f !== file);
                        updateCoverImage();
                    });
                    previewItem.appendChild(deleteBtn);
                    
                    photoPreviewContainer.appendChild(previewItem);
                    updateCoverImage();
                }
            });
        }
    });
    
    // Form buttons
    cancelBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? All your changes will be lost.')) {
            window.location.href = '../html/seller_landing.html';
        }
    });
    
    saveDraftBtn.addEventListener('click', function() {
        // Save draft functionality
        if (!validateForm(true)) {
            return;
        }
        
        // Show loading state
        saveDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveDraftBtn.disabled = true;
        
        const draftData = collectFormData();
        draftData.status = 'draft';
        
        // Save the draft to the database
        saveListingToDatabase(draftData, selectedFiles, 'draft')
            .then(() => {
                // Show success message
        showNotification('Listing saved as draft', 'success');
                
                // Reset button state
                saveDraftBtn.innerHTML = 'Save as Draft';
                saveDraftBtn.disabled = false;
                
                // Redirect to dashboard after a short delay if in edit mode
                if (isEditMode) {
                    setTimeout(() => {
                        window.location.href = '../html/sales_dashboard.html';
                    }, 2000);
                }
            })
            .catch(error => {
                // Show error message
                showNotification('Failed to save draft: ' + error.message, 'error');
                
                // Reset button state
                saveDraftBtn.innerHTML = 'Save as Draft';
                saveDraftBtn.disabled = false;
            });
    });
    
    // Form submission
    listingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic form validation
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (isEditMode ? 'Saving...' : 'Publishing...');
        publishBtn.disabled = true;
        
        // Collect form data - in edit mode, we only collect editable fields
        const listingData = collectFormData();
        
        // Set the correct status
        if (!isEditMode) {
            listingData.status = 'active';
        }
        
        // Save to database
        saveListingToDatabase(listingData, selectedFiles, isEditMode ? 'edit' : 'active')
            .then(() => {
                // Show listing animation instead of notification
                showListingSuccessAnimation();
            })
            .catch(error => {
                // Show error message
                showNotification(
                    isEditMode ? 'Failed to update listing: ' + error.message : 'Failed to publish listing: ' + error.message, 
                    'error'
                );
                
                // Reset button state
                publishBtn.innerHTML = isEditMode ? 'Save Changes' : 'Publish Listing';
                publishBtn.disabled = false;
            });
    });
    
    // Function to show the listing success animation
    function showListingSuccessAnimation() {
        const listingAnimationContainer = document.querySelector('.listing-animation-container');
        if (listingAnimationContainer) {
            // Show the container
            listingAnimationContainer.classList.add('show');
            
            // Add animate class to start animations
            const listingAnimation = listingAnimationContainer.querySelector('.listing-animation');
            if (listingAnimation) {
                listingAnimation.classList.add('animate');
            }
            
            // Add sparkle effects
            const sparkleContainer = document.querySelector('.sparkle-container');
            if (sparkleContainer) {
                // Create sparkle elements
                for (let i = 0; i < 20; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.classList.add('sparkle');
                    
                    // Randomize position, scale and animation delay
                    const size = Math.random() * 6 + 4; // 4-10px
                    sparkle.style.width = `${size}px`;
                    sparkle.style.height = `${size}px`;
                    sparkle.style.left = `${Math.random() * 100}%`;
                    sparkle.style.top = `${Math.random() * 100}%`;
                    sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
                    
                    // Add to container
                    sparkleContainer.appendChild(sparkle);
                }
            }
            
            // Redirect after animation completes
            setTimeout(() => {
                window.location.href = '../html/sales_dashboard.html';
            }, 3000); // Match this with the animation duration
        } else {
            // Fallback if animation container not found
            showNotification('Listing created successfully!', 'success');
            setTimeout(() => {
                window.location.href = '../html/sales_dashboard.html';
            }, 2000);
        }
    }
    
    // Collect data from the form
    function collectFormData() {
        const listingData = {
            title: itemTitle.value.trim(),
            category: itemCategory.value,
            condition: itemCondition.value,
            description: itemDescription.value.trim(),
            pricing: {
                startingPrice: parseFloat(startingPrice.value),
                bidIncrement: parseFloat(bidIncrement.value)
            },
            duration: parseInt(auctionDuration.value),
            shippingOptions: {
                shipping: shippingOption.checked,
                localPickup: pickupOption.checked
            }
        };
        
        // Add reserve price if set
        if (reservePriceToggle.checked && reservePrice.value) {
            listingData.pricing.reservePrice = parseFloat(reservePrice.value);
        }
        
        // Add shipping cost if shipping is offered
        if (shippingOption.checked && shippingCost.value) {
            listingData.shippingOptions.shippingCost = parseFloat(shippingCost.value);
        }
        
        // Keep existing images in edit mode
        if (isEditMode && existingImageUrls.length > 0) {
            listingData.images = existingImageUrls;
        }
        
        // In edit mode, preserve important original data
        if (isEditMode && originalListing) {
            // Keep the original ID
            listingData._id = originalListing._id;
            
            // Preserve start date and seller info
            listingData.startDate = originalListing.startDate;
            listingData.seller = originalListing.seller;
            
            // Keep bid data if it exists
            if (originalListing.bids && originalListing.bids.length > 0) {
                listingData.bids = originalListing.bids;
                // If there are bids, keep the current bid amount
                if (originalListing.pricing && originalListing.pricing.currentBid) {
                    listingData.pricing.currentBid = originalListing.pricing.currentBid;
                }
            }
            
            // In edit mode, we should only be sending the editable fields back
            // This ensures we don't overwrite fields that are supposed to be read-only
            if (isEditMode) {
                return {
                    _id: originalListing._id,
                    description: itemDescription.value.trim(),
                    duration: parseInt(auctionDuration.value),
                    shippingOptions: {
                        shipping: shippingOption.checked,
                        localPickup: pickupOption.checked,
                        shippingCost: shippingOption.checked && shippingCost.value ? 
                            parseFloat(shippingCost.value) : 
                            originalListing.shippingOptions?.shippingCost
                    }
                };
            }
            
            // Handle end date - recalculate only if duration changed
            if (originalListing.duration !== listingData.duration) {
                const now = new Date();
                const endDate = new Date(now);
                endDate.setDate(now.getDate() + listingData.duration);
                listingData.endDate = endDate.toISOString();
            } else {
                listingData.endDate = originalListing.endDate;
            }
        } else {
            // For new listings, calculate end date based on duration
            const now = new Date();
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + parseInt(auctionDuration.value));
            listingData.endDate = endDate.toISOString();
        }
        
        return listingData;
    }
    
    // Save listing to database
    async function saveListingToDatabase(listingData, files, status) {
        try {
            // First, upload any new images if present (only for new listings, not edit mode)
            if (!isEditMode && files && files.length > 0) {
                const uploadedImages = await uploadImages(files);
                listingData.images = uploadedImages.map(img => img.url);
            } else if (!isEditMode && (!listingData.images || listingData.images.length === 0)) {
                // Use placeholder images if no images uploaded (for new listings only)
                listingData.images = ['/uploads/placeholder-image1.jpg'];
            }
            
            let response;
            if (isEditMode) {
                // In edit mode, only update the allowed fields: description, duration, shipping options
                const updateData = {
                    description: listingData.description,
                    duration: listingData.duration,
                    shippingOptions: listingData.shippingOptions
                };
                
                // Recalculate end date if duration changed
                if (originalListing.duration !== listingData.duration) {
                    const startDate = new Date(originalListing.startDate || originalListing.createdAt);
                    const endDate = new Date(startDate);
                    endDate.setDate(startDate.getDate() + parseInt(listingData.duration));
                    updateData.endDate = endDate.toISOString();
                }
                
                // Update existing listing with only the editable fields
                response = await updateAuction(listingId, updateData);
                
                // Show appropriate notification
                showNotification('Listing updated successfully', 'success');
            } else {
                // Create new listing
                response = await createAuction(listingData);
            }
            return response;
        } catch (error) {
            console.error('Error saving listing:', error);
            throw error;
        }
    }
    
    // Upload images to the server
    async function uploadImages(files) {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append('images', file);
        });
        
        try {
            // Get the auth token
            const token = localStorage.getItem('authToken');
            
            // This would call an API endpoint to upload the images
            const response = await fetch('/api/auctions/uploads', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to upload images');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading images:', error);
            throw error;
        }
    }
    
    // Form validation
    function validateForm(isDraft = false) {
        // In edit mode, we only need to validate the editable fields
        if (isEditMode) {
            let valid = true;
            
            // Description can be empty for drafts but not for published listings
            if (!isDraft && !itemDescription.value.trim()) {
                itemDescription.classList.add('error');
                valid = false;
                showNotification('Please provide a description', 'error');
                return false;
            }
            
            // Make sure at least one shipping option is selected
            if (!shippingOption.checked && !pickupOption.checked) {
                valid = false;
                showNotification('Please select at least one shipping option', 'error');
                return false;
            }
            
            return valid;
        }
        
        // For new listings, use the original validation
        const requiredFields = [
            'item-title',
            'item-category',
            'item-condition',
            'item-description',
            'starting-price',
            'bid-increment',
            'auction-duration'
        ];
        
        let valid = true;
        
        // For drafts, only validate title and category
        const fieldsToValidate = isDraft 
            ? ['item-title', 'item-category'] 
            : requiredFields;
        
        fieldsToValidate.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.classList.add('error');
                valid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        if (!valid) {
            showNotification(isDraft 
                ? 'Please provide at least a title and category for your draft' 
                : 'Please fill in all required fields', 'error');
            return false;
        }
        
        // For active listings (not drafts), validate shipping options
        if (!isDraft && !shippingOption.checked && !pickupOption.checked) {
            valid = false;
            showNotification('Please select at least one shipping option', 'error');
            return false;
        }
        
        // For active listings (not drafts), check if we have at least one image
        if (!isDraft && !isEditMode && selectedFiles.length === 0) {
            valid = false;
            showNotification('Please add at least one image to your listing', 'error');
            return false;
        } else if (!isDraft && isEditMode && selectedFiles.length === 0 && existingImageUrls.length === 0) {
            valid = false;
            showNotification('Please add at least one image to your listing', 'error');
            return false;
        }
        
        // Validate prices
        if (!isDraft) {
            const startingPriceValue = parseFloat(startingPrice.value);
            const reservePriceValue = reservePriceToggle.checked ? parseFloat(reservePrice.value) : 0;
            
            if (reservePriceToggle.checked && reservePriceValue <= startingPriceValue) {
                reservePrice.classList.add('error');
                valid = false;
                showNotification('Reserve price must be higher than starting price', 'error');
                return false;
            }
        }
        
        return valid;
    }
    
    // Load existing listing data for editing
    async function loadListingData(id) {
        try {
            // Clear form first
            document.getElementById('listing-form').reset();
            
            // Show loading overlay
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading listing data...</p>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
            
            // Log for debugging
            console.log(`Attempting to fetch listing with ID: ${id}`);
            
            // Fetch listing data - add error handling and debugging
            try {
                const response = await getAuctionById(id);
                console.log('API Response:', JSON.stringify(response));
                
                if (!response) {
                    throw new Error('No response from API');
                }
                
                // The API returns { success: true, listing: {...} }
                if (response.success && response.listing) {
                    originalListing = response.listing;
                } else if (response.data) {
                    // Some APIs return data directly
                    originalListing = response.data;
                } else if (typeof response === 'object' && !response.listing && !response.success) {
                    // If response is the listing object directly
                    originalListing = response;
                } else {
                    throw new Error('Invalid response structure: ' + JSON.stringify(response));
                }
                
                // Ensure we have valid listing data
                if (!originalListing || typeof originalListing !== 'object') {
                    throw new Error('Invalid listing data structure');
                }
                
                console.log('Processed listing data:', JSON.stringify(originalListing));
            } catch (error) {
                console.error('API call error:', error);
                throw new Error(`Failed to fetch listing: ${error.message}`);
            }
            
            // Remove loading overlay
            document.body.removeChild(loadingOverlay);
            
            // Populate form with data
            populateFormWithListingData(originalListing);
            
            // Make non-editable fields read-only
            setReadOnlyFields();
            
            // Show success message
            showNotification('Listing loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading listing:', error);
            
            // Remove loading overlay if it exists
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) {
                document.body.removeChild(loadingOverlay);
            }
            
            // Show error notification
            showNotification(`Failed to load listing: ${error.message}`, 'error');
            
            // Redirect back to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '../html/sales_dashboard.html';
            }, 3000);
        }
    }
    
    // Set read-only fields
    function setReadOnlyFields() {
        console.log('Setting read-only fields');
        
        // Make all fields read-only first (except the ones that should be editable)
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            // Skip the editable fields
            if (input.id === 'item-description' || 
                input.id === 'auction-duration' || 
                input.id === 'shipping-option' || 
                input.id === 'pickup-option' || 
                input.id === 'shipping-cost') {
                
                // Add editable class to highlight these fields
                input.classList.add('editable-field');
                return;
            }
            
            // Apply read-only or disabled based on input type
            if (input.tagName === 'SELECT') {
                input.disabled = true;
            } else if (input.type === 'checkbox' || input.type === 'radio') {
                input.disabled = true;
            } else {
                input.readOnly = true;
            }
            
            input.classList.add('read-only');
            
            // For good measure, add a direct event handler to prevent edits
            input.addEventListener('input', function(e) {
                e.preventDefault();
                return false;
            });
        });
        
        // Add special highlight to editable fields for clarity
        highlightEditableFields();
        
        // Make specific fields read-only with visual indicators
        itemTitle.readOnly = true;
        itemTitle.classList.add('read-only');
        
        // For select dropdowns, we need to disable the element
        // but keep it visibly styled as read-only
        itemCategory.disabled = true;
        itemCategory.classList.add('read-only');
        
        itemCondition.disabled = true;
        itemCondition.classList.add('read-only');
        
        startingPrice.readOnly = true;
        startingPrice.classList.add('read-only');
        
        // Handle reserve price toggle with a special approach
        reservePriceToggle.disabled = true;
        const reservePriceLabel = document.querySelector('label[for="reserve-price-toggle"]');
        if (reservePriceLabel) {
            reservePriceLabel.classList.add('read-only-label');
        }
        
        // Don't hide the reserve price field, make it read-only
        reservePrice.readOnly = true;
        reservePrice.classList.add('read-only');
        
        // Make increment read-only
        bidIncrement.readOnly = true;
        bidIncrement.classList.add('read-only');
        
        // Handle the photo upload container
        const photoUploadContainer = document.querySelector('.photo-upload-container');
        if (photoUploadContainer) {
            photoUploadContainer.classList.add('disabled');
            photoUpload.disabled = true;
            
            // Add a message about photos being locked
            if (!photoUploadContainer.querySelector('.readonly-message')) {
                const photoMessage = document.createElement('div');
                photoMessage.className = 'readonly-message';
                photoMessage.innerHTML = '<i class="fas fa-lock"></i> Photos cannot be changed in edit mode';
                photoUploadContainer.appendChild(photoMessage);
            }
        }
        
        // Make sure reserve price container is visible if it should be
        if (reservePriceToggle.checked) {
            reservePriceContainer.classList.remove('hidden');
        }
        
        // Make sure shipping details container is visible if it should be
        if (shippingOption.checked) {
            shippingDetails.classList.remove('hidden');
        }
        
        // Add read-only indicators to all read-only fields
        addReadOnlyIndicators();
        
        // Update section titles to indicate what's editable
        updateSectionTitles();
    }
    
    // Highlight editable fields for clarity
    function highlightEditableFields() {
        const editableFields = document.querySelectorAll('.editable-field');
        editableFields.forEach(field => {
            // Add a wrapper with a glow effect if not already wrapped
            if (!field.parentElement.classList.contains('editable-field-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'editable-field-wrapper';
                
                // Create an editable indicator
                const indicator = document.createElement('span');
                indicator.className = 'editable-indicator';
                indicator.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                indicator.title = 'This field can be edited';
                
                // Don't add wrappers for checkboxes, just add the indicator
                if (field.type === 'checkbox' || field.type === 'radio') {
                    // Find the checkbox container
                    const container = field.closest('.checkbox-container');
                    if (container && !container.querySelector('.editable-indicator')) {
                        container.appendChild(indicator);
                        container.classList.add('editable-container');
                    }
                } else {
                    // Get the parent node (form-group typically)
                    const parent = field.parentNode;
                    
                    // Create the wrapper and move the field inside it
                    parent.insertBefore(wrapper, field);
                    wrapper.appendChild(field);
                    wrapper.appendChild(indicator);
                }
            }
        });
    }
    
    // Add read-only indicators to read-only fields
    function addReadOnlyIndicators() {
        // Find all read-only inputs and add indicators
        const readOnlyInputs = document.querySelectorAll('input.read-only, select.read-only, textarea.read-only');
        
        readOnlyInputs.forEach(input => {
            // Skip if already has an indicator
            if (input.nextElementSibling && input.nextElementSibling.classList.contains('read-only-indicator')) {
                return;
            }
            
            // Create a small lock icon indicator
            const indicator = document.createElement('span');
            indicator.className = 'read-only-indicator';
            indicator.innerHTML = '<i class="fas fa-lock"></i>';
            indicator.title = 'This field cannot be edited';
            
            // Add the indicator after the input
            if (input.parentNode) {
                input.parentNode.insertBefore(indicator, input.nextSibling);
            }
        });
    }
    
    // Update section titles to show what's editable
    function updateSectionTitles() {
        const sections = document.querySelectorAll('.form-section h3');
        sections.forEach(section => {
            const sectionText = section.textContent;
            
            if (sectionText.includes('Item Details')) {
                section.innerHTML = 'Item Details <span class="readonly-badge">Description editable</span>';
            } else if (sectionText.includes('Auction Settings')) {
                section.innerHTML = 'Auction Settings <span class="readonly-badge">Duration editable</span>';
            } else if (sectionText.includes('Shipping & Pickup')) {
                section.innerHTML = 'Shipping & Pickup <span class="editable-badge">Editable</span>';
            } else if (sectionText.includes('Photos')) {
                section.innerHTML = 'Photos <span class="readonly-badge">Read-only</span>';
            }
        });
    }
    
    // Populate form with listing data
    function populateFormWithListingData(listing) {
        console.log('Populating form with data:', listing);
        
        // Safety check for empty or invalid listing data
        if (!listing) {
            console.error('No listing data provided to populate form');
            showNotification('Failed to load listing data', 'error');
            return;
        }
        
        try {
            // Set basic fields (safely check for existence)
            itemTitle.value = listing.title || '';
            
            // Safe category selection
            if (listing.category) {
                const categoryExists = Array.from(itemCategory.options).some(option => option.value === listing.category);
                if (categoryExists) {
                    itemCategory.value = listing.category;
                } else {
                    console.warn(`Category "${listing.category}" not found in options`);
                    // Try to select first non-placeholder option if category not found
                    for (let i = 0; i < itemCategory.options.length; i++) {
                        if (itemCategory.options[i].value) {
                            itemCategory.value = itemCategory.options[i].value;
                            break;
                        }
                    }
                }
            }
            
            // Safe condition selection
            if (listing.condition) {
                const conditionExists = Array.from(itemCondition.options).some(option => option.value === listing.condition);
                if (conditionExists) {
                    itemCondition.value = listing.condition;
                } else {
                    console.warn(`Condition "${listing.condition}" not found in options`);
                    // Try to select first non-placeholder option if condition not found
                    for (let i = 0; i < itemCondition.options.length; i++) {
                        if (itemCondition.options[i].value) {
                            itemCondition.value = itemCondition.options[i].value;
                            break;
                        }
                    }
                }
            }
            
            // Description
            itemDescription.value = listing.description || '';
            
            // Set pricing fields (safely check for existence)
            if (listing.pricing) {
                startingPrice.value = listing.pricing.startingPrice || '';
                bidIncrement.value = listing.pricing.bidIncrement || '';
                
                // Set reserve price if available
                if (listing.pricing.reservePrice) {
                    reservePriceToggle.checked = true;
                    reservePrice.value = listing.pricing.reservePrice;
                    reservePriceContainer.classList.remove('hidden');
                }
            } else {
                // Handle case where pricing might be nested differently or directly on listing
                startingPrice.value = listing.startingPrice || '';
                bidIncrement.value = listing.bidIncrement || '';
                
                if (listing.reservePrice) {
                    reservePriceToggle.checked = true;
                    reservePrice.value = listing.reservePrice;
                    reservePriceContainer.classList.remove('hidden');
                }
            }
            
            // Set duration
            if (listing.duration) {
                const durationValue = parseInt(listing.duration);
                const durationExists = Array.from(auctionDuration.options).some(option => parseInt(option.value) === durationValue);
                
                if (durationExists) {
                    auctionDuration.value = durationValue;
                } else {
                    console.warn(`Duration "${durationValue}" not found in options`);
                    // Select default duration
                    for (let i = 0; i < auctionDuration.options.length; i++) {
                        if (auctionDuration.options[i].value) {
                            auctionDuration.value = auctionDuration.options[i].value;
                            break;
                        }
                    }
                }
            }
            
            // Set shipping options
            if (listing.shippingOptions) {
                // Use explicit boolean check to ensure correct value even if value is falsy but not false
                shippingOption.checked = listing.shippingOptions.shipping !== false;
                pickupOption.checked = listing.shippingOptions.localPickup === true;
                
                if (listing.shippingOptions.shipping) {
                    shippingDetails.classList.remove('hidden');
                    
                    if (listing.shippingOptions.shippingCost) {
                        shippingCost.value = listing.shippingOptions.shippingCost;
                    }
                }
            } else {
                // Handle case where shipping options might be nested differently or directly on listing
                shippingOption.checked = listing.shipping !== false;
                pickupOption.checked = listing.localPickup === true;
                
                if (listing.shipping) {
                    shippingDetails.classList.remove('hidden');
                    
                    if (listing.shippingCost) {
                        shippingCost.value = listing.shippingCost;
                    }
                }
            }
            
            // Populate image previews
            if (listing.images && Array.isArray(listing.images) && listing.images.length > 0) {
                existingImageUrls = [...listing.images];
                displayExistingImages(existingImageUrls);
            } else if (listing.image) {
                // Handle case where listing has a single image property instead of an images array
                existingImageUrls = [listing.image];
                displayExistingImages(existingImageUrls);
            } else {
                console.warn('No images found for listing');
            }
            
            // Update character count for description
            const descLength = itemDescription.value.length;
            charCount.textContent = `${descLength}/2000 characters`;
            
            // Toggle publish button text based on status
            if (listing.status === 'draft') {
                publishBtn.textContent = 'Publish Listing';
            } else {
                publishBtn.textContent = 'Save Changes';
            }
            
            console.log('Form populated successfully');
        } catch (error) {
            console.error('Error populating form with listing data:', error);
            showNotification('Error populating form: ' + error.message, 'error');
        }
    }
    
    // Display existing images
    function displayExistingImages(imageUrls) {
        photoPreviewContainer.innerHTML = '';
        
        imageUrls.forEach((url, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'photo-preview-item existing-image';
            
            // Create image preview
            const img = document.createElement('img');
            img.src = url;
            previewItem.appendChild(img);
            
            // In edit mode, we don't allow deleting images
            if (!isEditMode) {
                // Add delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-preview';
                deleteBtn.innerHTML = '&times;';
                deleteBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    previewItem.remove();
                    // Remove url from existingImageUrls
                    existingImageUrls = existingImageUrls.filter(imgUrl => imgUrl !== url);
                    updateCoverImage();
                });
                previewItem.appendChild(deleteBtn);
            } else {
                // Add a small lock icon to indicate images can't be deleted
                const lockIcon = document.createElement('span');
                lockIcon.className = 'lock-icon';
                lockIcon.innerHTML = '<i class="fas fa-lock"></i>';
                previewItem.appendChild(lockIcon);
            }
            
            photoPreviewContainer.appendChild(previewItem);
        });
        
        updateCoverImage();
    }
    
    // Update the cover image badge
    function updateCoverImage() {
        // Remove all existing cover badges
        document.querySelectorAll('.cover-badge').forEach(badge => badge.remove());
        
        // Get all preview items
        const previewItems = document.querySelectorAll('.photo-preview-item');
        if (previewItems.length > 0) {
            // Add cover badge to first image
            previewItems[0].classList.add('cover-image');
            const coverBadge = document.createElement('span');
            coverBadge.className = 'cover-badge';
            coverBadge.textContent = 'Cover';
            previewItems[0].appendChild(coverBadge);
        }
    }
    
    // Update UI for edit mode
    function updateUIForEditMode() {
        document.title = 'Phantom Bidders - Edit Listing';
        
        // Add edit-mode class to body for CSS targeting
        document.body.classList.add('edit-mode');
        
        // Update header text
        const pageHeader = document.querySelector('.page-header h2');
        if (pageHeader) {
            pageHeader.textContent = 'Edit Listing';
        }
        
        const pageSubtitle = document.querySelector('.page-header p');
        if (pageSubtitle) {
            pageSubtitle.textContent = 'Update your auction listing (limited fields)';
        }
        
        // Add edit mode indicator
        const formContainer = document.querySelector('.create-listing-container');
        if (formContainer) {
            const editBadge = document.createElement('div');
            editBadge.className = 'edit-mode-badge';
            editBadge.innerHTML = '<i class="fas fa-edit"></i> Limited Edit Mode';
            formContainer.insertBefore(editBadge, formContainer.firstChild);
            
            // Add info about what can be edited
            const editInfo = document.createElement('div');
            editInfo.className = 'edit-info';
            editInfo.innerHTML = `
                <p><i class="fas fa-info-circle"></i> You can only edit the description, auction duration, and shipping options.</p>
                <p>Other fields are read-only and cannot be changed once a listing is created.</p>
            `;
            formContainer.insertBefore(editInfo, formContainer.querySelector('form'));
        }
        
        // Update button text
        if (publishBtn) {
            publishBtn.textContent = 'Save Changes';
            // Also update styling for clarity
            publishBtn.style.background = 'linear-gradient(90deg, #3498db, #2980b9)';
        }
        
        if (saveDraftBtn) {
            // Make save draft button read-only instead of hiding it
            saveDraftBtn.disabled = true;
            saveDraftBtn.classList.add('read-only-btn');
            saveDraftBtn.title = "Can't save as draft in edit mode";
        }
        
        // Add a super-enforced read-only handler at the document level
        document.addEventListener('DOMContentLoaded', function() {
            // We need this to run after the form is loaded and populated
            setTimeout(enforceReadOnly, 1000);
        });
        
        // If we're already loaded, run it now
        if (document.readyState === 'complete') {
            enforceReadOnly();
        }
    }
    
    // Enforce read-only state at the document level
    function enforceReadOnly() {
        console.log('Enforcing read-only state');
        
        // Store original values for read-only fields
        const readOnlyValues = {};
        const readOnlyFields = document.querySelectorAll('.read-only');
        
        readOnlyFields.forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                readOnlyValues[field.id] = field.checked;
            } else {
                readOnlyValues[field.id] = field.value;
            }
        });
        
        // Add global event listeners to block changes to read-only fields
        document.addEventListener('input', function(e) {
            const target = e.target;
            if (target.classList.contains('read-only')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                // Reset to original value
                if (target.type === 'checkbox' || target.type === 'radio') {
                    target.checked = readOnlyValues[target.id];
                } else {
                    target.value = readOnlyValues[target.id];
                }
                
                // Show warning
                showNotification('This field cannot be edited in edit mode', 'error');
                return false;
            }
        }, true); // Use capture phase to intercept before other handlers
        
        document.addEventListener('keydown', function(e) {
            const target = e.target;
            if (target.classList.contains('read-only')) {
                // Allow only arrow keys and tab for navigation
                if (e.key !== 'Tab' && 
                    e.key !== 'ArrowUp' && 
                    e.key !== 'ArrowDown' && 
                    e.key !== 'ArrowLeft' && 
                    e.key !== 'ArrowRight') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                }
            }
        }, true); // Use capture phase
        
        // Add more protection to each field individually
        readOnlyFields.forEach(field => {
            field.addEventListener('mousedown', e => {
                if (e.target.classList.contains('read-only')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    showNotification('This field cannot be edited in edit mode', 'error');
                    return false;
                }
            }, true);
        });
    }
    
    // Notification helper
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle'}"></i>
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