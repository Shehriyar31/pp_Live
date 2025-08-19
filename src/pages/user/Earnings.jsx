import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { videoAPI, userAPI } from '../../services/api';
import RefreshButton from '../../components/RefreshButton';
import AnnouncementTicker from '../../components/AnnouncementTicker';
import useAutoLogout from '../../hooks/useAutoLogout';
import logo from '../../assets/logo.png';
import '../../components/Common.css';
import '../../components/AdminPanel.css';
import '../../components/ForceRefresh.css';
import 'react-toastify/dist/ReactToastify.css';

const Earnings = () => {
  useAutoLogout();
  const navigate = useNavigate();
  const currentFullName = localStorage.getItem('fullName') || 'User';
  const currentUserId = localStorage.getItem('userId');
  
  const [videos, setVideos] = useState([]);
  const [videoStatus, setVideoStatus] = useState({
    dailyClicks: 0,
    remainingClicks: 10,
    canClick: true
  });
  const [userData, setUserData] = useState({
    balance: 0,
    todayEarnings: 0
  });
  const [transactions, setTransactions] = useState([]);

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

  const fetchUserData = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getCurrentUser(currentUserId);
      if (response.data.success) {
        const user = response.data.user;
        setUserData({
          balance: user.balance || 0,
          todayEarnings: user.totalEarnings || 0
        });
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchTransactions = async () => {
    if (!currentUserId) return;
    
    try {
      const response = await userAPI.getUserTransactions(currentUserId);
      if (response.data.success) {
        setTransactions(response.data.transactions.reverse());
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleVideoClick = async (videoId) => {
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
        window.open(response.data.videoUrl, '_blank');
        
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
          
          fetchTransactions();
        }
        
        toast.success(response.data.message, {
          position: "top-right",
          autoClose: 3000,
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

  useEffect(() => {
    fetchVideos();
    fetchVideoStatus();
    fetchUserData();
    fetchTransactions();
  }, []);

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
                      <h2 className="text-white mb-0 header-title">Earnings</h2>
                      <small className="text-warning">Welcome, {currentFullName}</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton />
                    <Link to="/dashboard">
                      <Button variant="outline-warning" size="sm">
                        <i className="bi bi-arrow-left me-1"></i>
                        <span className="d-none d-sm-inline">Back to Dashboard</span>
                        <span className="d-sm-none">Back</span>
                      </Button>
                    </Link>
                    <Button variant="outline-light" size="sm" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-1"></i>
                      <span className="d-none d-sm-inline">Logout</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <AnnouncementTicker />
          </Col>
        </Row>
        
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
                {/* Video Reward Info */}
                <div className="row mb-4 justify-content-center">
                  <div className="col-md-6 mb-3">
                    <div className="earning-card p-4" style={{background: 'rgba(0, 123, 255, 0.1)', borderRadius: '10px', border: '1px solid rgba(0, 123, 255, 0.3)'}}>
                      <div className="text-center">
                        <i className="bi bi-play-btn-fill text-primary mb-3" style={{fontSize: '40px'}}></i>
                        <h5 className="text-white mb-2">Daily Video Reward</h5>
                        <h3 className="text-primary mb-2">₨14 ($0.05)</h3>
                        <small className="text-white">Complete 10 videos daily to earn this reward</small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mb-4">
                  <i className="bi bi-play-btn text-warning mb-3" style={{fontSize: '50px'}}></i>
                  <h5 className="text-white mb-2">Watch 10 Videos Daily & Earn ₨14</h5>
                  <p className="text-white">Complete all 10 videos to earn $0.05 (₨14). Each video opens in a new tab.</p>
                  <div className="progress mb-3" style={{height: '8px'}}>
                    <div 
                      className="progress-bar bg-warning" 
                      role="progressbar" 
                      style={{width: `${(videoStatus.dailyClicks / 10) * 100}%`}}
                    ></div>
                  </div>
                  <small className="text-white">Progress: {videoStatus.dailyClicks}/10 videos completed</small>
                </div>
                {videos.length > 0 ? (
                  <div className="row">
                    {videos.slice(0, 10).map((video, index) => (
                      <div key={video._id} className="col-lg-4 col-md-6 mb-4">
                        <div className="video-card" style={{
                          background: 'rgba(255,140,0,0.1)',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,140,0,0.3)',
                          cursor: videoStatus.canClick ? 'pointer' : 'not-allowed',
                          opacity: videoStatus.canClick ? 1 : 0.6
                        }}
                        onClick={() => handleVideoClick(video._id)}>
                          <div className="video-thumbnail" style={{
                            height: '150px',
                            background: 'linear-gradient(135deg, #ff8c00, #ff6b00)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="bi bi-play-circle-fill text-white" style={{fontSize: '40px'}}></i>
                          </div>
                          <div className="p-3">
                            <h6 className="text-white mb-2">{video.title}</h6>
                            <p className="text-white small mb-2">{video.description}</p>
                            <span className="badge bg-warning">Click to Watch</span>
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
        
        {/* Transaction History */}
        <Row className="p-4">
          <Col>
            <Card className="admin-card">
              <Card.Header>
                <h5 className="text-warning mb-0">Recent Earnings History</h5>
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
                          <th>Balance After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 10).map((transaction, index) => (
                          <tr key={index}>
                            <td>{new Date(transaction.date).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${transaction.type === 'deposit' ? 'bg-success' : 'bg-danger'}`}>
                                {transaction.type === 'deposit' ? 'Earning' : 'Withdrawal'}
                              </span>
                            </td>
                            <td className="text-success">
                              +₨{transaction.amount.toLocaleString()}
                            </td>
                            <td>{transaction.description}</td>
                            <td>₨{transaction.balanceAfter.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-clock-history text-warning mb-3" style={{fontSize: '50px'}}></i>
                    <h6 className="text-white mb-2">No Earnings Yet</h6>
                    <p className="text-white small">Start watching videos to see your earnings history!</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <ToastContainer />
    </div>
  );
};

export default Earnings;