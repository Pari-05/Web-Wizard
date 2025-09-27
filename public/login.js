// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
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
    // Login button click
    loginBtn.addEventListener('click', handleLogin);
    
    // Enter key press
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // Input focus effects
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });

    // Button ripple effect
    loginBtn.addEventListener('click', function(e) {
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

// Handle login
async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validation
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    setLoadingState(true);
    clearAlerts();

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Success
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'notes.html';
            }, 1500);
        } else {
            // Error
            showAlert(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    } finally {
        setLoadingState(false);
    }
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
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        loginBtn.disabled = true;
        emailInput.disabled = true;
        passwordInput.disabled = true;
    } else {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        loginBtn.disabled = false;
        emailInput.disabled = false;
        passwordInput.disabled = false;
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

// Add some interactive effects
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