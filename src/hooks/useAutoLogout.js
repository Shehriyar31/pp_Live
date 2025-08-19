import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const useAutoLogout = () => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  const logout = () => {
    localStorage.clear();
    toast.warning('Session expired due to inactivity');
    navigate('/login');
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(logout, TIMEOUT_DURATION);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Events that reset the timeout
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimeoutHandler = () => resetTimeout();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeoutHandler, true);
    });

    // Start the timeout
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimeoutHandler, true);
      });
    };
  }, []);
};

export default useAutoLogout;