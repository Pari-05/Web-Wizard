// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signupBtn');
const alertContainer = document.getElementById('alertContainer');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    createBackgroundAnimation();
    setupEventListeners();
    checkExistingAuth();
});

// Create animated background particles
function createBackgroundAnimation() {
    const bgAnimation = document.getElementById('bgAnimation');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.width = Math.random() * 100 + 20 + 'px';
        particle.style.height = particle.style.width;
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        bgAnimation.appendChild(particle);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Signup button click
    signupBtn.addEventListener('click', handleSignup);
    
    // Enter key press
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSignup();
        }
    });
    
    // Input focus effects
    [nameInput, emailInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Real-time validation feedback
        input.addEventListener('input', function() {
            clearFieldError(this);
            validateFieldRealTime(this);
        });
    });

    // Button ripple effect
    signupBtn.addEventListener('click', function(e) {
        createRipple(e, this);
    });
}

// Check if user is already authenticated
function checkExistingAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token with server
        fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                // Token is valid, redirect to notes
                window.location.href = 'notes.html';
            } else {
                // Token is invalid, remove it
                localStorage.removeItem('token');
            }
        })
        .catch(error => {
            console.error('Token verification failed:', error);
            localStorage.removeItem('token');
        });
    }
}

// Handle signup
async function handleSignup() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous errors
    clearAlerts();
    clearAllFieldErrors();

    // Validation
    let hasErrors = false;

    if (!name) {
        showFieldError(nameInput, 'Name is required');
        hasErrors = true;
    } else if (name.length < 2) {
        showFieldError(nameInput, 'Name must be at least 2 characters');
        hasErrors = true;
    }

    if (!email) {
        showFieldError(emailInput, 'Email is required');
        hasErrors = true;
    } else if (!isValidEmail(email)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        hasErrors = true;
    }

    if (!password) {
        showFieldError(passwordInput, 'Password is required');
        hasErrors = true;
    } else if (password.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        hasErrors = true;
    } else if (!isStrongPassword(password)) {
        showFieldError(passwordInput, 'Password should contain letters and numbers');
        hasErrors = true;
    }

    if (hasErrors) {
        showAlert('Please fix the errors above', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Account created successfully! Redirecting...', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'notes.html';
            }, 1500);
        } else {
            // Error
            if (response.status === 409) {
                showFieldError(emailInput, 'An account with this email already exists');
                showAlert('Email already registered. Try logging in instead.', 'error');
            } else {
                showAlert(data.message || 'Registration failed', 'error');
            }
        }
    } catch (error) {
        console.error('Signup error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Real-time field validation
function validateFieldRealTime(input) {
    const value = input.value.trim();
    
    switch (input.id) {
        case 'name':
            if (value && value.length < 2) {
                showFieldError(input, 'Name must be at least 2 characters');
            }
            break;
            
        case 'email':
            if (value && !isValidEmail(value)) {
                showFieldError(input, 'Please enter a valid email address');
            }
            break;
            
        case 'password':
            if (value && value.length < 6) {
                showFieldError(input, 'Password must be at least 6 characters');
            } else if (value && value.length >= 6) {
                const strength = getPasswordStrength(value);
                showPasswordStrength(input, strength);
            }
            break;
    }
}

// Show password strength indicator
function showPasswordStrength(input, strength) {
    clearFieldError(input);
    
    const formGroup = input.parentElement;
    let strengthDiv = formGroup.querySelector('.password-strength');
    
    if (!strengthDiv) {
        strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        formGroup.appendChild(strengthDiv);
    }
    
    const strengthColors = {
        'weak': '#ff6b6b',
        'medium': '#feca57',
        'strong': '#48cae4',
        'very-strong': '#06ffa5'
    };
    
    strengthDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px;">
            <div style="flex: 1; height: 4px; background: #e1e5e9; border-radius: 2px; overflow: hidden;">
                <div style="height: 100%; background: ${strengthColors[strength.level]}; width: ${strength.percentage}%; transition: all 0.3s ease;"></div>
            </div>
            <span style="font-size: 12px; color: ${strengthColors[strength.level]}; font-weight: 500;">${strength.text}</span>
        </div>
    `;
}

// Get password strength
function getPasswordStrength(password) {
    let score = 0;
    
    // Length
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    
    // Character types
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 2) return { level: 'weak', percentage: 25, text: 'Weak' };
    if (score <= 3) return { level: 'medium', percentage: 50, text: 'Medium' };
    if (score <= 4) return { level: 'strong', percentage: 75, text: 'Strong' };
    return { level: 'very-strong', percentage: 100, text: 'Very Strong' };
}

// Show field-specific error
function showFieldError(input, message) {
    clearFieldError(input);
    
    const formGroup = input.parentElement;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = `
        color: #ff6b6b;
        font-size: 12px;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    
    formGroup.appendChild(errorDiv);
    input.style.borderColor = '#ff6b6b';
}

// Clear field error
function clearFieldError(input) {
    const formGroup = input.parentElement;
    const errorDiv = formGroup.querySelector('.field-error');
    const strengthDiv = formGroup.querySelector('.password-strength');
    
    if (errorDiv) errorDiv.remove();
    if (input.id !== 'password' && strengthDiv) strengthDiv.remove();
    
    input.style.borderColor = '';
}

// Clear all field errors
function clearAllFieldErrors() {
    [nameInput, emailInput, passwordInput].forEach(input => {
        clearFieldError(input);
    });
}

// Show alert message
function showAlert(message, type = 'error') {
    clearAlerts();
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    
    const icon = type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle';
    alertDiv.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-remove success alerts after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            clearAlerts();
        }, 3000);
    }
}

// Clear alert messages
function clearAlerts() {
    alertContainer.innerHTML = '';
}

// Set loading state
function setLoadingState(loading) {
    if (loading) {
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
        signupBtn.disabled = true;
        nameInput.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        signupBtn.disabled = false;
        nameInput.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check password strength
function isStrongPassword(password) {
    // At least 6 characters with some complexity
    return password.length >= 6 && (/[a-zA-Z]/.test(password) && /[0-9]/.test(password));
}

// Create ripple effect on button click
function createRipple(event, button) {
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = diameter + 'px';
    circle.style.left = event.clientX - rect.left - radius + 'px';
    circle.style.top = event.clientY - rect.top - radius + 'px';
    circle.classList.add('btn-ripple');

    const ripple = button.getElementsByClassName('btn-ripple')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// Add interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Add floating animation to form
    const authCard = document.querySelector('.auth-card');
    let ticking = false;
    
    function updateMousePosition(e) {
        if (!ticking) {
            requestAnimationFrame(function() {
                const rect = authCard.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = (e.clientX - centerX) / 50;
                const deltaY = (e.clientY - centerY) / 50;
                
                authCard.style.transform = `translateX(${deltaX}px) translateY(${deltaY}px) scale(1)`;
                ticking = false;
            });
            ticking = true;
        }
    }
    
    // Add subtle mouse tracking effect
    document.addEventListener('mousemove', updateMousePosition);
    
    // Reset position when mouse leaves
    document.addEventListener('mouseleave', function() {
        authCard.style.transform = 'translateX(0) translateY(0) scale(1)';
    });
});