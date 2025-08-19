import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/ForceRefresh.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      // Redirect to appropriate dashboard
      if (userRole === 'superadmin' || userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    
    // Clear form when component mounts
    setUsername('');
    setPassword('');
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please fill all required fields', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Support both username and email login
      const loginData = {
        username: username.trim(),
        password: password.trim()
      };
      
      // If username contains @, treat as email
      if (username.includes('@')) {
        loginData.email = username.trim();
      }
      
      console.log('Login attempt:', loginData);
      const response = await authAPI.login(loginData);
      
      if (response.data.success) {
        const { token, user, redirectTo, message } = response.data;
        
        // Store token and user info
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', user.username);
        localStorage.setItem('fullName', user.name);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('loginTime', Date.now().toString());
        
        if (redirectTo === 'payment') {
          // Store pending user info for payment
          localStorage.setItem('pendingUserId', user.id);
          localStorage.setItem('pendingUsername', user.username);
          
          toast.info(message || 'Please complete your payment to activate account', {
            position: "top-right",
            autoClose: 3000,
            theme: "dark"
          });
          
          setTimeout(() => navigate('/payment'), 1000);
        } else {
          toast.success('Login successful! Redirecting...', {
            position: "top-right",
            autoClose: 2000,
            theme: "dark"
          });
          
          // Redirect based on role
          setTimeout(() => {
            if (user.role === 'superadmin' || user.role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={6} sm={8}>
            <div className="login-box">
              <div className="login-header">
                <div className="logo-container">
                  <img src={logo} alt="Logo" className="logo" />
                </div>
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>
              </div>
              
              <Form className="login-form" onSubmit={handleLogin}>
                <div className="input-wrapper">
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    id="username"
                    autoComplete="off"
                    required
                  />
                  <label htmlFor="username" className={`input-label ${username ? 'active' : ''}`}>
                    Username
                  </label>
                </div>
                
                <div className="input-wrapper">
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    id="password"
                    autoComplete="off"
                    required
                  />
                  <label htmlFor="password" className={`input-label ${password ? 'active' : ''}`}>
                    Password
                  </label>
                </div>
                
                <Button style={{border:'none'}} type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                
                <div className="forgot-password text-center mb-3">
                  <Link to="/forgot-password" className="text-warning">
                    Forgot Password?
                  </Link>
                </div>
                
                <div className="forgot-password">
                  <span className="text-white me-2">Don't have an account?</span>
                  <Link to="/signup">
                    Sign Up
                  </Link>
                </div>
                

              </Form>
            </div>
          </Col>
        </Row>
      </Container>
      <ToastContainer />
    </div>
  );
};

export default LoginForm;