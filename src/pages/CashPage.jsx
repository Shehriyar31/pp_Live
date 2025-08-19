import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useGlobalState } from '../context/GlobalContext';
import RefreshButton from '../components/RefreshButton';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import 'react-toastify/dist/ReactToastify.css';

const CashPage = () => {
  const navigate = useNavigate();
  const { users, requests, loading, refreshData, getCashStats } = useGlobalState();
  const [cashStats, setCashStats] = useState({
    totalBalance: 0,
    pendingWithdrawals: 0,
    todayDeposits: 0,
    todayWithdrawals: 0,
    weeklyDeposits: 0,
    weeklyWithdrawals: 0,
    weeklyNet: 0,
    monthlyDeposits: 0,
    monthlyWithdrawals: 0,
    monthlyNet: 0
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const currentUsername = localStorage.getItem('username') || 'Admin';
  const currentUserRole = localStorage.getItem('userRole') || 'admin';
  const isSuperAdmin = currentUserRole === 'superadmin';

  // Calculate real-time cash stats
  const calculateCashStats = () => {
    const totalBalance = users.reduce((sum, user) => sum + (user.balance || 0), 0);
    const pendingWithdrawals = requests
      .filter(req => req.type === 'withdrawal' && req.status === 'pending')
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate deposits from approved requests
    const todayDeposits = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        reqDate.setHours(0, 0, 0, 0);
        return req.type === 'deposit' && req.status === 'approved' && reqDate.getTime() === today.getTime();
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    const todayWithdrawals = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        reqDate.setHours(0, 0, 0, 0);
        return req.type === 'withdrawal' && req.status === 'approved' && reqDate.getTime() === today.getTime();
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    // Weekly calculations
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyDeposits = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        return req.type === 'deposit' && req.status === 'approved' && reqDate >= weekAgo;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    const weeklyWithdrawals = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        return req.type === 'withdrawal' && req.status === 'approved' && reqDate >= weekAgo;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    // Monthly calculations
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    
    const monthlyDeposits = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        return req.type === 'deposit' && req.status === 'approved' && reqDate >= monthAgo;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    const monthlyWithdrawals = requests
      .filter(req => {
        const reqDate = new Date(req.createdAt);
        return req.type === 'withdrawal' && req.status === 'approved' && reqDate >= monthAgo;
      })
      .reduce((sum, req) => sum + (req.amount || 0), 0);
    
    return {
      totalBalance,
      pendingWithdrawals,
      todayDeposits,
      todayWithdrawals,
      weeklyDeposits,
      weeklyWithdrawals,
      weeklyNet: weeklyDeposits - weeklyWithdrawals,
      monthlyDeposits,
      monthlyWithdrawals,
      monthlyNet: monthlyDeposits - monthlyWithdrawals
    };
  };

  // Update cash stats whenever users or requests change (real-time)
  useEffect(() => {
    setCashStats(calculateCashStats());
    setLastUpdated(new Date());
  }, [users, requests]);

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
                      <h2 className="text-white mb-0 header-title">Cash Management</h2>
                      <small className="text-warning">Welcome, {currentUsername} ({isSuperAdmin ? 'Super Admin' : 'Admin'})</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton onRefresh={refreshData} />
                    <Link to="/admin">
                      <Button variant="outline-warning" size="sm">
                        <i className="bi bi-arrow-left me-1"></i>
                        <span className="d-none d-sm-inline">Back to Admin</span>
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
          </Col>
        </Row>

        <Row className="p-4">
          <Col>
            <Card className="admin-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="text-warning mb-0">Cash Overview</h5>
                <small className="text-muted">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </small>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="admin-card">
                      <Card.Body className="text-center">
                        <i className="bi bi-wallet2 text-warning mb-3" style={{fontSize: '40px'}}></i>
                        <h6 className="text-warning">Total Cash Balance</h6>
                        <h3 className="text-white d-flex align-items-center">
                          {loading ? 'Loading...' : `₨${cashStats.totalBalance.toLocaleString()}`}
                          <span className="ms-2 text-success live-indicator" style={{fontSize: '12px'}}>
                            <i className="bi bi-circle-fill"></i> Live
                          </span>
                        </h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="admin-card">
                      <Card.Body className="text-center">
                        <i className="bi bi-hourglass-split text-warning mb-3" style={{fontSize: '40px'}}></i>
                        <h6 className="text-warning">Pending Withdrawals</h6>
                        <h3 className="text-white">₨{cashStats.pendingWithdrawals.toLocaleString()}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="admin-card">
                      <Card.Body className="text-center">
                        <i className="bi bi-arrow-down-circle text-success mb-3" style={{fontSize: '40px'}}></i>
                        <h6 className="text-warning">Today's Deposits</h6>
                        <h3 className="text-white">₨{cashStats.todayDeposits.toLocaleString()}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6} lg={3} className="mb-4">
                    <Card className="admin-card">
                      <Card.Body className="text-center">
                        <i className="bi bi-arrow-up-circle text-danger mb-3" style={{fontSize: '40px'}}></i>
                        <h6 className="text-warning">Today's Withdrawals</h6>
                        <h3 className="text-white">₨{cashStats.todayWithdrawals.toLocaleString()}</h3>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="p-4">
          <Col md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Header>
                <h6 className="text-warning mb-0">Weekly Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-white">Total Deposits</span>
                  <span className="text-success">₨{cashStats.weeklyDeposits.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-white">Total Withdrawals</span>
                  <span className="text-danger">₨{cashStats.weeklyWithdrawals.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-white">Net Balance</span>
                  <span className={`${cashStats.weeklyNet >= 0 ? 'text-success' : 'text-danger'}`}>₨{cashStats.weeklyNet.toLocaleString()}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Header>
                <h6 className="text-warning mb-0">Monthly Summary</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-white">Total Deposits</span>
                  <span className="text-success">₨{cashStats.monthlyDeposits.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-white">Total Withdrawals</span>
                  <span className="text-danger">₨{cashStats.monthlyWithdrawals.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-white">Net Balance</span>
                  <span className={`${cashStats.monthlyNet >= 0 ? 'text-success' : 'text-danger'}`}>₨{cashStats.monthlyNet.toLocaleString()}</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <ToastContainer />
    </div>
  );
};

export default CashPage;