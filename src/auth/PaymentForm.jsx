import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { requestAPI } from '../services/api';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/PaymentForm.css';
import '../components/ForceRefresh.css';

const PaymentForm = () => {
  const navigate = useNavigate();
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentOptions = {
    easypaisa: {
      name: 'Easypaisa',
      accountName: 'Noshaba',
      accountNumber: '03162515990'
    },
    sadapay: {
      name: 'SadaPay',
      accountName: 'Sumera',
      accountNumber: '03333044418'
    },
    bank: {
      name: 'Bank Account',
      accountName: 'Sumera',
      accountNumber: '00300112775624',
      bankName: 'Meezan Bank'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentMethod) {
      toast.error('Please select a payment method', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    if (!trxId.trim()) {
      toast.error('Please enter transaction ID', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    if (!screenshot) {
      toast.error('Please upload screenshot', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    
    // Get pending user info
    const userId = localStorage.getItem('pendingUserId');
    const username = localStorage.getItem('pendingUsername');
    
    if (!userId) {
      toast.error('Session expired. Please signup again.', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      navigate('/signup');
      return;
    }
    
    setLoading(true);
    
    try {
      // Convert and compress screenshot to base64
      const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            // Resize image to max 800px width to reduce size
            const maxWidth = 800;
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
          };
          
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
      };
      
      const screenshotBase64 = await convertToBase64(screenshot);
      
      const requestData = {
        userId,
        type: 'Deposit',
        amount: 865, // ₨865 activation fee
        paymentMethod: paymentOptions[paymentMethod].name,
        transactionId: trxId,
        screenshot: screenshotBase64
      };
      
      const response = await requestAPI.createRequest(requestData);
      
      if (response.data.success) {
        // Store user credentials for login
        localStorage.setItem('newUserCredentials', JSON.stringify({ username, userId }));
        
        toast.success('Deposit request submitted! Please wait for admin approval to access your dashboard.', {
          position: "top-right",
          autoClose: 4000,
          theme: "dark"
        });
        
        // Navigate to success page
        setTimeout(() => navigate('/success'), 1000);
      }
    } catch (error) {
      console.error('Submit request error:', error);
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

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
  };

  return (
    <div className="login-wrapper">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={6} md={8} sm={10}>
            <div className="login-box">
              <div className="login-header">
                <div className="logo-container">
                  <img src={logo} alt="Logo" className="logo" />
                </div>
                <h2>Welcome to ProfitPro</h2>
                <div className="welcome-message">
                  <p>On ProfitPro, You Can Start Your Own Online Business And Earn Great Income.</p>
                  <p><strong>One Team, One Dream, Unlimited Success</strong></p>
                  <p>Start small, dream big, and achieve more with ProfitPro by your side.</p>
                  <p>Don't wait for opportunities to knock — create your own with ProfitPro today</p>
                  <p>Stop dreaming and start doing — ProfitPro turns ambitions into achievements. ✨</p>
                  <p><em>ProfitPro is an international platform</em></p>
                  <p className="fee-notice">Fee must be applied to join the platform</p>
                </div>
              </div>

              <div className="payment-info">
                <div className="mb-4">
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-input payment-select"
                    id="paymentMethod"
                    required
                  >
                    <option value="">Select Payment Method</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="sadapay">SadaPay</option>
                    <option value="bank">Bank Account</option>
                  </Form.Select>
                </div>

                {paymentMethod && (
                  <Card className="bank-info-card mb-4">
                    <Card.Body>
                      <h5 className="bank-title">{paymentOptions[paymentMethod].name} Details</h5>
                      <div className="bank-details">
                        <div className="bank-item">
                          <strong>Account Number:</strong> {paymentOptions[paymentMethod].accountNumber}
                        </div>
                        <div className="bank-item">
                          <strong>Account Title:</strong> {paymentOptions[paymentMethod].accountName}
                        </div>
                        {paymentOptions[paymentMethod].bankName && (
                          <div className="bank-item">
                            <strong>Bank Name:</strong> {paymentOptions[paymentMethod].bankName}
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                <div className="payment-instructions">
                  <h6 className="instruction-title">Instructions:</h6>
                  <p className="instruction-text">
                    Send <strong>3$ (865 PKR)</strong> to the selected account and provide your transaction ID with screenshot proof below.
                  </p>
                  <div className="service-badges mt-3">
                    <span className="badge bg-success me-2">
                      <i className="bi bi-clock me-1"></i>24/7 Deposit Available
                    </span>
                    <span className="badge bg-warning text-dark">
                      <i className="bi bi-lightning-fill me-1"></i>Instant Activation
                    </span>
                  </div>
                </div>
              </div>
              
              <Form className="login-form" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                  <Form.Control
                    type="text"
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    className="form-input"
                    id="trxId"
                    required
                  />
                  <label htmlFor="trxId" className={`input-label ${trxId ? 'active' : ''}`}>
                    Transaction ID
                  </label>
                </div>

                <div className="input-wrapper">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-input file-input"
                    id="screenshot"
                    required
                  />
                  <label htmlFor="screenshot" className="input-label active">
                    Upload Screenshot
                  </label>
                </div>
                
                <Button style={{'border':'none'}} type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Verification'}
                </Button>
                
                <div className="forgot-password">
                  <Link to="/login">
                    Back to Login
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

export default PaymentForm;