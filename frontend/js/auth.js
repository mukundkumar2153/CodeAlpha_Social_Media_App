// If already logged in, skip straight to the feed
if (Auth.isLoggedIn()) window.location.href = 'feed.html';

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const modeText = document.getElementById('mode-text');
const modeToggle = document.getElementById('mode-toggle');
const errorBox = document.getElementById('form-error');

let isLoginMode = true;

modeToggle.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  loginForm.style.display = isLoginMode ? 'block' : 'none';
  registerForm.style.display = isLoginMode ? 'none' : 'block';
  modeText.textContent = isLoginMode ? "Don't have an account?" : 'Already have an account?';
  modeToggle.textContent = isLoginMode ? 'Sign up' : 'Log in';
  errorBox.classList.remove('show');
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    window.location.href = 'feed.html';
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const bio = document.getElementById('reg-bio').value.trim();

    const data = await apiRequest('/auth/register', { method: 'POST', body: { username, email, password, bio } });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    window.location.href = 'feed.html';
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create account';
  }
});
