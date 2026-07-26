import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/api/apiClient';

const CompanyContext = createContext({
  company: null,
  loading: true,
  refetch: () => {}
});

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    try {
      const data = await apiRequest({ endpoint: '/company' });
      setCompany(data);
      
      if (data.appTitle) {
        document.title = data.appTitle;
      }
      
      if (data.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', data.primaryColor);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany({
        companyName: 'WorkLoop',
        appTitle: 'WorkLoop',
        primaryColor: '#2563eb',
        locations: ['Shed-01', 'Shed-02', 'Office-A'],
        locationLabel: 'Location',
        emailDomain: 'workloop.local',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  return (
    <CompanyContext.Provider value={{ company, loading, refetch: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
