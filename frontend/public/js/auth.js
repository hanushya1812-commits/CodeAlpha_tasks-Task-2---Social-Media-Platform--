// ==========================================================================
// VibeNet Auth Controller
// Manages auth.html forms, validation alerts, and login/register flows
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is already logged in, redirect if so
  try {
    const data = await API.auth.getMe();
    if (data.success) {
      window.location.href = '/'; // Redirect to feed
    }
  } catch (error) {
    // User not authenticated, proceed with loading auth forms
    console.log('No active session found, showing auth portal.');
  }
});

// Switching between Log In and Sign Up tabs
function switchTab(tab) {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  closeAlert();

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  }
}

// Password toggle visibility
function togglePasswordVisibility(inputId, iconElement) {
  const passwordInput = document.getElementById(inputId);
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    iconElement.classList.remove('fa-eye-slash');
    iconElement.classList.add('fa-eye');
  } else {
    passwordInput.type = 'password';
    iconElement.classList.remove('fa-eye');
    iconElement.classList.add('fa-eye-slash');
  }
}

// Alert notifications
function showAlert(message) {
  const alertContainer = document.getElementById('auth-alert');
  const alertText = alertContainer.querySelector('.alert-message');
  alertText.textContent = message;
  alertContainer.classList.remove('hidden');
}

function closeAlert() {
  const alertContainer = document.getElementById('auth-alert');
  alertContainer.classList.add('hidden');
}

// Handle login logic
async function handleLogin(event) {
  event.preventDefault();
  closeAlert();

  const usernameOrEmail = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

  try {
    const response = await API.auth.login(usernameOrEmail, password);
    if (response.success) {
      window.location.href = '/'; // Redirect to application
    }
  } catch (error) {
    showAlert(error.message || 'Login failed. Please check your credentials.');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
}

// Handle register logic
async function handleRegister(event) {
  event.preventDefault();
  closeAlert();

  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Profile...';

  try {
    const response = await API.auth.register(username, email, password);
    if (response.success) {
      window.location.href = '/'; // Redirect to application
    }
  } catch (error) {
    showAlert(error.message || 'Registration failed. Try a different username/email.');
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
}
