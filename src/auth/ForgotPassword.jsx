import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/ForceRefresh.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'react-toastify/dist/ReactToastify.css';

// Custom styles for file input and password field
const customStyles = `
  .form-input[type="file"] {
    color: white !important;
  }
  .form-input[type="file"]::-webkit-file-upload-button {
    background-color: #ff8c00;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    margin-right: 10px;
    cursor: pointer;
  }
  .form-input[type="file"]::-webkit-file-upload-button:hover {
    background-color: #e67e00;
  }
  .input-wrapper {
    position: relative;
    margin-bottom: 1rem;
  }
  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none !important;
    border: none !important;
    color: #ff8c00 !important;
    padding: 0 !important;
    z-index: 10;
  }
  .password-toggle:hover {
    color: #e67e00 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !screenshot || !newPassword) {
      toast.error('Please fill all fields, upload screenshot and enter new password', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setLoading(true);
    try {
      // Convert screenshot to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const requestData = { 
          username, 
          email, 
          newPassword, 
          screenshot: reader.result,
          screenshotName: screenshot.name
        };

        
        try {
          const response = await authAPI.forgotPassword(requestData);
          if (response.data.success) {
            toast.success('Your request received. We will change your password in 12 hours.', {
              position: "top-right",
              autoClose: 5000,
              theme: "dark"
            });
            // Reset form
            setUsername('');
            setEmail('');
            setScreenshot(null);
            setNewPassword('');
            setTimeout(() => navigate('/login'), 3000);
          }
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to submit request';
          toast.error(message, {
            position: "top-right",
            autoClose: 3000,
            theme: "dark"
          });
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(screenshot);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit request';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        return;
      }
      setScreenshot(file);
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
                <h2>Reset Password</h2>
                <p>Fill the form below and upload screenshot for password reset request</p>
              </div>
              
              <Form className="login-form" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                    id="username"
                    required
                  />
                  <label htmlFor="username" className={`input-label ${username ? 'active' : ''}`}>
                    Username
                  </label>
                </div>
                
                <div className="input-wrapper">
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    id="email"
                    required
                  />
                  <label htmlFor="email" className={`input-label ${email ? 'active' : ''}`}>
                    Email Address
                  </label>
                </div>
                
                <div className="mb-3">
                  <label className="form-label text-warning mb-2">
                    <i className="bi bi-camera me-2"></i>Upload Screenshot
                  </label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-input"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 140, 0, 0.3)',
                      color: 'white',
                      padding: '12px'
                    }}
                    required
                  />
                  {screenshot && (
                    <small className="text-success mt-1 d-block">
                      <i className="bi bi-check-circle me-1"></i>
                      {screenshot.name} selected
                    </small>
                  )}
                  <small className="text-white mt-1 d-block">
                    Upload a screenshot of your payment proof (Max 5MB)
                  </small>
                </div>
                
                <div className="input-wrapper">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    id="newPassword"
                    minLength={8}
                    required
                  />
                  <label htmlFor="newPassword" className={`input-label ${newPassword ? 'active' : ''}`}>
                    New Password (min 8 chars)
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                </div>
                
                <Button style={{border:'none'}} type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Reset Request'}
                </Button>
              </Form>
              
              <div className="forgot-password text-center">
                <Link to="/login" className="text-warning">
                  <i className="bi bi-arrow-left me-2"></i>Back to Login
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <ToastContainer />
    </div>
  );
};

export default ForgotPassword;