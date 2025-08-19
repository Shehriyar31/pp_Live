import { createContext, useContext, useState, useEffect } from 'react';
import { userAPI, requestAPI } from '../services/api';
import socketService from '../services/socket';

const GlobalContext = createContext();

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalProvider');
  }
  return context;
};

export const GlobalProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users from backend
        const usersResponse = await userAPI.getUsers();
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.users);
        }
        
        // Fetch requests from backend
        const requestsResponse = await requestAPI.getRequests();
        if (requestsResponse.data.success) {
          setRequests(requestsResponse.data.requests);
        }
        
        // Load announcements from localStorage (keeping this as is)
        const savedAnnouncements = localStorage.getItem('announcements');
        if (savedAnnouncements) {
          setAnnouncements(JSON.parse(savedAnnouncements));
        } else {
          const sampleAnnouncements = [
            { id: 1, title: 'Welcome', message: 'Welcome to ProfitPro! Start earning today.', createdAt: new Date().toISOString(), createdBy: 'Admin' },
            { id: 2, title: 'New Feature', message: 'Real-time updates are now available!', createdAt: new Date().toISOString(), createdBy: 'Admin' }
          ];
          setAnnouncements(sampleAnnouncements);
          localStorage.setItem('announcements', JSON.stringify(sampleAnnouncements));
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        // If API fails, show empty arrays instead of sample data
        setUsers([]);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Connect to socket for real-time updates
    socketService.connect();
    
    // Listen for real-time events
    socketService.on('newUser', (newUser) => {
      setUsers(prev => [newUser, ...prev]);
    });
    
    socketService.on('userUpdated', (updatedUser) => {
      setUsers(prev => prev.map(user => 
        user._id === updatedUser._id ? updatedUser : user
      ));
    });
    
    socketService.on('userDeleted', ({ id }) => {
      setUsers(prev => prev.filter(user => user._id !== id));
    });
    
    socketService.on('newRequest', (newRequest) => {
      setRequests(prev => [newRequest, ...prev]);
    });
    
    socketService.on('requestUpdated', (updatedRequest) => {
      setRequests(prev => prev.map(request => 
        request._id === updatedRequest._id ? updatedRequest : request
      ));
    });
    
    socketService.on('requestDeleted', ({ id }) => {
      setRequests(prev => prev.filter(request => request._id !== id));
    });
    
    // Listen for balance updates
    socketService.on('balanceUpdated', (data) => {
      setUsers(prev => prev.map(user => 
        user._id === data.userId ? { ...user, balance: data.newBalance } : user
      ));
    });
    
    // Listen for deposit approvals
    socketService.on('depositApproved', (data) => {
      setRequests(prev => prev.map(request => 
        request._id === data.requestId ? { ...request, status: 'approved' } : request
      ));
      setUsers(prev => prev.map(user => 
        user._id === data.userId ? { ...user, balance: data.newBalance } : user
      ));
    });
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Announcement event listeners
  useEffect(() => {
    const handleAnnouncementAdded = (event) => {
      setAnnouncements(prev => [event.detail, ...prev]);
    };
    
    const handleAnnouncementDeleted = (event) => {
      setAnnouncements(prev => prev.filter(a => a.id !== event.detail.id));
    };

    window.addEventListener('announcementAdded', handleAnnouncementAdded);
    window.addEventListener('announcementDeleted', handleAnnouncementDeleted);

    return () => {
      window.removeEventListener('announcementAdded', handleAnnouncementAdded);
      window.removeEventListener('announcementDeleted', handleAnnouncementDeleted);
    };
  }, []);

  const getStats = () => {
    const currentUserRole = localStorage.getItem('userRole') || 'admin';
    const isSuperAdmin = currentUserRole === 'superadmin';
    const filteredUsers = isSuperAdmin ? users : users.filter(user => user.role !== 'superadmin' && user.role !== 'admin');
    
    return {
      totalUsers: filteredUsers.length,
      activeUsers: filteredUsers.filter(user => user.status === 'Active').length,
      inactiveUsers: filteredUsers.filter(user => user.status === 'Inactive').length,
      totalBalance: filteredUsers.reduce((sum, user) => sum + (user.balance || 0), 0)
    };
  };

  const getCashStats = () => {
    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
    return {
      totalBalance,
      pendingWithdrawals: 4200,
      todayDeposits: 15000,
      todayWithdrawals: 8500,
      weeklyDeposits: 85000,
      weeklyWithdrawals: 42000,
      weeklyNet: 43000,
      monthlyDeposits: 350000,
      monthlyWithdrawals: 180000,
      monthlyNet: 170000
    };
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      
      const [usersResponse, requestsResponse] = await Promise.all([
        userAPI.getUsers(),
        requestAPI.getRequests()
      ]);
      
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.users);
      }
      
      if (requestsResponse.data.success) {
        setRequests(requestsResponse.data.requests);
      }
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    users,
    requests,
    transactions,
    announcements,
    loading,
    getStats,
    getCashStats,
    refreshData
  };



  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};