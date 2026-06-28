const API_URL = 'http://127.0.0.1:8000';

function getAccessToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
}

function isLoggedIn() {
    return !!getAccessToken();
}

function logToConsole(message, type = 'info') {
    const consoleEl = document.getElementById('auth-log-console');
    if (consoleEl) {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;
        consoleEl.appendChild(entry);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    console.log(`[auth-client] ${message}`);
}

async function authenticatedFetch(endpoint, options = {}) {
    let accessToken = getAccessToken();
    if (!options.headers) {
        options.headers = {};
    }
    options.headers['Authorization'] = `Bearer ${accessToken}`;
    if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    let response = await fetch(`${API_URL}${endpoint}`, options);

    // If unauthorized, attempt token refresh
    if (response.status === 401) {
        logToConsole('Access token unauthorized (401). Initiating automatic token refresh...', 'info');
        const refreshed = await performTokenRefresh();
        if (refreshed) {
            logToConsole('Token refresh successful! Re-sending original request...', 'success');
            accessToken = getAccessToken();
            options.headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(`${API_URL}${endpoint}`, options);
        } else {
            logToConsole('Refresh token invalid or expired. Logging out...', 'error');
            logout();
        }
    }

    return response;
}

async function performTokenRefresh() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        logToConsole('No refresh token found in storage.', 'error');
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            setTokens(data.access_token, data.refresh_token);
            logToConsole('JWT Token successfully rotated (Issued fresh access & refresh tokens).', 'success');
            return true;
        }
    } catch (err) {
        logToConsole(`Error contacting auth refresh server: ${err.message}`, 'error');
    }
    return false;
}

function logout() {
    clearTokens();
    if (window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
}
