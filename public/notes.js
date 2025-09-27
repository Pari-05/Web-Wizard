// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const alertContainer = document.getElementById('alertContainer');
const formTitle = document.getElementById('formTitle');
const noteTitle = document.getElementById('noteTitle');
const noteContent = document.getElementById('noteContent');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const notesContainer = document.getElementById('notesContainer');
const loadingIndicator = document.getElementById('loadingIndicator');

// App State
let currentUser = null;
let notes = [];
let editingNoteId = null;
let searchTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    createBackgroundAnimation();
    setupEventListeners();
    checkAuthentication();
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
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Search functionality
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchNotes(e.target.value);
        }, 300);
    });
    
    // Save note button
    saveNoteBtn.addEventListener('click', handleSaveNote);
    
    // Cancel edit button
    cancelEditBtn.addEventListener('click', cancelEdit);
    
    // Enter key for saving notes (Ctrl+Enter)
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            handleSaveNote();
        }
        if (e.key === 'Escape' && editingNoteId) {
            cancelEdit();
        }
    });
}

// Check authentication
async function checkAuthentication() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        redirectToLogin();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            setupUserInterface();
            fetchNotes();
        } else {
            throw new Error('Token verification failed');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        redirectToLogin();
    }
}

// Setup user interface
function setupUserInterface() {
    if (currentUser) {
        userName.textContent = `Welcome, ${currentUser.name}!`;
        userEmail.textContent = currentUser.email;
        
        // Set avatar initial
        const initial = currentUser.name.charAt(0).toUpperCase();
        userAvatar.innerHTML = initial;
        
        // Set dynamic avatar color
        const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#06ffa5'];
        const colorIndex = currentUser.name.length % colors.length;
        userAvatar.style.background = colors[colorIndex];
    }
}

