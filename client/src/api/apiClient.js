const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async ({ endpoint, method = 'GET', body = null }) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    const data = await response.json();

    if (!response.ok) {
      throw { 
        status: response.status, 
        message: data.message || 'An error occurred while fetching data' 
      };
    }

    return data;
  } catch (error) {
    throw error;
  }
};
