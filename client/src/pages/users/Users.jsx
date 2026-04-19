import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { ToastContext } from '../../../context/ToastContext';
import { apiRequest } from '../../../api/apiClient';
import { MagicCard } from '../../../components/animations/MagicCard';
import { TextHighlighter } from '../../../components/animations/TextHighlighter';
import { GradientText } from '../../../components/animations/GradientText';
import { BlurFade } from '../../../components/animations/BlurFade';

const Users = () => {
  const { token } = useContext(AuthContext);
  const { addToast } = useContext(ToastContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest({ endpoint: '/users', token });
        setUsers(data);
      } catch (error) {
        addToast(error.message || 'Failed to fetch users', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [token, addToast]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          <TextHighlighter text="User Directory" className="text-3xl font-bold tracking-tight" />
          <GradientText text="Manage system access and role assignments" className="text-sm opacity-70" />
        </div>
        <button className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:scale-105 transition-all">
          + Invite User
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => (
            <BlurFade key={user._id} delay={index * 50}>
              <MagicCard>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center text-black font-bold text-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                      user.role === 'ADMIN' ? 'text-red-400 border-red-400/30 bg-red-400/10' :
                      user.role === 'IT OFFICER' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' :
                      'text-blue-400 border-blue-400/30 bg-blue-400/10'
                    }`}>
                      {user.role}
                    </span>
                    <button className="text-xs text-gray-500 hover:text-white transition-colors">Edit User</button>
                  </div>
                </div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
