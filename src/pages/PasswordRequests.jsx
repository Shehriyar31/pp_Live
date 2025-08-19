import { Container, Row, Col, Card, Button, Table, Badge, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { authAPI } from '../services/api';
import RefreshButton from '../components/RefreshButton';
import useAutoLogout from '../hooks/useAutoLogout';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import 'react-toastify/dist/ReactToastify.css';

const PasswordRequests = () => {
  useAutoLogout();
  const navigate = useNavigate();
  const currentUserRole = localStorage.getItem('userRole') || 'admin';
  const currentUsername = localStorage.getItem('username') || 'Admin';
  const isSuperAdmin = currentUserRole === 'superadmin';
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getPasswordRequests();
      if (response.data.success) {
        setRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to load password requests', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000);
    
    return () => clearInterval(interval);
  }, []);



  const handleComplete = async (requestId) => {
    if (!window.confirm('Are you sure you want to complete this password reset request? This will change the user\'s password.')) {
      return;
    }
    
    try {
      const response = await authAPI.approvePasswordReset(requestId);
      if (response.data.success) {
        toast.success('Password reset completed successfully!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchRequests();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to complete request';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this password reset request?')) {
      return;
    }
    
    try {
      const response = await authAPI.rejectPasswordReset(requestId);
      if (response.data.success) {
        toast.success('Password reset request rejected!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchRequests();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reject request';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this password reset request?')) {
      return;
    }
    
    try {
      const response = await authAPI.rejectPasswordReset(requestId); // Same as reject but different message
      if (response.data.success) {
        toast.success('Password reset request deleted!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchRequests();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete request';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
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
                      <h2 className="text-white mb-0 header-title">Password Reset Requests</h2>
                      <small className="text-warning">Welcome, {currentUsername} ({isSuperAdmin ? 'Super Admin' : 'Admin'})</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton onRefresh={fetchRequests} />
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
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-key-fill text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Total Requests</h6>
                    <h3 className="text-white mb-0">{requests.length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock-fill text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Pending</h6>
                    <h3 className="text-white mb-0">{requests.filter(r => r.status === 'Pending').length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        <Row className="p-4">
          <Col>
            <Card className="admin-card">
              <Card.Header>
                <h5 className="text-warning mb-0">Password Reset Requests</h5>
              </Card.Header>
              <Card.Body className="p-0">
                {requests.length === 0 ? (
                  <div className="text-center p-4">
                    <i className="bi bi-key text-warning mb-3" style={{fontSize: '60px'}}></i>
                    <h4 className="text-white mb-3">No Password Requests</h4>
                    <p className="text-warning">Password reset requests will appear here when users submit them.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table variant="dark" className="mb-0">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Username</th>
                          <th>Email</th>
                          <th>Screenshot</th>
                          <th>New Password</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>

                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request, index) => (
                          <tr key={request.userId}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-person-circle text-warning me-2"></i>
                                <strong>{request.username}</strong>
                              </div>
                            </td>
                            <td>{request.email}</td>
                            <td>
                              {request.screenshot ? (
                                <Button 
                                  variant="outline-info" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedImage(request.screenshot);
                                    setShowImageModal(true);
                                  }}
                                >
                                  <i className="bi bi-image me-1"></i>View Screenshot
                                </Button>
                              ) : (
                                <span className="text-muted">No screenshot</span>
                              )}
                            </td>
                            <td>
                              <code className="text-warning">{request.newPassword}</code>
                            </td>
                            <td>
                              <Badge 
                                bg={
                                  request.status === 'Approved' ? 'success' : 
                                  request.status === 'Rejected' ? 'danger' : 'warning'
                                }
                              >
                                {request.status}
                              </Badge>
                            </td>
                            <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="outline-success" 
                                  size="sm"
                                  onClick={() => handleComplete(request.userId)}
                                  title="Complete Request"
                                >
                                  <i className="bi bi-check-lg"></i>
                                </Button>
                                <Button 
                                  variant="outline-danger" 
                                  size="sm"
                                  onClick={() => handleReject(request.userId)}
                                  title="Reject Request"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </Button>
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm"
                                  onClick={() => handleDelete(request.userId)}
                                  title="Delete Request"
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Screenshot Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-dark border-warning">
          <Modal.Title className="text-warning">
            <i className="bi bi-image me-2"></i>Screenshot
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-center">
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Password Reset Screenshot" 
              style={{maxWidth: '100%', maxHeight: '500px', objectFit: 'contain'}}
            />
          )}
        </Modal.Body>
      </Modal>
      
      <ToastContainer />
    </div>
  );
};

export default PasswordRequests;