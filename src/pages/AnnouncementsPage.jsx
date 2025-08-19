import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import RefreshButton from '../components/RefreshButton';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import 'react-toastify/dist/ReactToastify.css';

const AnnouncementsPage = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info'
  });

  const fetchAnnouncements = () => {
    const saved = localStorage.getItem('announcements');
    if (saved) {
      setAnnouncements(JSON.parse(saved));
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error('Please fill all fields');
      return;
    }

    const announcement = {
      id: Date.now(),
      ...newAnnouncement,
      createdAt: new Date().toISOString(),
      createdBy: localStorage.getItem('username') || 'Admin'
    };

    const updated = [announcement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('announcements', JSON.stringify(updated));

    // Emit real-time update
    window.dispatchEvent(new CustomEvent('announcementAdded', { detail: announcement }));

    toast.success('Announcement added successfully!');
    setNewAnnouncement({ title: '', message: '', type: 'info' });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('announcements', JSON.stringify(updated));
    
    // Emit real-time update
    window.dispatchEvent(new CustomEvent('announcementDeleted', { detail: { id } }));
    
    toast.success('Announcement deleted!');
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
                      <h2 className="text-white mb-0 header-title">Announcements</h2>
                      <small className="text-warning">Manage system announcements</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton onRefresh={fetchAnnouncements} />
                    <Link to="/admin">
                      <Button variant="outline-warning" size="sm">
                        <i className="bi bi-arrow-left me-1"></i>Back to Admin
                      </Button>
                    </Link>
                    <Button variant="outline-light" size="sm" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-1"></i>Logout
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
                <h5 className="text-warning mb-0">All Announcements</h5>
                <Button className="login-button" style={{border: 'none'}} onClick={() => setShowModal(true)}>
                  <i className="bi bi-plus-circle me-2"></i>Add Announcement
                </Button>
              </Card.Header>
              <Card.Body>
                {announcements.length === 0 ? (
                  <p className="text-warning text-center py-4">No announcements found</p>
                ) : (
                  announcements.map(announcement => (
                    <Card key={announcement.id} className="mb-3" style={{background: 'rgba(255,140,0,0.1)', border: '1px solid rgba(255,140,0,0.3)'}}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="text-warning">{announcement.title}</h6>
                            <p className="text-white mb-2">{announcement.message}</p>
                            <small className="text-warning">
                              By {announcement.createdBy} • {new Date(announcement.createdAt).toLocaleString()}
                            </small>
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleDelete(announcement.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Add New Announcement</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Form onSubmit={handleAdd}>
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${newAnnouncement.title ? 'active' : ''}`}>
                Title
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                as="textarea"
                rows={4}
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${newAnnouncement.message ? 'active' : ''}`}>
                Message
              </label>
            </div>
            
            <div className="d-flex gap-2">
              <Button type="submit" className="login-button flex-fill" style={{border: 'none'}}>
                <i className="bi bi-plus-circle me-2"></i>Add Announcement
              </Button>
              <Button variant="outline-secondary" className="flex-fill" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer />
    </div>
  );
};

export default AnnouncementsPage;