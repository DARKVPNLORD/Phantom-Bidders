document.addEventListener('DOMContentLoaded', function() {
    // Toggle between login and signup forms
    const loginToggle = document.getElementById('login-toggle');
    const signupToggle = document.getElementById('signup-toggle');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const termsLinks = document.querySelectorAll('.terms-link');
    const closePopupBtn = document.querySelector('.close-popup');
    const acceptTermsBtn = document.querySelector('.accept-terms');
    const termsPopup = document.getElementById('terms-popup');
    const buyerRole = document.getElementById('buyer-role');
    const sellerRole = document.getElementById('seller-role');
    const selectedRole = document.querySelector('input[name="role"]') || document.createElement('input');
    
    if (!selectedRole.name) {
        selectedRole.type = 'hidden';
        selectedRole.name = 'role';
        selectedRole.value = 'buyer'; // Default role
        if (signupForm) signupForm.appendChild(selectedRole);
    }
    
    if (loginToggle && signupToggle) {
    loginToggle.addEventListener('click', function() {
        loginToggle.classList.add('active');
        signupToggle.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        });

    signupToggle.addEventListener('click', function() {
        signupToggle.classList.add('active');
        loginToggle.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        });
    }
    
    // Handle role selection
    if (buyerRole && sellerRole) {
    buyerRole.addEventListener('click', function() {
        buyerRole.classList.add('active');
        sellerRole.classList.remove('active');
            selectedRole.value = 'buyer';
    });

    sellerRole.addEventListener('click', function() {
        sellerRole.classList.add('active');
        buyerRole.classList.remove('active');
            selectedRole.value = 'seller';
        });
    }
    
    // Handle terms popup
    if (termsLinks.length > 0) {
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            termsPopup.classList.add('active');
            });
        });
    }
    
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', function() {
        termsPopup.classList.remove('active');
        });
    }
    
    if (acceptTermsBtn) {
        acceptTermsBtn.addEventListener('click', function() {
            termsPopup.classList.remove('active');
            const checkboxes = document.querySelectorAll('.checkbox-container input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
            });
        });
    }
    
    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = this.querySelector('input[name="name"]').value;
            const email = this.querySelector('input[name="email"]').value;
            const password = this.querySelector('input[name="password"]').value;
            const age = this.querySelector('input[name="age"]').value;
            const gender = this.querySelector('select[name="gender"]').value;
            const phone = this.querySelector('input[name="phone"]').value;
            const role = selectedRole.value;
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            
            try {
                // Prepare user data
                const userData = { 
                    name,
                    email,
                    password,
                    role,
                    details: {
                        age: age ? parseInt(age) : undefined,
                        gender: gender || undefined,
                        phone: phone || undefined
                    }
                };
                
                // Try to register user via API
                try {
                    // Use the registerUser function from api.js
                    const result = await registerUser(userData);
                    
                    // Store auth token if present
                    if (result && result.token) {
                        storeAuthToken(result.token);
                        
                        // Store user data
                        localStorage.setItem('user', JSON.stringify({
                            id: result._id || result.id,
                            name: result.name,
                            email: result.email,
                            role: result.role
                        }));
                    }
                    
                    // Use direct redirect instead of animation
                    handleSuccessfulSignup(role);
                    
                } catch (apiError) {
                    console.error('API Error:', apiError);
                    
                    // Check if it's a connection error
                    if (apiError.message.includes('Network') || 
                        apiError.message.includes('Failed to fetch') ||
                        apiError.name === 'TypeError') {
                        console.warn('Database connection issue detected, falling back to demo mode');
                        
                        // For demo purposes - simulate successful registration
                        await new Promise(resolve => setTimeout(resolve, 800));
                        
                        // Store demo data in localStorage
                        localStorage.setItem('user', JSON.stringify({
                            id: 'demo-user-id',
                            name: name,
                            email: email,
                            role: role
                        }));
                        localStorage.setItem('authToken', 'demo-token-' + Math.random().toString(36).substring(2));
                        
                        // Use direct redirect instead of animation
                        handleSuccessfulSignup(role);
            } else {
                        // Registration error - apply shake animation
                        throw new Error(apiError.message || 'Registration failed');
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                // Display error with shake animation
                displayFormError(this, error.message || 'Registration failed. Please try again.');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[name="email"]').value;
            const password = this.querySelector('input[name="password"]').value;
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            
            try {
                // Try to login via API
                try {
                    // Use the loginUser function from api.js
                    const result = await loginUser(email, password);
                    
                    // Store auth token if present
                    if (result && result.token) {
                        storeAuthToken(result.token);
                        
                        // Store user data
                        localStorage.setItem('user', JSON.stringify({
                            id: result._id || result.id,
                            name: result.name,
                            email: result.email,
                            role: result.role
                        }));
                    }
                    
                    // Get user role from API response
                    const role = result.role;
                    
                    // Use direct redirect instead of animation
                    handleSuccessfulLogin(role);
                    
                } catch (apiError) {
                    console.error('API Error:', apiError);
                    
                    // Check if it's a connection error
                    if (apiError.message.includes('Network') || 
                        apiError.message.includes('Failed to fetch') ||
                        apiError.name === 'TypeError') {
                        console.warn('Database connection issue detected, falling back to demo mode');
                        
                        // For demo purposes - simulate successful login
                        await new Promise(resolve => setTimeout(resolve, 800));
                        
                        // Determine user role based on email (for demo only)
                        const role = email.includes('seller') ? 'seller' : 'buyer';
                        
                        // Store demo data in localStorage
                        localStorage.setItem('user', JSON.stringify({
                            id: 'demo-user-id',
                            name: email.split('@')[0],
                            email: email,
                            role: role
                        }));
                        localStorage.setItem('authToken', 'demo-token-' + Math.random().toString(36).substring(2));
                        
                        // Use direct redirect instead of animation
                        handleSuccessfulLogin(role);
                } else {
                        // Authentication error - apply shake animation
                        throw new Error(apiError.message || 'Invalid email or password');
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                // Display error with shake animation
                displayFormError(this, error.message || 'Login failed. Please check your credentials.');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
    
    // Function to show success animation
    function showSuccessAnimation(role) {
        const container = document.querySelector('.success-animation-container');
        const animation = document.querySelector('.success-animation');
        const successBtn = document.querySelector('.success-btn');
        const particles = document.querySelector('.particles');
        const stars = document.querySelector('.stars');
        
        // Clear any existing event listeners
        successBtn.replaceWith(successBtn.cloneNode(true));
        const newSuccessBtn = document.querySelector('.success-btn');
        
        // Reset any existing classes first
        document.body.classList.remove('buyer-theme', 'seller-theme');
        container.classList.remove('buyer-theme', 'seller-theme');
        
        // Set theme class based on role - apply to container rather than body
        container.classList.add(role === 'seller' ? 'seller-theme' : 'buyer-theme');
        
        // Ensure all animation elements are reset before starting again
        animation.classList.remove('animate');
        
        // Create particles
        particles.innerHTML = ''; // Clear any existing particles
        for (let i = 0; i < 40; i++) {
            createParticle(particles);
        }
        
        // Create falling stars
        stars.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            createStar(stars);
        }
        
        // Show animation container
        container.classList.add('active');
        
        // Start animation sequence after a short delay to ensure DOM is ready
        setTimeout(() => {
            animation.classList.add('animate');
            
            // Animate particles
            const particleElements = document.querySelectorAll('.particle');
            particleElements.forEach(particle => {
                const tx = (Math.random() - 0.5) * 400;
                const ty = (Math.random() - 0.5) * 400;
                const duration = 0.8 + Math.random() * 1.2;
                particle.style.setProperty('--tx', `${tx}px`);
                particle.style.setProperty('--ty', `${ty}px`);
                setTimeout(() => {
                    particle.style.animation = `particleExplode ${duration}s cubic-bezier(0.1, 0.5, 0.1, 1) forwards`;
                }, Math.random() * 500);
            });
            
            // Animate stars with delayed start
            setTimeout(() => {
                const starElements = document.querySelectorAll('.star');
                starElements.forEach((star, index) => {
                    setTimeout(() => {
                        const duration = 2 + Math.random() * 3;
                        star.style.animation = `starFall ${duration}s linear forwards`;
                    }, index * 200);
                });
            }, 800);
        }, 100);
        
        // Add event listener to the continue button
        newSuccessBtn.addEventListener('click', () => {
            container.classList.remove('active');
            setTimeout(() => {
                // Clean up
                animation.classList.remove('animate');
                particles.innerHTML = '';
                stars.innerHTML = '';
                container.classList.remove('buyer-theme', 'seller-theme');
                // Switch to login form
                document.getElementById('login-toggle').click();
            }, 300);
        });
    }
    
    // Function to show login animation
    function showLoginAnimation(role) {
        const container = document.querySelector('.login-animation-container');
        const animation = document.querySelector('.login-animation');
        const energyParticles = document.querySelector('.energy-particles');
        const portalStreaks = document.querySelector('.portal-streaks');
        const vortexWaves = document.querySelector('.vortex-waves');
        
        // Set theme class based on role - apply to container
        container.classList.remove('buyer-theme', 'seller-theme');
        container.classList.add(role === 'seller' ? 'seller-theme' : 'buyer-theme');
        
        // Also add theme class to animation for more specific targeting
        animation.classList.remove('buyer-theme', 'seller-theme');
        animation.classList.add(role === 'seller' ? 'seller-theme' : 'buyer-theme');
        
        // Ensure animation elements are reset
        animation.classList.remove('animate');
        
        // Create energy particles
        energyParticles.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            createEnergyParticle(energyParticles);
        }
        
        // Create portal streaks
        portalStreaks.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            createPortalStreak(portalStreaks);
        }
        
        // Configure vortex waves
        vortexWaves.querySelectorAll('.vortex-wave').forEach((wave, index) => {
            wave.style.animation = `vortexWave ${1.5 + index * 0.5}s ease-out infinite`;
            wave.style.animationDelay = `${index * 0.3}s`;
        });
        
        // Show animation container
        container.classList.add('active');
        
        // Start animation sequence
        setTimeout(() => {
            animation.classList.add('animate');
            
            // Animate energy particles
            const particleElements = document.querySelectorAll('.energy-particle');
            particleElements.forEach(particle => {
                const startX = (Math.random() - 0.5) * 600;
                const startY = (Math.random() - 0.5) * 600;
                const duration = 1.5 + Math.random() * 2;
                
                particle.style.setProperty('--startX', `${startX}px`);
                particle.style.setProperty('--startY', `${startY}px`);
                
                setTimeout(() => {
                    particle.style.animation = `particleMoveToPortal ${duration}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`;
                }, Math.random() * 1500);
            });
            
            // Animate portal streaks
            const streakElements = document.querySelectorAll('.portal-streak');
            streakElements.forEach((streak, index) => {
                const length = 50 + Math.random() * 100;
                const rotation = Math.random() * 360;
                const duration = 1 + Math.random();
                const delay = Math.random() * 2;
                
                streak.style.width = `${length}px`;
                streak.style.setProperty('--rotation', `${rotation}deg`);
                
                setTimeout(() => {
                    streak.style.animation = `streakAnimate ${duration}s linear forwards`;
                }, delay * 1000);
            });
            
            // Redirect after animation completes
            setTimeout(() => {
                redirectToDashboard(role);
            }, 3500);
        }, 100);
    }
    
    // Function to create a single particle
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position around the center
        const x = (Math.random() - 0.5) * 60;
        const y = (Math.random() - 0.5) * 60;
        
        // Random size
        const size = 3 + Math.random() * 7;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `calc(50% + ${x}px)`;
        particle.style.top = `calc(50% + ${y}px)`;
        
        container.appendChild(particle);
        return particle;
    }
    
    // Function to create a falling star
    function createStar(container) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random position at the top
        const x = Math.random() * 100;
        star.style.left = `${x}%`;
        star.style.top = '0';
        
        // Random size
        const size = 1 + Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        container.appendChild(star);
        return star;
    }
    
    function createEnergyParticle(container) {
        const particle = document.createElement('div');
        particle.className = 'energy-particle';
        
        // Random size
        const size = 2 + Math.random() * 6;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        container.appendChild(particle);
        return particle;
    }
    
    function createPortalStreak(container) {
        const streak = document.createElement('div');
        streak.className = 'portal-streak';
        container.appendChild(streak);
        return streak;
    }
    
    // Function to redirect after successful signup
    function handleSuccessfulSignup(role) {
        // Direct redirect to login page - no animation
        setTimeout(() => {
            // Switch to login form
            document.getElementById('login-toggle').click();
        }, 300);
    }

    // Function to redirect after successful login
    function handleSuccessfulLogin(role) {
        // Direct redirect to dashboard based on role
        redirectToDashboard(role);
    }

    // Function to redirect to appropriate dashboard
    function redirectToDashboard(role) {
        if (role === 'seller') {
            window.location.href = '../html/seller_landing.html';
        } else {
            window.location.href = '../html/buyer_landing.html';
        }
    }

    // Function to apply shake animation to a form
    function applyShakeAnimation(form) {
        form.classList.add('shake');
        setTimeout(() => {
            form.classList.remove('shake');
        }, 600);
    }
    
    // Function to display error message with shake animation
    function displayFormError(form, message) {
        // Shake the form
        applyShakeAnimation(form);
        
        // Find the first input to highlight
        const firstInput = form.querySelector('input');
        if (firstInput) {
            firstInput.classList.add('input-error');
            setTimeout(() => {
                firstInput.classList.remove('input-error');
            }, 3000);
        }
        
        // Display error message
        const errorElem = document.createElement('div');
        errorElem.className = 'error-message';
        errorElem.textContent = message;
        errorElem.style.color = '#ff4d4d';
        
        // Replace any existing error message
        const existingError = form.querySelector('.error-message');
        if (existingError) {
            form.replaceChild(errorElem, existingError);
        } else {
            form.prepend(errorElem);
        }
        
        // Remove error message after some time
        setTimeout(() => {
            errorElem.style.opacity = '0';
            setTimeout(() => {
                if (errorElem.parentElement === form) {
                    form.removeChild(errorElem);
                }
            }, 300);
        }, 3000);
    }
}); 