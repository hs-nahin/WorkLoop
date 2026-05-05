import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../../api/apiClient';
import { AuthContext } from '../../context/AuthContextInstance';

export default function Users() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'IT OFFICER', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('[Users] Fetching /users...');
        const data = await apiRequest({ endpoint: '/users' });
        console.log('[Users] Data:', data);
        
        // Filter valid users: must have email with @ and valid role
        const validUsers = (data || []).filter(u => 
          u.email?.includes('@') && 
          ['IT OFFICER', 'ASSISTANT', 'ADMIN'].includes(u.role?.toUpperCase())
        );
        
        // Deduplicate by email or uid
        const seen = new Set();
        const uniqueUsers = validUsers.filter(u => {
          const key = u.email || u.uid || u.userId;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        setUsers(uniqueUsers);
      } catch (err) {
        console.error('[Users] Error:', err);
        setError(err.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill all required fields');
      return;
    }
    setIsCreating(true);
    try {
      const createdUser = await apiRequest({
        endpoint: '/auth/create-user',
        method: 'POST',
        body: { ...newUser, role: newUser.role.toUpperCase() },
      });
      setUsers([...users, createdUser]);
      setNewUser({ name: '', email: '', role: 'IT OFFICER', password: '' });
      alert('User created successfully');
    } catch (error) {
      alert(error.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const getInitial = (name) => (name?.charAt(0) || 'U').toUpperCase();

  if (isLoading) {
    return <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Loading users...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
        <p style={{ color: '#f87171' }}>Error: {error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem' }}>
          Retry
        </button>
      </div>
    );
  }

  const officers = users.filter(u => u.role?.toUpperCase() === 'IT OFFICER' || u.role?.toUpperCase() === 'IT OFFICER');
  const assistants = users.filter(u => u.role?.toUpperCase() === 'ASSISTANT');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>Personnel Management</h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Oversee and manage system access and user roles</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>IT Officers ({officers.length})</h2>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>Field technicians and IT support officers</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {officers.map((u) => (
                <div key={u.uid || u.email} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 'bold', flexShrink: 0 }}>
                      {getInitial(u.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'No Name'}</p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                        IT Officer
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {officers.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>No IT Officers registered</p>}
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>Assistants ({assistants.length})</h2>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>Assistant technicians and support staff</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {assistants.map((u) => (
                <div key={u.uid || u.email} style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(192,132,252,0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 'bold', flexShrink: 0 }}>
                      {getInitial(u.name)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name || 'No Name'}</p>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</p>
                      <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.625rem', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(192,132,252,0.2)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}>
                        Asst. Technician
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {assistants.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem' }}>No Assistants registered</p>}
          </div>
        </div>

        <div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Register New Personnel</h3>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1.5rem' }}>Create new user account with role assignment</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Enter full name"
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', color: 'white', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <input
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@workloop.com"
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', color: 'white', fontSize: '0.875rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', color: 'white', fontSize: '0.875rem' }}
                >
                  <option value="IT OFFICER">IT Officer</option>
                  <option value="ASSISTANT">Assistant Technician</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Min 6 characters"
                  style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem', color: 'white', fontSize: '0.875rem' }}
                />
              </div>
              <button
                onClick={handleCreateUser}
                disabled={isCreating}
                style={{ width: '100%', padding: '0.5rem', background: isCreating ? '#666' : '#3b82f6', color: 'white', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: isCreating ? 'not-allowed' : 'pointer' }}
              >
                {isCreating ? 'Registering...' : 'Initialize Access'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
