let token = null; // Store JWT after login

// ---------------- SIGNUP ----------------
async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  alert(data.message);
}

// ---------------- LOGIN ----------------
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();

  if (data.token) {
    token = data.token;
    alert('Login successful');
    getNotes(); // Load notes after login
  } else {
    alert(data.message);
  }
}

// ---------------- CREATE NOTE ----------------
async function createNote() {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;

  if (!token) return alert('Login first');

  const res = await fetch('/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  alert(data.message);
  getNotes();
}

// ---------------- GET NOTES ----------------
async function getNotes() {
  if (!token) return alert('Login first');

  const res = await fetch('/notes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const notes = await res.json();

  const list = document.getElementById('notesList');
  list.innerHTML = '';

  notes.forEach(note => {
  const li = document.createElement('li');
  li.innerHTML = `
    <b>${note.title}</b>: ${note.content} 
    <button onclick="editNote('${note.id}', '${note.title}', '${note.content}')">Edit</button>
    <button onclick="deleteNote('${note.id}')">Delete</button>
  `;
  list.appendChild(li);
});

}

// ---------------- EDIT NOTE ----------------
function editNote(id, oldTitle, oldContent) {
  const newTitle = prompt('Edit title', oldTitle);
  const newContent = prompt('Edit content', oldContent);
  if (newTitle !== null && newContent !== null) {
    updateNote(id, newTitle, newContent);
  }
}

async function updateNote(id, title, content) {
  if (!token) return alert('Login first');

  const res = await fetch(`/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  alert(data.message);
  getNotes();
}

// ---------------- DELETE NOTE ----------------
async function deleteNote(id) {
  if (!token) return alert('Login first');

  const res = await fetch(`/notes/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  alert(data.message);
  getNotes();
}
