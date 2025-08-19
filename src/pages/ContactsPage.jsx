import { Container, Row, Col, Card, Button, Badge, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { contactAPI } from '../services/api';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import 'react-toastify/dist/ReactToastify.css';

const ContactsPage = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch contacts from MongoDB
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactAPI.getContacts();
      if (response.data.success) {
        setContacts(response.data.contacts);
      }
    } catch (error) {
      console.error('Fetch contacts error:', error);
      toast.error('Failed to load contacts', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const response = await contactAPI.markAsRead(id);
      if (response.data.success) {
        toast.success('Contact marked as read', {
          position: "top-right",
          autoClose: 2000,
          theme: "dark"
        });
        fetchContacts(); // Refresh contacts list
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      toast.error('Failed to mark as read', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await contactAPI.deleteContact(id);
        if (response.data.success) {
          toast.success('Contact deleted successfully', {
            position: "top-right",
            autoClose: 2000,
            theme: "dark"
          });
          fetchContacts(); // Refresh contacts list
        }
      } catch (error) {
        console.error('Delete contact error:', error);
        toast.error('Failed to delete contact', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
      }
    }
  };

  const handleViewDetails = (contact) => {
    setSelectedContact(contact);
    setShowDetailsModal(true);
    
    // Mark as read if it's new
    if (contact.status === 'New') {
      handleMarkAsRead(contact._id);
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
                      <h2 className="text-white mb-0 header-title">Contact Messages</h2>
                      <small className="text-warning">ProfitPro Admin Panel</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <Button 
                      variant="outline-info" 
                      size="sm"
                      onClick={fetchContacts}
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
                  <i className="bi bi-envelope text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Total Messages</h6>
                    <h3 className="text-white mb-0">{contacts.length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-envelope-exclamation text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">New Messages</h6>
                    <h3 className="text-white mb-0">{contacts.filter(c => c.status === 'New').length}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-envelope-open text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Read Messages</h6>
                    <h3 className="text-white mb-0">{contacts.filter(c => c.status === 'Read').length}</h3>
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
                <h5 className="text-warning mb-0">All Contact Messages</h5>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="users-table-container">
                  {contacts.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-warning">No contact messages found.</p>
                    </div>
                  ) : (
                    contacts.map((contact, index) => (
                      <div key={contact._id} className="user-row">
                        <div className="user-id">
                          <span className="id-badge">#{index + 1}</span>
                        </div>
                        <div className="user-info">
                          <div className="user-avatar">
                            <i className="bi bi-envelope text-warning"></i>
                          </div>
                          <div className="user-details">
                            <h6 className="user-name">{contact.name}</h6>
                            <p className="user-email">{contact.email}</p>
                            <p className="user-phone">{contact.subject}</p>
                          </div>
                        </div>
                        <div className="user-meta">
                          <div className="meta-item">
                            <span className="meta-label">User:</span>
                            <span className="meta-value">@{contact.userId?.username || 'N/A'}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Date:</span>
                            <span className="meta-value">{new Date(contact.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Status:</span>
                            <Badge 
                              bg={contact.status === 'New' ? 'danger' : contact.status === 'Read' ? 'success' : 'warning'}
                              className="ms-2"
                            >
                              {contact.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="user-actions">
                          <Button 
                            size="sm" 
                            className="action-btn view-btn"
                            onClick={() => handleViewDetails(contact)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          {contact.status === 'New' && (
                            <Button 
                              size="sm" 
                              className="action-btn approve-btn"
                              onClick={() => handleMarkAsRead(contact._id)}
                              title="Mark as Read"
                            >
                              <i className="bi bi-check"></i>
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(contact._id)}
                            title="Delete Contact"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      {/* Contact Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Contact Message - {selectedContact?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          {selectedContact && (
            <div className="contact-details">
              <Row>
                <Col md={6}>
                  <div className="detail-section mb-4">
                    <h6 className="text-warning mb-3">Contact Information</h6>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedContact.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedContact.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">@{selectedContact.userId?.username || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{new Date(selectedContact.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <Badge 
                        bg={selectedContact.status === 'New' ? 'danger' : selectedContact.status === 'Read' ? 'success' : 'warning'}
                        className="ms-2"
                      >
                        {selectedContact.status}
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-section">
                    <h6 className="text-warning mb-3">Message Details</h6>
                    <div className="detail-item">
                      <span className="detail-label">Subject:</span>
                      <span className="detail-value">{selectedContact.subject}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Message:</span>
                      <div className="message-content mt-2 p-3" style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 140, 0, 0.2)',
                        color: '#fff',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedContact.message}
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="modal-actions mt-4 text-center">
                {selectedContact.status === 'New' && (
                  <Button 
                    className="me-3 approve-btn"
                    onClick={() => {
                      handleMarkAsRead(selectedContact._id);
                      setShowDetailsModal(false);
                    }}
                  >
                    <i className="bi bi-check me-2"></i>Mark as Read
                  </Button>
                )}
                <Button 
                  className="reject-btn"
                  onClick={() => {
                    handleDelete(selectedContact._id);
                    setShowDetailsModal(false);
                  }}
                >
                  <i className="bi bi-trash me-2"></i>Delete Message
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      <ToastContainer />
    </div>
  );
};

export default ContactsPage;