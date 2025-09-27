let token = ''; // store JWT token after login

// Signup
async function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const res = await fetch('http://localhost:3000/auth/signup'
, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  alert(JSON.stringify(data));
}

// Login
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
    alert('Login successful!');
  } else {
    alert(JSON.stringify(data));
  }
}

// Create Note
async function createNote() {
  const title = document.getElementById('title').value;
  const content = document.getElementById('content').value;

  const res = await fetch('/notes', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content })
  });
  const data = await res.json();
  alert(JSON.stringify(data));
}

// Get Notes
async function getNotes() {
  const res = await fetch('/notes', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();

  const list = document.getElementById('notesList');
  list.innerHTML = '';
  data.forEach(note => {
    const li = document.createElement('li');
    li.textContent = `${note.title}: ${note.content}`;
    list.appendChild(li);
  });
}
