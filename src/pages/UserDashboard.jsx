import { Container, Row, Col, Card, Button, Navbar, Nav, Form, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { contactAPI, userAPI, videoAPI } from '../services/api';
import RefreshButton from '../components/RefreshButton';
import AnnouncementTicker from '../components/AnnouncementTicker';
import useAutoLogout from '../hooks/useAutoLogout';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import 'react-toastify/dist/ReactToastify.css';

const UserDashboard = () => {
  useAutoLogout();
  const navigate = useNavigate();
  const currentUsername = localStorage.getItem('username') || 'user123';
  const currentFullName = localStorage.getItem('fullName') || 'User';
  const currentUserId = localStorage.getItem('userId');
  const location = useLocation();
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/earnings') return 'earnings';
    if (path === '/withdraw') return 'withdraw';
    if (path === '/referrals') return 'referrals';
    if (path === '/history') return 'history';
    if (path === '/spinner') return 'spinner';
    if (path === '/contact') return 'contact';
    if (path === '/joinus') return 'joinus';
    return 'dashboard';
  };
  const activeSection = getActiveSection();
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    balance: 0,
    todayEarnings: 0,
    referrals: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [spinnerData, setSpinnerData] = useState({
    canSpin: true,
    nextSpinTime: null,
    isSpinning: false,
    result: null
  });
  const [isSpinLocked, setIsSpinLocked] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [userProfile, setUserProfile] = useState({
    username: localStorage.getItem('username') || 'user123',
    email: localStorage.getItem('email') || 'user@example.com',
    fullName: localStorage.getItem('fullName') || 'User Name',
    joinDate: localStorage.getItem('joinDate') || new Date().toLocaleDateString(),
    userId: localStorage.getItem('userId') || 'N/A'
  });
  const [userReferrals, setUserReferrals] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    accountNumber: '',
    accountName: '',
    bankName: ''
  });
  const [withdrawalData, setWithdrawalData] = useState({
    withdrawalCount: 0,
    minimumAmount: 143
  });
  const [customAmount, setCustomAmount] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoStatus, setVideoStatus] = useState({
    dailyClicks: 0,
    remainingClicks: 10,
    canClick: true
  });
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Fetch user data
  const fetchUserData = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getCurrentUser(currentUserId);
      if (response.data.success) {
        const user = response.data.user;
        
        // Check if user status is inactive - force logout
        if (user.status === 'Inactive') {
          toast.error('🚫 Your account has been deactivated by admin', {
            position: "top-center",
            autoClose: 3000,
            theme: "dark"
          });
          setTimeout(() => {
            localStorage.clear();
            navigate('/login');
          }, 3000);
          return;
        }
        
        setUserData({
          balance: user.balance || 0,
          todayEarnings: user.totalEarnings || 0,
          referrals: user.referrals || 0
        });
        
        // Set withdrawal data
        setWithdrawalData({
          withdrawalCount: user.withdrawalCount || 0,
          minimumAmount: getMinimumWithdrawal(user.withdrawalCount || 0)
        });
        // Update profile data if available
        if (user) {
          setUserProfile(prev => ({
            ...prev,
            username: user.username || prev.username,
            email: user.email || prev.email,
            fullName: user.fullName || prev.fullName,
            joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : prev.joinDate
          }));
        }
        fetchUserReferrals();
      }
    } catch (error) {
      // If user not found or unauthorized, logout
      if (error.response?.status === 404 || error.response?.status === 401) {
        toast.error('🚫 Your account has been deleted or deactivated', {
          position: "top-center",
          autoClose: 3000,
          theme: "dark"
        });
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 3000);
      }
    }
  };

  // Fetch videos
  const fetchVideos = async () => {
    try {
      const response = await videoAPI.getVideos();
      if (response.data.success) {
        setVideos(response.data.videos || []);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Fetch video status
  const fetchVideoStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await videoAPI.getVideoStatus(currentUserId);
      if (response.data.success) {
        setVideoStatus({
          dailyClicks: response.data.dailyClicks || 0,
          remainingClicks: response.data.remainingClicks || 10,
          canClick: response.data.canClick || false
        });
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Handle video click
  const handleVideoClick = async (videoId, videoUrl) => {
    if (!videoStatus.canClick || videoStatus.remainingClicks <= 0) {
      toast.error('Daily video limit reached! Try again tomorrow.', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    try {
      const response = await videoAPI.clickVideo(currentUserId, { videoId });
      if (response.data.success) {
        // Open video in new tab
        window.open(response.data.videoUrl, '_blank');
        
        // Update video status
        setVideoStatus({
          dailyClicks: response.data.dailyClicks,
          remainingClicks: response.data.remainingClicks,
          canClick: response.data.remainingClicks > 0
        });
        
        // Update balance if reward earned
        if (response.data.rewardEarned > 0) {
          setUserData(prev => ({
            ...prev,
            balance: response.data.newBalance,
            todayEarnings: prev.todayEarnings + response.data.rewardEarned
          }));
          
          // Refresh transactions to show new reward
          fetchTransactions();
        }
        
        toast.success(response.data.message, {
          position: "top-right",
          autoClose: response.data.rewardEarned > 0 ? 5000 : 3000,
          theme: "dark"
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to process video click';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    }
  };

  const fetchUserReferrals = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getUserReferrals(currentUserId);
      if (response.data.success) {
        setUserReferrals(response.data.referrals || []);
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getUserTransactions(currentUserId);
      if (response.data.success) {
        setTransactions(response.data.transactions.reverse()); // Show latest first
      }
    } catch (error) {
      // Error handled silently
    }
  };

  // Fetch spinner status
  const fetchSpinnerStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getSpinnerStatus(currentUserId);
      if (response.data.success) {
        setSpinnerData(prev => ({
          ...prev,
          canSpin: response.data.canSpin,
          nextSpinTime: response.data.nextSpinTime ? new Date(response.data.nextSpinTime) : null
        }));
        setIsSpinLocked(!response.data.canSpin);
      }
    } catch (error) {
      console.error('Spinner status error:', error);
    }
  };

  // Handle wheel spin
  const handleSpin = async () => {
    if (!spinnerData.canSpin || spinnerData.isSpinning || isSpinLocked) return;
    
    setIsSpinLocked(true);
    setSpinnerData(prev => ({ ...prev, isSpinning: true }));
    
    try {
      const response = await userAPI.spinWheel(currentUserId);
      
      if (response.data.success) {
        // Update spinner status immediately
        setSpinnerData(prev => ({
          ...prev,
          canSpin: false,
          result: response.data.result,
          isSpinning: false
        }));
        
        // Show result
        if (response.data.result === 'try again') {
          toast.info('🔄 Try Again Tomorrow!', {
            position: "top-center",
            autoClose: 4000,
            theme: "dark"
          });
        } else {
          toast.success(`🎉 You won $${response.data.result}!`, {
            position: "top-center",
            autoClose: 8000,
            theme: "dark"
          });
        }
        
        // Refresh data
        fetchUserData();
        fetchSpinnerStatus();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Spinner error';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      setSpinnerData(prev => ({ ...prev, isSpinning: false }));
      setIsSpinLocked(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const timeLeft = tomorrow.getTime() - now.getTime();
      
      if (timeLeft > 0) {
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        setCountdown({ hours, minutes, seconds });
      } else {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Load user data on mount and set up auto-refresh
  useEffect(() => {
    fetchUserData();
    fetchTransactions();
    fetchSpinnerStatus();
    fetchUserReferrals();
    fetchVideos();
    fetchVideoStatus();
    
    // Set up socket listener for real-time balance updates
    const socket = window.io ? window.io() : null;
    if (socket) {
      socket.on('balanceUpdate', (data) => {
        if (data.userId === currentUserId) {
          setUserData(prev => ({
            ...prev,
            balance: data.newBalance,
            todayEarnings: prev.todayEarnings + data.transaction.amount
          }));
          fetchTransactions();
        }
      });
      
      socket.on('userUpdated', (updatedUser) => {
        if (updatedUser._id === currentUserId) {
          setUserData({
            balance: updatedUser.balance || 0,
            todayEarnings: updatedUser.totalEarnings || 0,
            referrals: updatedUser.referrals || 0
          });
          fetchTransactions();
        }
      });
      
      socket.on('levelUpNotification', (data) => {
        if (data.userId === currentUserId) {
          toast.success(`🎉 Congratulations! You've reached Level ${data.level} (${data.levelName})! 🎆\n👥 ${data.members} Members \n💰 Reward: ₨${data.reward.toLocaleString()} ($${data.rewardUSD})`, {
            position: "top-center",
            autoClose: 8000,
            theme: "dark",
            style: {
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '16px'
            }
          });
        }
      });
      
      socket.on('userStatusChanged', (data) => {
        if (data.userId === currentUserId) {
          if (data.accountStatus === 'approved') {
            toast.success('🎉 Account Activated! Welcome to ProfitPro!', {
              position: "top-center",
              autoClose: 5000,
              theme: "dark",
              style: {
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: '#fff',
                fontWeight: 'bold'
              }
            });
            // Refresh user data
            fetchUserData();
          } else if (data.accountStatus === 'rejected') {
            toast.error('⚠️ Account status updated. Please contact support.', {
              position: "top-center",
              autoClose: 5000,
              theme: "dark"
            });
          }
          
          // Check if user status is inactive - force logout
          if (data.status === 'Inactive') {
            toast.error('🚫 Your account has been deactivated by admin', {
              position: "top-center",
              autoClose: 3000,
              theme: "dark"
            });
            setTimeout(() => {
              localStorage.clear();
              navigate('/login');
            }, 3000);
          }
        }
      });
      
      socket.on('userDeleted', (data) => {
        if (data.id === currentUserId) {
          toast.error('🚫 Your account has been deleted by admin', {
            position: "top-center",
            autoClose: 3000,
            theme: "dark"
          });
          setTimeout(() => {
            localStorage.clear();
            navigate('/login');
          }, 3000);
        }
      });
      
      return () => {
        socket.off('balanceUpdate');
        socket.off('userUpdated');
        socket.off('levelUpNotification');
        socket.off('userStatusChanged');
        socket.off('userDeleted');
      };
    }
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchUserData();
      fetchTransactions();
      fetchSpinnerStatus();
      fetchUserReferrals();
      fetchVideoStatus();
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [currentUserId]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      toast.error('Please fill all required fields', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setLoading(true);
    
    try {
      const contactData = {
        userId: currentUserId,
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message
      };
      
      const response = await contactAPI.createContact(contactData);
      
      if (response.data.success) {
        toast.success('Message sent successfully! Admin will review your message.', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinimumWithdrawal = (count) => {
    if (count === 0) return 143; // $0.5
    if (count === 1) return 285; // $1
    if (count === 2) return 855; // $3
    return 1400; // $5 minimum for 4th+ withdrawals
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentForm.accountNumber || !paymentForm.accountName || !paymentForm.bankName) {
      toast.error('Please fill all payment details', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    if (userData.balance < withdrawalData.minimumAmount) {
      toast.error(`Insufficient balance. Minimum withdrawal: ₨${withdrawalData.minimumAmount.toLocaleString()}`, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setLoading(true);
    
    try {
      const finalAmount = withdrawalData.withdrawalCount >= 3 ? parseInt(customAmount) : withdrawalData.minimumAmount;
      
      const withdrawalRequest = {
        userId: currentUserId,
        amount: finalAmount,
        accountNumber: paymentForm.accountNumber,
        accountName: paymentForm.accountName,
        bankName: paymentForm.bankName,
        withdrawalCount: withdrawalData.withdrawalCount
      };
      
      const response = await userAPI.createWithdrawalRequest(withdrawalRequest);
      
      if (response.data.success) {
        toast.success(`Withdrawal request submitted! ₨${response.data.deductedAmount.toLocaleString()} deducted from balance`, {
          position: "top-right",
          autoClose: 4000,
          theme: "dark"
        });
        
        // Update local state immediately
        setUserData(prev => ({
          ...prev,
          balance: response.data.newBalance
        }));
        
        setPaymentForm({ accountNumber: '', accountName: '', bankName: '' });
        setCustomAmount('');
        setShowPaymentModal(false);
        
        // Refresh all data
        fetchUserData();
        fetchTransactions();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit withdrawal request';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };



  return (
    <div className="login-wrapper">
      <Container fluid>
        <Row>
          <Col>
            <div className="admin-header p-4">
              <div className="row align-items-center">
                <div className="col-lg-6 col-md-12 mb-3 mb-lg-0">
                  <div className="d-flex align-items-center">
                    <img src={logo} alt="Logo" className="admin-logo me-3" style={{width: '50px', height: '50px'}} />
                    <div>
                      <h2 className="text-white mb-0 header-title">ProfitPro</h2>
                      <small className="text-warning">Welcome, {currentFullName}</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton />
                    <Button variant="outline-warning" size="sm" onClick={() => setShowProfileModal(true)}>
                      <i className="bi bi-person-circle me-1"></i>
                      <span className="d-none d-sm-inline">Profile</span>
                    </Button>

                    <Button variant="outline-light" size="sm" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-1"></i>
                      <span className="d-none d-sm-inline">Logout</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <Navbar className="admin-navbar" expand="lg" expanded={navbarExpanded} onToggle={setNavbarExpanded}>
              <Container fluid>
                <Navbar.Toggle aria-controls="user-navbar-nav" />
                <Navbar.Collapse id="user-navbar-nav">
                  <Nav className="me-auto">
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/dashboard');
                      }}
                    >
                      <i className="bi bi-speedometer2 me-2"></i>Dashboard
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/earnings');
                      }}
                    >
                      <i className="bi bi-currency-dollar me-2"></i>Earnings
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/withdraw');
                      }}
                    >
                      <i className="bi bi-arrow-up-circle me-2"></i>Withdraw
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/referrals');
                      }}
                    >
                      <i className="bi bi-people me-2"></i>Referrals
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/history');
                      }}
                    >
                      <i className="bi bi-clock-history me-2"></i>History
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/spinner');
                      }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>Spinner
                    </Nav.Link>

                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/contact');
                      }}
                    >
                      <i className="bi bi-envelope me-2"></i>Contact
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/joinus');
                      }}
                    >
                      <i className="bi bi-people-fill me-2"></i>Join Us
                    </Nav.Link>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            <AnnouncementTicker />
          </Col>
        </Row>
        
        {/* Level Box */}
        <Row>
          <Col>
            <div className="level-box mx-3 mx-md-4 mb-3" style={{background: 'linear-gradient(135deg, #ff8c00, #ff6b00)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'}}>
              <div className="p-3">
                <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                  <div className="d-flex align-items-center mb-2 mb-sm-0">
                    <i className="bi bi-trophy-fill text-white me-3" style={{fontSize: '30px'}}></i>
                    <div className="text-center text-sm-start">
                      <h5 className="text-white mb-0">Current Level</h5>
                      <small className="text-white opacity-75">Based on your referrals</small>
                    </div>
                  </div>
                  <div className="text-center text-sm-end">
                    <h3 className="text-white mb-0">Level {userData.referrals >= 1200 ? '16' : userData.referrals >= 1100 ? '15' : userData.referrals >= 1000 ? '14' : userData.referrals >= 900 ? '13' : userData.referrals >= 800 ? '12' : userData.referrals >= 700 ? '11' : userData.referrals >= 600 ? '10' : userData.referrals >= 500 ? '9' : userData.referrals >= 400 ? '8' : userData.referrals >= 300 ? '7' : userData.referrals >= 200 ? '6' : userData.referrals >= 100 ? '5' : userData.referrals >= 50 ? '4' : userData.referrals >= 20 ? '3' : userData.referrals >= 10 ? '2' : userData.referrals >= 5 ? '1' : '0'}</h3>
                    <small className="text-white opacity-75">
                      {userData.referrals >= 1200 ? 'Crown Legend' : userData.referrals >= 1100 ? 'Royal Diamond' : userData.referrals >= 1000 ? 'Diamond Pro' : userData.referrals >= 900 ? 'Diamond Plus' : userData.referrals >= 800 ? 'Diamond Entry' : userData.referrals >= 700 ? 'Platinum Elite' : userData.referrals >= 600 ? 'Platinum Plus' : userData.referrals >= 500 ? 'Platinum Entry' : userData.referrals >= 400 ? 'Golden Pro' : userData.referrals >= 300 ? 'Golden Plus' : userData.referrals >= 200 ? 'Golden Entry' : userData.referrals >= 100 ? 'Silver Pro' : userData.referrals >= 50 ? 'Silver Start' : userData.referrals >= 20 ? 'Bronze Plus' : userData.referrals >= 10 ? 'Bronze Entry' : userData.referrals >= 5 ? 'Starter Bonus' : 'Beginner'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {activeSection === 'dashboard' && (
          <>
            <Row className="p-4">
              <Col lg={3} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-wallet2 text-warning me-3" style={{fontSize: '30px'}}></i>
                      <div>
                        <h6 className="text-warning mb-1">Total Balance</h6>
                        <h3 className="text-white mb-0">₨{userData.balance.toLocaleString()}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-graph-up text-success me-3" style={{fontSize: '30px'}}></i>
                      <div>
                        <h6 className="text-warning mb-1">Today's Earnings</h6>
                        <h3 className="text-white mb-0">₨{userData.todayEarnings.toLocaleString()}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-people text-info me-3" style={{fontSize: '30px'}}></i>
                      <div>
                        <h6 className="text-warning mb-1">Referrals</h6>
                        <h3 className="text-white mb-0">{userData.referrals}</h3>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

            </Row>

            <Row className="p-4">
              <Col md={8} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Welcome to ProfitPro</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-4">
                      <div className="vip-icon mb-4">
                        <i className="bi bi-gem" style={{fontSize: '60px', color: '#ffd700'}}></i>
                      </div>
                      <h4 className="text-warning mb-3">Start Your Journey to Success!</h4>
                      <p className="text-white mb-4">
                        Welcome to ProfitPro - your gateway to unlimited earning potential. 
                        Build your network, earn commissions, and achieve financial freedom.
                      </p>
                      <div className="d-flex justify-content-center gap-3">
                        <Button className="login-button" style={{border: 'none'}} onClick={() => navigate('/referrals')}>
                          <i className="bi bi-play-circle me-2"></i>Get Started
                        </Button>

                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h6 className="text-warning mb-0">Quick Actions</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="d-grid gap-3">
                      <Button 
                        variant="outline-warning" 
                        size="sm"
                        onClick={() => {
                          const referralLink = `https://profitspro.click/signup?ref=${currentUsername}`;
                          navigator.clipboard.writeText(referralLink);
                          toast.success('Referral link copied!', {
                            position: "top-right",
                            autoClose: 2000,
                            theme: "dark"
                          });
                        }}
                      >
                        <i className="bi bi-share me-2"></i>Share Referral Link
                      </Button>
                      <Button 
                        variant="outline-warning" 
                        size="sm"
                        onClick={() => navigate('/withdraw')}
                      >
                        <i className="bi bi-arrow-up-circle me-2"></i>Request Withdrawal
                      </Button>
                      <Button 
                        variant="outline-warning" 
                        size="sm"
                        onClick={() => navigate('/earnings')}
                      >
                        <i className="bi bi-graph-up me-2"></i>View Earnings
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="p-4">
              <Col>
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">📢 Latest Announcements</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-4">
                      <i className="bi bi-megaphone text-warning mb-3" style={{fontSize: '40px'}}></i>
                      <h6 className="text-white mb-2">No announcements at this time</h6>
                      <p className="text-warning small">Check back later for updates!</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeSection === 'earnings' && (
          <>
            <Row className="p-4">
              <Col>
                <Card className="admin-card">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="text-warning mb-0">Daily Videos</h5>
                      <div className="text-end">
                        <span className="badge bg-info me-2">{videoStatus.dailyClicks}/10 Clicked</span>
                        <span className="badge bg-success">{Math.max(0, 10 - videoStatus.dailyClicks)} Remaining</span>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center mb-4">
                      <i className="bi bi-play-btn text-warning mb-3" style={{fontSize: '50px'}}></i>
                      <h5 className="text-white mb-2">Watch Videos & Earn</h5>
                      <p className="text-white">Click on 10 videos daily to complete your tasks. Each video opens in a new tab.</p>
                      <div className="progress mb-3" style={{height: '8px'}}>
                        <div 
                          className="progress-bar bg-warning" 
                          role="progressbar" 
                          style={{width: `${(videoStatus.dailyClicks / 10) * 100}%`}}
                        ></div>
                      </div>
                      <small className="text-white">Progress resets every 24 hours</small>
                      
                      {/* Countdown Timer */}
                      <div className="countdown-timer mt-3 p-3" style={{background: 'rgba(255, 140, 0, 0.1)', borderRadius: '10px', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
                        <div className="text-center">
                          <h6 className="text-warning mb-2">
                            <i className="bi bi-clock me-2"></i>Next Reward Reset In:
                          </h6>
                          <div className="d-flex justify-content-center gap-3">
                            <div className="time-unit text-center">
                              <div className="time-value" style={{background: 'rgba(255, 140, 0, 0.2)', borderRadius: '8px', padding: '10px 15px', minWidth: '60px'}}>
                                <h4 className="text-white mb-0">{String(countdown.hours).padStart(2, '0')}</h4>
                              </div>
                              <small className="text-white mt-1 d-block">Hours</small>
                            </div>
                            <div className="time-separator text-warning" style={{fontSize: '24px', alignSelf: 'center'}}>:</div>
                            <div className="time-unit text-center">
                              <div className="time-value" style={{background: 'rgba(255, 140, 0, 0.2)', borderRadius: '8px', padding: '10px 15px', minWidth: '60px'}}>
                                <h4 className="text-white mb-0">{String(countdown.minutes).padStart(2, '0')}</h4>
                              </div>
                              <small className="text-white mt-1 d-block">Minutes</small>
                            </div>
                            <div className="time-separator text-warning" style={{fontSize: '24px', alignSelf: 'center'}}>:</div>
                            <div className="time-unit text-center">
                              <div className="time-value" style={{background: 'rgba(255, 140, 0, 0.2)', borderRadius: '8px', padding: '10px 15px', minWidth: '60px'}}>
                                <h4 className="text-white mb-0">{String(countdown.seconds).padStart(2, '0')}</h4>
                              </div>
                              <small className="text-white mt-1 d-block">Seconds</small>
                            </div>
                          </div>
                          <small className="text-white mt-2 d-block">Video clicks and rewards reset at midnight</small>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rewards Section */}
                    <div className="rewards-section mb-4">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <div className="reward-card p-3" style={{background: 'rgba(40, 167, 69, 0.1)', borderRadius: '8px', border: '1px solid rgba(40, 167, 69, 0.3)'}}>
                            <div className="text-center">
                              <i className="bi bi-play-btn-fill text-success mb-2" style={{fontSize: '30px'}}></i>
                              <h6 className="text-white mb-1">Daily Video Reward</h6>
                              <h4 className="text-success mb-1">₨14</h4>
                              <small className="text-white">Complete 10 videos daily</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="reward-card p-3" style={{background: 'rgba(255, 193, 7, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.3)'}}>
                            <div className="text-center">
                              <i className="bi bi-arrow-clockwise text-warning mb-2" style={{fontSize: '30px'}}></i>
                              <h6 className="text-white mb-1">Daily Spinner</h6>
                              <h4 className="text-warning mb-1">Up to $5</h4>
                              <small className="text-white">Spin wheel once daily</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4 mb-3">
                          <div className="reward-card p-3" style={{background: 'rgba(0, 123, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(0, 123, 255, 0.3)'}}>
                            <div className="text-center">
                              <i className="bi bi-trophy-fill text-primary mb-2" style={{fontSize: '30px'}}></i>
                              <h6 className="text-white mb-1">Level Rewards</h6>
                              <h4 className="text-primary mb-1">Up to $500</h4>
                              <small className="text-white">Referral milestones</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {videos.length > 0 ? (
                      <div className="row">
                        {videos.slice(0, 10).map((video, index) => (
                          <div key={video._id} className="col-lg-4 col-md-6 mb-4">
                            <div className="video-card" style={{
                              background: 'rgba(255,140,0,0.1)',
                              borderRadius: '10px',
                              border: '1px solid rgba(255,140,0,0.3)',
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              cursor: videoStatus.canClick ? 'pointer' : 'not-allowed',
                              opacity: videoStatus.canClick ? 1 : 0.6
                            }}
                            onClick={() => handleVideoClick(video._id, video.url)}
                            onMouseEnter={(e) => {
                              if (videoStatus.canClick) {
                                e.target.style.transform = 'translateY(-5px)';
                                e.target.style.boxShadow = '0 8px 25px rgba(255,140,0,0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}>
                              <div className="video-thumbnail" style={{
                                height: '150px',
                                background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                              }}>
                                <i className="bi bi-play-circle-fill text-white" style={{fontSize: '40px'}}></i>
                                <div className="video-number" style={{
                                  position: 'absolute',
                                  top: '10px',
                                  left: '10px',
                                  background: 'rgba(0,0,0,0.7)',
                                  color: 'white',
                                  padding: '5px 10px',
                                  borderRadius: '15px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  #{index + 1}
                                </div>
                              </div>
                              <div className="p-3">
                                <h6 className="text-white mb-2" style={{fontSize: '14px'}}>
                                  {video.title}
                                </h6>
                                <p className="text-white small mb-2" style={{fontSize: '12px'}}>
                                  {video.description}
                                </p>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-warning">Click to Watch</span>
                                  <i className="bi bi-box-arrow-up-right text-warning"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="bi bi-camera-video text-warning mb-3" style={{fontSize: '50px'}}></i>
                        <h6 className="text-white mb-2">No Videos Available</h6>
                        <p className="text-white small">Videos will be added by admin soon!</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeSection === 'withdraw' && (
          <Row className="p-4">
            <Col>
              <Card className="admin-card">
                <Card.Header>
                  <h5 className="text-warning mb-0">Withdrawal Request</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-5">
                    <i className="bi bi-arrow-up-circle text-warning mb-3" style={{fontSize: '60px'}}></i>
                    <h4 className="text-white mb-3">
                      {withdrawalData.withdrawalCount >= 3 ? 'Custom Withdrawal Amount' : `Minimum Withdrawal: ₨${withdrawalData.minimumAmount.toLocaleString()}`}
                    </h4>
                    <p className="text-white">Current Balance: ₨{userData.balance.toLocaleString()}</p>
                    <div className="mb-3">
                      <span className="badge bg-success me-2">
                        <i className="bi bi-clock me-1"></i>24/7 Withdrawal Available
                      </span>
                      <span className="badge bg-info">
                        <i className="bi bi-lightning-fill me-1"></i>Fast Processing
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="row justify-content-center">
                        <div className="col-md-8">
                          <div className="withdrawal-info p-3" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,140,0,0.3)'}}>
                            <h6 className="text-warning mb-2">Withdrawal Tiers:</h6>
                            <div className="d-flex justify-content-between text-white small">
                              <span>1st Withdrawal: ₨143 ($0.5)</span>
                              <span className={withdrawalData.withdrawalCount === 0 ? 'text-success' : 'text-muted'}>●</span>
                            </div>
                            <div className="d-flex justify-content-between text-white small">
                              <span>2nd Withdrawal: ₨285 ($1)</span>
                              <span className={withdrawalData.withdrawalCount === 1 ? 'text-success' : 'text-muted'}>●</span>
                            </div>
                            <div className="d-flex justify-content-between text-white small">
                              <span>3rd Withdrawal: ₨855 ($3)</span>
                              <span className={withdrawalData.withdrawalCount === 2 ? 'text-success' : 'text-muted'}>●</span>
                            </div>
                            <div className="d-flex justify-content-between text-white small">
                              <span>4th+ Withdrawal: Min ₨1,400 ($5) - Custom Amount</span>
                              <span className={withdrawalData.withdrawalCount >= 3 ? 'text-success' : 'text-muted'}>●</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {withdrawalData.withdrawalCount >= 3 && (
                      <div className="mb-4">
                        <div className="input-wrapper">
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            className="form-control text-center"
                            placeholder="Enter amount in PKR"
                            min="1400"
                            style={{background: 'rgba(255,140,0,0.1)', border: '1px solid #ff8c00', color: '#fff'}}
                          />
                        </div>
                        <small className="text-warning d-block text-center mt-2">
                          Minimum: ₨1,400 ($5) | Maximum: Your Balance
                        </small>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline-warning" 
                      disabled={withdrawalData.withdrawalCount >= 3 ? 
                        (!customAmount || parseInt(customAmount) < 1400 || parseInt(customAmount) > userData.balance) :
                        userData.balance < withdrawalData.minimumAmount
                      }
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <i className={`bi ${(withdrawalData.withdrawalCount >= 3 ? 
                        (customAmount && parseInt(customAmount) >= 1400 && parseInt(customAmount) <= userData.balance) :
                        userData.balance >= withdrawalData.minimumAmount) ? 'bi-arrow-up-circle' : 'bi-lock'} me-2`}></i>
                      {withdrawalData.withdrawalCount >= 3 ? 
                        (!customAmount || parseInt(customAmount) < 1400 ? 'Enter Valid Amount (Min ₨1,400)' :
                         parseInt(customAmount) > userData.balance ? 'Insufficient Balance' : 'Add Payment Method') :
                        (userData.balance >= withdrawalData.minimumAmount ? 'Add Payment Method' : 'Insufficient Balance')
                      }
                    </Button>
                    
                    <div className="mt-3">
                      <small style={{color: '#ccc', fontSize: '11px'}}>*1% processing fee applies</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeSection === 'referrals' && (
          <>
            <Row className="p-4">
              <Col md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Share Referral Link</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-4">
                      <i className="bi bi-share text-warning mb-3" style={{fontSize: '50px'}}></i>
                      <h5 className="text-white mb-3">Invite Friends & Earn</h5>
                      <p className="text-white mb-4" style={{color: '#ffffff !important'}}>Share your ref link to start earning!</p>
                      <div className="mb-4">
                        <input 
                          type="text" 
                          className="form-control text-center" 
                          value={`https://profitspro.click/signup?ref=${currentUsername}`}
                          readOnly 
                          style={{background: 'rgba(255,140,0,0.1)', border: '1px solid #ff8c00', color: '#fff'}}
                          id="referralLink"
                        />
                      </div>
                      <Button 
                        className="login-button" 
                        style={{border: 'none'}}
                        onClick={() => {
                          const referralLink = document.getElementById('referralLink');
                          referralLink.select();
                          referralLink.setSelectionRange(0, 99999);
                          navigator.clipboard.writeText(referralLink.value);
                          toast.success('Referral link copied to clipboard!', {
                            position: "top-right",
                            autoClose: 2000,
                            theme: "dark"
                          });
                        }}
                      >
                        <i className="bi bi-copy me-2"></i>Copy Link
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">My Referrals ({userReferrals.length})</h5>
                  </Card.Header>
                  <Card.Body>
                    {userReferrals.length > 0 ? (
                      <div className="referrals-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {userReferrals.map((referral, index) => (
                          <div key={referral._id || index} className="p-3 mb-3" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,140,0,0.3)'}}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="text-white fw-bold mb-1">
                                  <i className="bi bi-person-fill me-2 text-warning"></i>
                                  {referral.name}
                                </div>
                                <div className="text-white small mb-1">
                                  <i className="bi bi-at me-1"></i>{referral.username}
                                </div>
                                <div className="text-white small">
                                  <i className="bi bi-envelope me-1"></i>{referral.email}
                                </div>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-success mb-2">Active</span>
                                <div className="text-warning small">
                                  {new Date(referral.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <i className="bi bi-people text-warning mb-3" style={{fontSize: '50px'}}></i>
                        <h6 className="text-white mb-2">No Referrals Yet</h6>
                        <p className="text-white small">Share your referral link to start earning!</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="p-4">
              <Col>
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Level System</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="level-system">
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(255, 140, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-gift text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 1 - Starter Bonus</h6>
                                <small className="text-white">5 Members (₨700 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(139, 69, 19, 0.1)', borderRadius: '8px', border: '1px solid rgba(139, 69, 19, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-award text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 2 - Bronze Entry</h6>
                                <small className="text-white">10 Members (₨1,400 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(139, 69, 19, 0.15)', borderRadius: '8px', border: '1px solid rgba(139, 69, 19, 0.4)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-award-fill text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 3 - Bronze Plus</h6>
                                <small className="text-white">20 Members (₨1,400 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(192, 192, 192, 0.1)', borderRadius: '8px', border: '1px solid rgba(192, 192, 192, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-star text-info me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 4 - Silver Start</h6>
                                <small className="text-white">50 Members (₨1,400 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(192, 192, 192, 0.15)', borderRadius: '8px', border: '1px solid rgba(192, 192, 192, 0.4)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-star-fill text-info me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 5 - Silver Pro</h6>
                                <small className="text-white">100 Members (₨5,600 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-gem text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 6 - Golden Entry</h6>
                                <small className="text-white">200 Members (₨14,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(255, 215, 0, 0.15)', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.4)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-plus-circle text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 7 - Golden Plus</h6>
                                <small className="text-white">300 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(255, 215, 0, 0.2)', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.5)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-trophy text-warning me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 8 - Golden Pro</h6>
                                <small className="text-white">400 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(229, 228, 226, 0.1)', borderRadius: '8px', border: '1px solid rgba(229, 228, 226, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-shield text-secondary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 9 - Platinum Entry</h6>
                                <small className="text-white">500 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(229, 228, 226, 0.15)', borderRadius: '8px', border: '1px solid rgba(229, 228, 226, 0.4)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-shield-fill text-secondary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 10 - Platinum Plus</h6>
                                <small className="text-white">600 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(229, 228, 226, 0.2)', borderRadius: '8px', border: '1px solid rgba(229, 228, 226, 0.5)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-crown text-secondary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 11 - Platinum Elite</h6>
                                <small className="text-white">700 Members (₨28,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(185, 242, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(185, 242, 255, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-diamond text-primary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 12 - Diamond Entry</h6>
                                <small className="text-white">800 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(185, 242, 255, 0.15)', borderRadius: '8px', border: '1px solid rgba(185, 242, 255, 0.4)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-diamond-fill text-primary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 13 - Diamond Plus</h6>
                                <small className="text-white">900 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(185, 242, 255, 0.2)', borderRadius: '8px', border: '1px solid rgba(185, 242, 255, 0.5)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-diamond-half text-primary me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 14 - Diamond Pro</h6>
                                <small className="text-white">1000 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6 mb-3">
                          <div className="level-item p-3" style={{background: 'rgba(138, 43, 226, 0.1)', borderRadius: '8px', border: '1px solid rgba(138, 43, 226, 0.3)'}}>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-gem text-danger me-3" style={{fontSize: '24px'}}></i>
                              <div>
                                <h6 className="text-white mb-1">Level 15 - Royal Diamond</h6>
                                <small className="text-white">1100 Members (₨7,000 Reward)</small>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-12 mb-3">
                          <div className="level-item p-3" style={{background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 140, 0, 0.2))', borderRadius: '8px', border: '2px solid #ffd700'}}>
                            <div className="d-flex align-items-center justify-content-center">
                              <i className="bi bi-crown-fill me-3" style={{fontSize: '30px', color: '#ffd700'}}></i>
                              <div className="text-center">
                                <h5 className="text-warning mb-1">Level 16 - Crown Legend</h5>
                                <h4 className="text-success mb-0">1200 Members (₨140,000 Reward)</h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <div className="progress-info p-3" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '10px', border: '1px solid rgba(255,140,0,0.3)'}}>
                          <h6 className="text-warning mb-3">
                            <i className="bi bi-trophy me-2"></i>
                            Your Progress
                          </h6>
                          <div className="row">
                            <div className="col-md-4 mb-2">
                              <div className="text-white">
                                <strong>Current Level:</strong> Level {userData.referrals >= 1200 ? '16' : userData.referrals >= 1100 ? '15' : userData.referrals >= 1000 ? '14' : userData.referrals >= 900 ? '13' : userData.referrals >= 800 ? '12' : userData.referrals >= 700 ? '11' : userData.referrals >= 600 ? '10' : userData.referrals >= 500 ? '9' : userData.referrals >= 400 ? '8' : userData.referrals >= 300 ? '7' : userData.referrals >= 200 ? '6' : userData.referrals >= 100 ? '5' : userData.referrals >= 50 ? '4' : userData.referrals >= 20 ? '3' : userData.referrals >= 10 ? '2' : userData.referrals >= 5 ? '1' : '0'}
                              </div>
                            </div>
                            <div className="col-md-4 mb-2">
                              <div className="text-success">
                                <strong>Total Referrals:</strong> {userData.referrals}
                              </div>
                            </div>
                            <div className="col-md-4 mb-2">
                              <div className="text-info">
                                <strong>Next Level:</strong> {userData.referrals >= 1200 ? 'Max Level!' : `${userData.referrals >= 1100 ? 1200 - userData.referrals : userData.referrals >= 1000 ? 1100 - userData.referrals : userData.referrals >= 900 ? 1000 - userData.referrals : userData.referrals >= 800 ? 900 - userData.referrals : userData.referrals >= 700 ? 800 - userData.referrals : userData.referrals >= 600 ? 700 - userData.referrals : userData.referrals >= 500 ? 600 - userData.referrals : userData.referrals >= 400 ? 500 - userData.referrals : userData.referrals >= 300 ? 400 - userData.referrals : userData.referrals >= 200 ? 300 - userData.referrals : userData.referrals >= 100 ? 200 - userData.referrals : userData.referrals >= 50 ? 100 - userData.referrals : userData.referrals >= 20 ? 50 - userData.referrals : userData.referrals >= 10 ? 20 - userData.referrals : userData.referrals >= 5 ? 10 - userData.referrals : 5 - userData.referrals} more needed`}
                              </div>
                            </div>
                          </div>
                          {userData.referrals < 1200 && (
                            <div className="progress mt-3" style={{height: '8px'}}>
                              <div 
                                className="progress-bar bg-warning" 
                                role="progressbar" 
                                style={{
                                  width: `${userData.referrals >= 1100 ? ((userData.referrals - 1100) / 100) * 100 : userData.referrals >= 1000 ? ((userData.referrals - 1000) / 100) * 100 : userData.referrals >= 900 ? ((userData.referrals - 900) / 100) * 100 : userData.referrals >= 800 ? ((userData.referrals - 800) / 100) * 100 : userData.referrals >= 700 ? ((userData.referrals - 700) / 100) * 100 : userData.referrals >= 600 ? ((userData.referrals - 600) / 100) * 100 : userData.referrals >= 500 ? ((userData.referrals - 500) / 100) * 100 : userData.referrals >= 400 ? ((userData.referrals - 400) / 100) * 100 : userData.referrals >= 300 ? ((userData.referrals - 300) / 100) * 100 : userData.referrals >= 200 ? ((userData.referrals - 200) / 100) * 100 : userData.referrals >= 100 ? ((userData.referrals - 100) / 100) * 100 : userData.referrals >= 50 ? ((userData.referrals - 50) / 50) * 100 : userData.referrals >= 20 ? ((userData.referrals - 20) / 30) * 100 : userData.referrals >= 10 ? ((userData.referrals - 10) / 10) * 100 : userData.referrals >= 5 ? ((userData.referrals - 5) / 5) * 100 : (userData.referrals / 5) * 100}%`
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeSection === 'spinner' && (
          <Row className="p-4">
            <Col>
              <Card className="admin-card">
                <Card.Header>
                  <h5 className="text-warning mb-0">🎰 Daily Lucky Spinner</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-4">
                    <div className="mb-4" style={{display: 'flex', justifyContent: 'center'}}>
                      <div className={`professional-spinner ${spinnerData.isSpinning ? 'is-spinning' : ''}`}>
                        <ul className="professional-spinner-list">
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$0.05</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$0.1</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$3</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$0.6</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$5</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">$1</p>
                          </li>
                          <li className="professional-spinner-slice">
                            <p className="professional-spinner-slice-text">Try Again</p>
                          </li>
                        </ul>
                        <button 
                          className="professional-spinner-button"
                          onClick={handleSpin}
                          disabled={!spinnerData.canSpin || spinnerData.isSpinning || isSpinLocked}
                        >
                          {spinnerData.isSpinning ? 'SPINNING...' : isSpinLocked ? 'LOCKED' : 'SPIN'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h6 className="text-warning mb-3">🎁 Available Prizes:</h6>
                      <div className="row justify-content-center">
                        <div className="col-md-8">
                          <div className="d-flex flex-wrap justify-content-center gap-2">
                            <span className="badge bg-danger" style={{fontSize: '12px', padding: '8px 12px'}}>$0.05</span>
                            <span className="badge bg-success" style={{fontSize: '12px', padding: '8px 12px'}}>$0.001</span>
                            <span className="badge bg-warning" style={{fontSize: '12px', padding: '8px 12px'}}>$0.2</span>
                            <span className="badge bg-info" style={{fontSize: '12px', padding: '8px 12px'}}>$0.6</span>
                            <span className="badge bg-primary" style={{fontSize: '12px', padding: '8px 12px'}}>$0.8</span>
                            <span className="badge bg-dark" style={{fontSize: '12px', padding: '8px 12px', color: '#ffd700'}}>$1</span>
                            <span className="badge bg-success" style={{fontSize: '12px', padding: '8px 12px'}}>$3</span>
                            <span className="badge bg-danger" style={{fontSize: '12px', padding: '8px 12px'}}>$5</span>
                            <span className="badge bg-secondary" style={{fontSize: '12px', padding: '8px 12px'}}>Try Again</span>
                          </div>
                        </div>
                      </div>

                    </div>
                    
                    {spinnerData.canSpin ? (
                      <Button 
                        className="login-button" 
                        style={{border: 'none', fontSize: '18px', padding: '12px 30px'}}
                        onClick={handleSpin}
                        disabled={spinnerData.isSpinning}
                      >
                        <i className={`bi ${spinnerData.isSpinning ? 'bi-arrow-clockwise' : 'bi-play-circle-fill'} me-2`}></i>
                        {spinnerData.isSpinning ? '🎰 Spinning...' : '🎰 SPIN NOW!'}
                      </Button>
                    ) : (
                      <div>
                        <Button variant="outline-warning" disabled size="lg">
                          <i className="bi bi-clock me-2"></i>Already Spin Today
                        </Button>
                        {spinnerData.nextSpinTime && (
                          <div className="mt-3">
                            <p className="text-warning small">
                              ⏰ Next spin available: {new Date(spinnerData.nextSpinTime).toLocaleString()}
                            </p>
                            <div className="countdown-display p-2" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,140,0,0.3)'}}>
                              <small className="text-white">
                                🕐 Time remaining: {Math.max(0, Math.ceil((new Date(spinnerData.nextSpinTime).getTime() - new Date().getTime()) / (1000 * 60 * 60)))} hours
                              </small>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {spinnerData.result && (
                      <div className="mt-4 p-4" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '15px', border: '2px solid #ff8c00'}}>
                        <h4 className={spinnerData.result === 'try again' ? 'text-warning' : 'text-success'}>
                          {spinnerData.result === 'try again' ? 
                            '🔄 Try Again Tomorrow!' : 
                            `🎉 Congratulations! You Won $${spinnerData.result}! 💰`
                          }
                        </h4>
                        {spinnerData.result !== 'try again' && (
                          <p className="text-success mt-2">💵 Prize added to your balance!</p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <div className="spinner-stats p-3" style={{background: 'rgba(0,0,0,0.3)', borderRadius: '10px'}}>
                        <h6 className="text-warning mb-2">📊 Spinner Statistics:</h6>
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="text-white">
                              <strong>Daily Spins</strong>
                              <div className="text-success">1 Free</div>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="text-white">
                              <strong>Best Prize</strong>
                              <div className="text-warning">$5.00</div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeSection === 'history' && (
          <Row className="p-4">
            <Col>
              <Card className="admin-card">
                <Card.Header>
                  <h5 className="text-warning mb-0">Transaction History</h5>
                </Card.Header>
                <Card.Body>
                  {transactions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-dark table-striped">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Balance After</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((transaction, index) => (
                            <tr key={index}>
                              <td>{new Date(transaction.date).toLocaleString()}</td>
                              <td>
                                <span className={`badge ${transaction.type === 'deposit' ? 'bg-success' : 'bg-danger'}`}>
                                  {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                                </span>
                              </td>
                              <td className={transaction.type === 'deposit' ? 'text-success' : 'text-danger'}>
                                {transaction.type === 'deposit' ? '+' : '-'}₨{transaction.amount.toLocaleString()}
                              </td>
                              <td>{transaction.description}</td>
                              <td>
                                <span className={`badge ${
                                  transaction.status === 'pending' ? 'bg-warning' : 
                                  transaction.status === 'completed' ? 'bg-success' : 
                                  transaction.status === 'rejected' ? 'bg-danger' : 'bg-secondary'
                                }`}>
                                  {transaction.status || 'Completed'}
                                </span>
                              </td>
                              <td>₨{transaction.balanceAfter.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-clock-history text-warning mb-3" style={{fontSize: '60px'}}></i>
                      <h4 className="text-white mb-3">No Transaction History</h4>
                      <p className="text-white">Your transaction history will appear here once you make deposits or withdrawals.</p>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}



        {activeSection === 'contact' && (
          <Row className="p-4">
            <Col>
              <Card className="admin-card">
                <Card.Header>
                  <h5 className="text-warning mb-0">Contact Support</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleContactSubmit}>
                    <Row>
                      <Col md={6}>
                        <div className="input-wrapper mb-3">
                          <Form.Control
                            type="text"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                            className="form-input"
                            required
                          />
                          <label className={`input-label ${contactForm.name ? 'active' : ''}`}>
                            Full Name *
                          </label>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="input-wrapper mb-3">
                          <Form.Control
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                            className="form-input"
                            required
                          />
                          <label className={`input-label ${contactForm.email ? 'active' : ''}`}>
                            Email Address *
                          </label>
                        </div>
                      </Col>
                    </Row>
                    <div className="input-wrapper mb-3">
                      <Form.Control
                        type="text"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                        className="form-input"
                        required
                      />
                      <label className={`input-label ${contactForm.subject ? 'active' : ''}`}>
                        Subject *
                      </label>
                    </div>
                    <div className="input-wrapper mb-4">
                      <Form.Control
                        as="textarea"
                        rows={5}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        className="form-input"
                        required
                      />
                      <label className={`input-label ${contactForm.message ? 'active' : ''}`}>
                        Message *
                      </label>
                    </div>
                    <Button type="submit" className="login-button" style={{border: 'none'}} disabled={loading}>
                      <i className="bi bi-send me-2"></i>{loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {activeSection === 'joinus' && (
          <Row className="p-4">
            <Col>
              <Card className="admin-card">
                <Card.Header>
                  <h5 className="text-warning mb-0">Join Our Community</h5>
                </Card.Header>
                <Card.Body>
                  <div className="text-center py-5">
                    <i className="bi bi-people-fill text-warning mb-4" style={{fontSize: '60px'}}></i>
                    <h4 className="text-white mb-3">Stay Connected With Us!</h4>
                    <p className="text-white mb-4">Join our official channels for updates, tips, and exclusive offers</p>
                    
                    <div className="d-flex justify-content-center gap-4">
                      <div className="social-card p-4" style={{background: 'rgba(37, 211, 102, 0.1)', borderRadius: '15px', border: '1px solid rgba(37, 211, 102, 0.3)', cursor: 'pointer', transition: 'all 0.3s ease'}}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-5px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          window.open('https://whatsapp.com/channel/0029VbAd9fEHQbS29KJ0EH1t', '_blank');
                        }}>
                        <i className="bi bi-whatsapp text-success mb-3" style={{fontSize: '50px'}}></i>
                        <h5 className="text-white mb-2">WhatsApp</h5>
                        <p className="text-white small mb-0">Join our WhatsApp channel</p>
                      </div>
                      
                      <div className="social-card p-4" style={{background: 'rgba(0, 136, 204, 0.1)', borderRadius: '15px', border: '1px solid rgba(0, 136, 204, 0.3)', cursor: 'pointer', transition: 'all 0.3s ease'}}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-5px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(0, 136, 204, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          window.open('https://t.me/profitpropk', '_blank');
                        }}>
                        <i className="bi bi-telegram text-primary mb-3" style={{fontSize: '50px'}}></i>
                        <h5 className="text-white mb-2">Telegram</h5>
                        <p className="text-white small mb-0">Join our Telegram channel</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <small className="text-white">Click on the icons above to join our official channels</small>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
      
      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-warning">
          <Modal.Title className="text-warning">
            <i className="bi bi-person-circle me-2"></i>User Profile
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center mb-4">
            <div className="profile-avatar mb-3">
              <i className="bi bi-person-circle text-warning" style={{fontSize: '80px'}}></i>
            </div>
          </div>
          
          <div className="profile-info">
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Username:</strong>
              </div>
              <div className="col-8">
                <span className="text-white">{userProfile.username}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Full Name:</strong>
              </div>
              <div className="col-8">
                <span className="text-white">{userProfile.fullName}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Email:</strong>
              </div>
              <div className="col-8">
                <span className="text-white">{userProfile.email}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">User ID:</strong>
              </div>
              <div className="col-8">
                <span className="text-white">{userProfile.userId}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Join Date:</strong>
              </div>
              <div className="col-8">
                <span className="text-white">{userProfile.joinDate}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Balance:</strong>
              </div>
              <div className="col-8">
                <span className="text-success">₨{userData.balance.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-4">
                <strong className="text-warning">Total Referrals:</strong>
              </div>
              <div className="col-8">
                <span className="text-info">{userData.referrals}</span>
              </div>
            </div>
            
            {userData.referrals > 0 && (
              <div className="row mb-3">
                <div className="col-12">
                  <strong className="text-warning">Referral List:</strong>
                  <div className="mt-2" style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {userReferrals.length > 0 ? (
                      <div className="referrals-list">
                        {userReferrals.map((referral, index) => (
                          <div key={referral._id || index} className="p-2 mb-2" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '5px', border: '1px solid rgba(255,140,0,0.3)'}}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="text-white fw-bold">
                                  <i className="bi bi-person-fill me-2 text-warning"></i>
                                  {referral.name}
                                </div>
                                <div className="text-white small mt-1">
                                  <i className="bi bi-at me-1"></i>{referral.username}
                                </div>
                                <div className="text-white small">
                                  <i className="bi bi-envelope me-1"></i>{referral.email}
                                </div>
                              </div>
                              <div className="text-end">
                                <span className="badge bg-success mb-1">Active</span>
                                <div className="text-warning small">
                                  {new Date(referral.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <i className="bi bi-hourglass-split text-warning"></i>
                        <p className="text-white small mb-0">Loading referrals...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-warning">
          <Button variant="outline-info" size="sm" onClick={() => {
            fetchUserData();
            fetchUserReferrals();
            toast.info('Profile refreshed!', {
              position: "top-right",
              autoClose: 2000,
              theme: "dark"
            });
          }}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </Button>
          <Button variant="outline-warning" onClick={() => setShowProfileModal(false)}>
            <i className="bi bi-x-circle me-1"></i>Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Payment Method Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
        <Modal.Header closeButton className="bg-dark border-warning">
          <Modal.Title className="text-warning">
            <i className="bi bi-credit-card me-2"></i>Add Payment Method
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center mb-4">
            <h6 className="text-warning">Withdrawal Amount: ₨{withdrawalData.minimumAmount.toLocaleString()}</h6>
            <small className="text-white">Current Balance: ₨{userData.balance.toLocaleString()}</small>
            <div className="mt-2">
              <small style={{color: '#ccc', fontSize: '11px'}}>*1% processing fee will be deducted</small>
            </div>
          </div>
          
          <Form onSubmit={handlePaymentSubmit}>
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={paymentForm.accountNumber}
                onChange={(e) => setPaymentForm({...paymentForm, accountNumber: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${paymentForm.accountNumber ? 'active' : ''}`}>
                Account Number *
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={paymentForm.accountName}
                onChange={(e) => setPaymentForm({...paymentForm, accountName: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${paymentForm.accountName ? 'active' : ''}`}>
                Account Name *
              </label>
            </div>
            
            <div className="input-wrapper mb-4">
              <Form.Control
                type="text"
                value={paymentForm.bankName}
                onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${paymentForm.bankName ? 'active' : ''}`}>
                Bank Name *
              </label>
            </div>
            
            <div className="d-flex gap-2">
              <Button type="submit" className="login-button" style={{border: 'none'}} disabled={loading}>
                <i className="bi bi-check-circle me-1"></i>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="outline-secondary" onClick={() => {
                setPaymentForm({ accountNumber: '', accountName: '', bankName: '' });
                setShowPaymentModal(false);
              }}>
                <i className="bi bi-x-circle me-1"></i>Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default UserDashboard;