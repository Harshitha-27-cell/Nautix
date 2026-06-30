// Tab management
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    hideAlert();

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

// Alert notifications
function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alert-box');
    const alertMessage = document.getElementById('alert-message');

    alertBox.className = `alert ${type}`;
    alertMessage.textContent = message;
    alertBox.classList.remove('hidden');
}

function hideAlert() {
    const alertBox = document.getElementById('alert-box');
    if (alertBox) {
        alertBox.classList.add('hidden');
    }
}

// Password fields reveal
function togglePasswordVisibility(fieldId) {
    const input = document.getElementById(fieldId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
    }
}

// Handle login submissions
async function handleLogin(event) {
    event.preventDefault();
    hideAlert();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-btn');

    setLoading(submitBtn, true, 'Verifying Credentials...');

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            setTokens(data.access_token, data.refresh_token);
            window.location.href = 'dashboard.html';
        } else {
            showAlert(data.detail || 'Login authentication failed.', 'error');
        }
    } catch (err) {
        showAlert('Could not connect to the backend authentication server.', 'error');
    } finally {
        setLoading(submitBtn, false, 'Login Access');
    }
}

// Handle registrations
async function handleRegister(event) {
    event.preventDefault();
    hideAlert();

    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const submitBtn = document.getElementById('register-btn');

    setLoading(submitBtn, true, 'Creating Account...');

    try {
        const response = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Registration successful! Please login.', 'success');
            switchTab('login');
            // Auto fill registration email in login
            document.getElementById('login-email').value = email;
        } else {
            showAlert(data.detail || 'Registration account creation failed.', 'error');
        }
    } catch (err) {
        showAlert('Could not connect to the backend authentication server.', 'error');
    } finally {
        setLoading(submitBtn, false, 'Initialize Account');
    }
}

// Button loading state manager
function setLoading(btn, isLoading, text) {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `${text}`;
    }
}

// Load protected dashboard properties
async function loadProtectedProfile() {
    logToConsole('Loading user profile details from GET /auth/me ...', 'info');
    try {
        const response = await authenticatedFetch('/auth/me');
        const data = await response.json();

        if (response.ok) {
            logToConsole('User profile fetched successfully!', 'success');
            document.getElementById('profile-id').textContent = data.id;
            document.getElementById('profile-name').textContent = data.name;
            document.getElementById('profile-email').textContent = data.email;

            // Format date
            const joinedDate = new Date(data.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            document.getElementById('profile-joined').textContent = joinedDate;

            // Update header badge
            document.getElementById('user-badge').innerHTML = `<i class="fa-solid fa-circle-user"></i> ${data.name}`;
        } else {
            logToConsole(`Failed to load profile. Server responded: ${data.detail}`, 'error');
        }
    } catch (err) {
        logToConsole(`Connection error loading profile: ${err.message}`, 'error');
    }
}

// Force a manual token refresh for verification
async function forceTokenRefresh() {
    logToConsole('Manually triggering token refresh call to POST /auth/refresh...', 'info');
    const refreshed = await performTokenRefresh();
    if (refreshed) {
        logToConsole('Manual token refresh successful!', 'success');
        // Re-load profile to test the new access token
        loadProtectedProfile();
    } else {
        logToConsole('Manual token refresh failed.', 'error');
    }
}

// Clear the interactive console logs
function clearLogs() {
    const consoleEl = document.getElementById('auth-log-console');
    if (consoleEl) {
        consoleEl.innerHTML = '<div class="log-entry system">[system] Console log cleared.</div>';
    }
}
