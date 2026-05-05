let cachedToken = null;
let tokenRefreshPromise = null;

const getToken = async () => {
  try {
    const { auth } = await import('../lib/firebase');
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    if (tokenRefreshPromise) return tokenRefreshPromise;
    
    tokenRefreshPromise = currentUser.getIdToken(true).then(token => {
      cachedToken = token;
      tokenRefreshPromise = null;
      return token;
    }).catch(err => {
      tokenRefreshPromise = null;
      throw err;
    });
    
    return tokenRefreshPromise;
  } catch (err) {
    console.error('Token error:', err);
    return cachedToken;
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async ({ endpoint, method = 'GET', body = null, requiresAuth = true }) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();

  if (!response.ok) {
    throw { 
      status: response.status, 
      message: data.message || 'An error occurred while fetching data' 
    };
  }

  return data;
};
