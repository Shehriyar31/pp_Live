import { Container, Row, Col, Card, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { requestAPI } from '../services/api';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import '../components/RequestDetails.css';
import 'react-toastify/dist/ReactToastify.css';

const RequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Fetch requests from MongoDB
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.getRequests();
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to load requests', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
  }, []);


  const handleApprove = async (id) => {
    const request = requests.find(r => r._id === id);
    try {
      setActionLoading(true);
      const response = await requestAPI.approveRequest(id);
      
      if (response.data.success) {
        const message = request?.type === 'Withdraw' 
          ? 'Withdrawal approved! Payment processed successfully.' 
          : 'Deposit approved! User account activated successfully.';
        toast.success(message, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchRequests(); // Refresh requests list
      }
    } catch (error) {
      console.error('Approve request error:', error);
      toast.error('Failed to approve request', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    const request = requests.find(r => r._id === id);
    try {
      setActionLoading(true);
      const response = await requestAPI.rejectRequest(id);
      
      if (response.data.success) {
        const message = request?.type === 'Withdraw' 
          ? 'Withdrawal rejected! Balance refunded to user.' 
          : 'Deposit request rejected and deleted!';
        toast.error(message, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchRequests(); // Refresh requests list
      }
    } catch (error) {
      console.error('Reject request error:', error);
      toast.error('Failed to reject request', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        setActionLoading(true);
        const response = await requestAPI.deleteRequest(id);
        
        if (response.data.success) {
          toast.success('Request deleted successfully!', {
            position: "top-right",
            autoClose: 3000,
            theme: "dark"
          });
          fetchRequests(); // Refresh requests list
        }
      } catch (error) {
        console.error('Delete request error:', error);
        toast.error('Failed to delete request', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      
      // Delete all requests one by one
      const deletePromises = requests.map(request => 
        requestAPI.deleteRequest(request._id)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(`All ${requests.length} requests deleted successfully!`, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      
      fetchRequests(); // Refresh requests list
    } catch (error) {
      console.error('Delete all requests error:', error);
      toast.error('Failed to delete all requests', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
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
                      <h2 className="text-white mb-0 header-title">Deposit/Withdraw Requests</h2>
                      <small className="text-warning">ProfitPro Admin Panel</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={fetchRequests}
                      disabled={loading}
                      className="me-2"
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      <span className="d-none d-sm-inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </Button>
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
                  <i className="bi bi-arrow-left-right text-warning me-3" style={{fontSize: '30px'}}></i>
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
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill text-success me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Approved</h6>
                    <h3 className="text-white mb-0">{requests.filter(r => r.status === 'Approved').length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-x-circle-fill text-danger me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Rejected</h6>
                    <h3 className="text-white mb-0">{requests.filter(r => r.status === 'Rejected').length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="p-4">
          <Col>
            <Card className="admin-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="text-warning mb-0">All Requests</h5>
                <div className="d-flex align-items-center gap-2">
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete ALL requests? This action cannot be undone.')) {
                        handleDeleteAll();
                      }
                    }}
                    disabled={loading || requests.length === 0}
                  >
                    <i className="bi bi-trash me-1"></i>
                    Delete All
                  </Button>
                  <div className="live-indicator me-2">
                    <span className="live-dot" style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#28a745',
                      borderRadius: '50%',
                      marginRight: '5px',
                      animation: 'pulse 2s infinite'
                    }}></span>
                    <small className="text-success">Live</small>
                  </div>
                  {loading && <Spinner animation="border" size="sm" variant="warning" />}
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="users-table-container">
                  {requests.map((request, index) => (
                    <div key={request._id} className="user-row">
                      <div className="user-id">
                        <span className="id-badge">#{index + 1}</span>
                      </div>
                      <div className="user-info">
                        <div className="user-avatar">
                          <i className={`bi ${request.type === 'Deposit' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'} text-warning`}></i>
                        </div>
                        <div className="user-details">
                          <h6 className="user-name">{request.user}</h6>
                          <p className="user-email">@{request.userId?.username || request.username || 'N/A'}</p>
                          <p className="user-phone">₨{request.amount?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="user-meta">
                        <div className="meta-item">
                          <span className="meta-label">Type:</span>
                          <Badge bg={request.type === 'Deposit' ? 'info' : 'secondary'} className="ms-2">
                            {request.type}
                          </Badge>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Date:</span>
                          <span className="meta-value">{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Status:</span>
                          <Badge 
                            bg={request.status === 'Approved' ? 'success' : request.status === 'Rejected' ? 'danger' : 'warning'}
                            className="ms-2"
                          >
                            {request.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="user-actions">
                        {request.status === 'Pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="action-btn approve-btn"
                              onClick={() => handleApprove(request._id)}
                              title="Approve Request"
                              disabled={actionLoading}
                            >
                              <i className="bi bi-check"></i>
                            </Button>
                            <Button 
                              size="sm" 
                              className="action-btn reject-btn"
                              onClick={() => handleReject(request._id)}
                              title="Reject & Delete Request"
                              disabled={actionLoading}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(request)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(request._id)}
                          title="Delete Request"
                          disabled={actionLoading}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Request Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Request Details - {selectedRequest?.user}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          {selectedRequest && (
            <div className="request-details">
              <Row>
                <Col md={6}>
                  <div className="detail-section mb-4">
                    <h6 className="text-warning mb-3">User Information</h6>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedRequest.user}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">@{selectedRequest.userId?.username || selectedRequest.username || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedRequest.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">{selectedRequest.paymentMethod}</span>
                    </div>
                    {selectedRequest.type === 'Withdraw' && (
                      <>
                        <div className="detail-item">
                          <span className="detail-label">Account Number:</span>
                          <span className="detail-value">{selectedRequest.accountNumber}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Account Name:</span>
                          <span className="detail-value">{selectedRequest.accountName}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Bank Name:</span>
                          <span className="detail-value">{selectedRequest.bankName}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="detail-section">
                    <h6 className="text-warning mb-3">Transaction Details</h6>
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <Badge bg={selectedRequest.type === 'Deposit' ? 'info' : 'secondary'} className="ms-2">
                        {selectedRequest.type}
                      </Badge>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value amount">₨{selectedRequest.amount?.toLocaleString()}</span>
                    </div>
                    {selectedRequest.type === 'Deposit' && (
                      <div className="detail-item">
                        <span className="detail-label">Transaction ID:</span>
                        <span className="detail-value">{selectedRequest.transactionId}</span>
                      </div>
                    )}
                    {selectedRequest.type === 'Withdraw' && (
                      <div className="detail-item">
                        <span className="detail-label">Withdrawal Tier:</span>
                        <span className="detail-value">{selectedRequest.description}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <Badge 
                        bg={selectedRequest.status === 'Approved' ? 'success' : selectedRequest.status === 'Rejected' ? 'danger' : 'warning'}
                        className="ms-2"
                      >
                        {selectedRequest.status}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  {selectedRequest.type === 'Deposit' && (
                    <div className="detail-section">
                      <h6 className="text-warning mb-3">Payment Screenshot</h6>
                      <div className="screenshot-container">
                        {selectedRequest.screenshot ? (
                          <img 
                            src={selectedRequest.screenshot} 
                            alt="Payment Screenshot" 
                            className="payment-screenshot"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <div className="text-warning">No screenshot available</div>
                        )}
                        <div style={{display: 'none'}} className="text-warning">Screenshot failed to load</div>
                      </div>
                    </div>
                  )}
                  {selectedRequest.type === 'Withdraw' && (
                    <div className="detail-section">
                      <h6 className="text-warning mb-3">Withdrawal Information</h6>
                      <div className="alert alert-info" style={{background: 'rgba(13,202,240,0.1)', border: '1px solid #0dcaf0'}}>
                        <small className="text-info">
                          <i className="bi bi-info-circle me-2"></i>
                          Balance already deducted from user account. Process payment to user's bank account.
                        </small>
                      </div>
                    </div>
                  )}
                </Col>
              </Row>
              
              {selectedRequest.status === 'Pending' && (
                <div className="modal-actions mt-4 text-center">
                  <Button 
                    className="me-3 approve-btn"
                    onClick={() => {
                      handleApprove(selectedRequest._id);
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-check me-2"></i>Approve Request
                  </Button>
                  <Button 
                    className="reject-btn"
                    onClick={() => {
                      handleReject(selectedRequest._id);
                      setShowDetailsModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-x me-2"></i>Reject & Delete
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      <ToastContainer />
    </div>
  );
};

export default RequestsPage;