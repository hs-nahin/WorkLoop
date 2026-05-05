const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async ({ endpoint, method = 'GET', body = null, requiresAuth = true }) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const { auth } = await import('../lib/firebase');
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
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