// Fetch notes from API
async function fetchNotes(searchQuery = '') {
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    try {
        showLoading(true);
        
        const url = searchQuery ? 
            `${API_BASE_URL}/notes?search=${encodeURIComponent(searchQuery)}` : 
            `${API_BASE_URL}/notes`;
            
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            notes = data.notes;
            renderNotes();
        } else if (response.status === 401) {
            redirectToLogin();
        } else {
            throw new Error('Failed to fetch notes');
        }
    } catch (error) {
        console.error('Error fetching notes:', error);
        showAlert('Failed to load notes. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Render notes in the UI
function renderNotes() {
    const notesGridContainer = document.createElement('div');
    
    if (notes.length === 0) {
        const query = searchInput.value.trim();
        notesGridContainer.innerHTML = `
            <div class="no-notes">
                <i class="fas fa-sticky-note" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.6;"></i>
                <p>${query ? 'No notes found matching your search.' : 'No notes yet. Create your first note above!'}</p>
                ${query ? '<p>Try adjusting your search terms.</p>' : '<p>Start organizing your thoughts and ideas.</p>'}
            </div>
        `;
    } else {
        notesGridContainer.className = 'notes-grid';
        notesGridContainer.innerHTML = notes.map(note => createNoteCard(note)).join('');
    }
    
    // Replace the content of notesContainer
    notesContainer.innerHTML = '';
    notesContainer.appendChild(notesGridContainer);
}

// Create note card HTML
function createNoteCard(note) {
    const createdDate = new Date(note.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const updatedDate = note.updated_at !== note.created_at ? 
        new Date(note.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : null;
    
    return `
        <div class="note-card" data-note-id="${note.id}">
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            <p class="note-content">${escapeHtml(note.content)}</p>
            <div class="note-meta">
                <i class="fas fa-calendar-plus"></i>
                Created: ${createdDate}
                ${updatedDate ? `<br><i class="fas fa-edit"></i> Updated: ${updatedDate}` : ''}
            </div>
            <div class="note-actions">
                <button class="edit-btn" onclick="editNote(${note.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-btn" onclick="deleteNote(${note.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// Handle save note (create or update)
async function handleSaveNote() {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();
    
    // Validation
    if (!title || !content) {
        showAlert('Please fill in both title and content', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Show loading state
    setNoteFormLoading(true);
    clearAlerts();
    
    try {
        const url = editingNoteId ? 
            `${API_BASE_URL}/notes/${editingNoteId}` : 
            `${API_BASE_URL}/notes`;
            
        const method = editingNoteId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const action = editingNoteId ? 'updated' : 'created';
            showAlert(`Note ${action} successfully!`, 'success');
            
            // Reset form
            resetNoteForm();
            
            // Refresh notes
            fetchNotes(searchInput.value);
        } else if (response.status === 401) {
            redirectToLogin();
        } else {
            throw new Error(data.message || `Failed to ${editingNoteId ? 'update' : 'create'} note`);
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showAlert(error.message || 'Failed to save note. Please try again.', 'error');
    } finally {
        setNoteFormLoading(false);
    }
}

// Edit note
async function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) {
        showAlert('Note not found', 'error');
        return;
    }
    
    // Populate form
    noteTitle.value = note.title;
    noteContent.value = note.content;
    editingNoteId = noteId;
    
    // Update UI
    formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Note';
    saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Update Note';
    saveNoteBtn.className = 'btn btn-success';
    cancelEditBtn.classList.remove('hidden');
    
    // Scroll to form
    document.querySelector('.note-form').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // Focus title input
    noteTitle.focus();
    noteTitle.select();
}

// Cancel edit
function cancelEdit() {
    resetNoteForm();
    showAlert('Edit cancelled', 'success');
}

// Reset note form
function resetNoteForm() {
    noteTitle.value = '';
    noteContent.value = '';
    editingNoteId = null;
    
    formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Create New Note';
    saveNoteBtn.innerHTML = '<i class="fas fa-save"></i> Save Note';
    saveNoteBtn.className = 'btn btn-success';
    cancelEditBtn.classList.add('hidden');
}

// Delete note
async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Find and disable the delete button
    const noteCard = document.querySelector(`[data-note-id="${noteId}"]`);
    const deleteBtn = noteCard.querySelector('.delete-btn');
    const originalContent = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    deleteBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAlert('Note deleted successfully!', 'success');
            
            // Add fade out animation
            noteCard.style.transition = 'all 0.3s ease';
            noteCard.style.transform = 'scale(0.8)';
            noteCard.style.opacity = '0';
            
            // Remove from DOM after animation
            setTimeout(() => {
                fetchNotes(searchInput.value);
            }, 300);
            
            // If we were editing this note, reset the form
            if (editingNoteId === noteId) {
                resetNoteForm();
            }
        } else if (response.status === 401) {
            redirectToLogin();
        } else {
            throw new Error('Failed to delete note');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showAlert('Failed to delete note. Please try again.', 'error');
        
        // Restore button
        deleteBtn.innerHTML = originalContent;
        deleteBtn.disabled = false;
    }
}

// Handle logout
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showAlert('Logged out successfully!', 'success');
        
        setTimeout(() => {
            redirectToLogin();
        }, 1000);
    }
}

// Show/hide loading indicator
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
        notesContainer.innerHTML = '';
        notesContainer.appendChild(loadingIndicator);
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Set note form loading state
function setNoteFormLoading(loading) {
    if (loading) {
        saveNoteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveNoteBtn.disabled = true;
        noteTitle.disabled = true;
        noteContent.disabled = true;
    } else {
        const isEditing = editingNoteId !== null;
        saveNoteBtn.innerHTML = isEditing ? 
            '<i class="fas fa-save"></i> Update Note' : 
            '<i class="fas fa-save"></i> Save Note';
        saveNoteBtn.disabled = false;
        noteTitle.disabled = false;
        noteContent.disabled = false;
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
    
    // Auto-remove alerts after 3 seconds
    setTimeout(() => {
        clearAlerts();
    }, 3000);
    
    // Scroll alert into view
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Clear alert messages
function clearAlerts() {
    alertContainer.innerHTML = '';
}

// Redirect to login page
function redirectToLogin() {
    window.location.href = 'login.html';
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Add some interactive enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Auto-resize textarea
    const textarea = noteContent;
    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.max(120, this.scrollHeight) + 'px';
    });
    
    // Add character count
    const charCount = document.createElement('div');
    charCount.style.cssText = `
        font-size: 12px;
        color: var(--text-secondary);
        text-align: right;
        margin-top: 5px;
    `;
    noteContent.parentElement.appendChild(charCount);
    
    function updateCharCount() {
        const titleLength = noteTitle.value.length;
        const contentLength = noteContent.value.length;
        charCount.textContent = `Title: ${titleLength} | Content: ${contentLength} characters`;
    }
    
    noteTitle.addEventListener('input', updateCharCount);
    noteContent.addEventListener('input', updateCharCount);
    updateCharCount();
    
    // Add keyboard shortcuts help
    const shortcutsHelp = document.createElement('div');
    shortcutsHelp.style.cssText = `
        font-size: 11px;
        color: var(--text-secondary);
        margin-top: 10px;
        text-align: center;
        opacity: 0.8;
    `;
    shortcutsHelp.innerHTML = `
        <i class="fas fa-keyboard"></i> 
        Shortcuts: <kbd>Ctrl+Enter</kbd> to save, <kbd>Esc</kbd> to cancel edit
    `;
    document.querySelector('.note-form').appendChild(shortcutsHelp);
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add note card hover effects
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.note-card')) {
            const card = e.target.closest('.note-card');
            card.style.transform = 'translateY(-5px) scale(1.02)';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.note-card')) {
            const card = e.target.closest('.note-card');
            card.style.transform = '';
        }
    });
    
    // Add search highlighting
    function highlightSearchTerms(text, searchTerm) {
        if (!searchTerm) return escapeHtml(text);
        
        const regex = new RegExp(`(${escapeHtml(searchTerm)})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark style="background: #ffeb3b; padding: 1px 2px; border-radius: 2px;">$1</mark>');
    }
    
    // Override renderNotes to include search highlighting
    const originalRenderNotes = renderNotes;
    renderNotes = function() {
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm && notes.length > 0) {
            // Create highlighted version
            const notesGridContainer = document.createElement('div');
            notesGridContainer.className = 'notes-grid';
            
            notesGridContainer.innerHTML = notes.map(note => {
                const highlightedTitle = highlightSearchTerms(note.title, searchTerm);
                const highlightedContent = highlightSearchTerms(note.content, searchTerm);
                
                const createdDate = new Date(note.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                const updatedDate = note.updated_at !== note.created_at ? 
                    new Date(note.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : null;
                
                return `
                    <div class="note-card" data-note-id="${note.id}">
                        <h3 class="note-title">${highlightedTitle}</h3>
                        <p class="note-content">${highlightedContent}</p>
                        <div class="note-meta">
                            <i class="fas fa-calendar-plus"></i>
                            Created: ${createdDate}
                            ${updatedDate ? `<br><i class="fas fa-edit"></i> Updated: ${updatedDate}` : ''}
                        </div>
                        <div class="note-actions">
                            <button class="edit-btn" onclick="editNote(${note.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-btn" onclick="deleteNote(${note.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            notesContainer.innerHTML = '';
            notesContainer.appendChild(notesGridContainer);
        } else {
            originalRenderNotes();
        }
    };
});

// Make functions available globally for onclick handlers
window.editNote = editNote;
window.deleteNote = deleteNote;