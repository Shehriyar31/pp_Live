import { Container, Row, Col, Card, Button, Table, Navbar, Nav, Badge, Spinner, Form, Modal } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useGlobalState } from '../context/GlobalContext';
import { videoAPI } from '../services/api';
import RefreshButton from '../components/RefreshButton';
import AnnouncementTicker from '../components/AnnouncementTicker';
import useAutoLogout from '../hooks/useAutoLogout';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';

const AdminPanel = () => {
  useAutoLogout();
  const navigate = useNavigate();
  const { getStats, users, requests, loading, refreshData } = useGlobalState();
  const stats = getStats();
  const currentUsername = localStorage.getItem('username') || 'Admin';
  const currentUserRole = localStorage.getItem('userRole') || 'admin';
  const isSuperAdmin = currentUserRole === 'superadmin';
  const [activeSection, setActiveSection] = useState('home');
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    url: ''
  });
  const [videoLoading, setVideoLoading] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Get recent users and requests for display
  const recentUsers = users.slice(0, 5);
  const recentRequests = requests.slice(0, 5);

  // Fetch videos
  const fetchVideos = async () => {
    try {
      const response = await videoAPI.getVideos();
      if (response.data.success) {
        setVideos(response.data.videos || []);
      }
    } catch (error) {
      console.error('Fetch videos error:', error);
    }
  };

  // Handle edit video
  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      url: video.url
    });
    setShowEditModal(true);
  };

  // Handle update video
  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.description || !videoForm.url) {
      toast.error('Please fill all fields', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setVideoLoading(true);
    try {
      const response = await videoAPI.updateVideo(editingVideo._id, videoForm);
      if (response.data.success) {
        toast.success('Video updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        setShowEditModal(false);
        setEditingVideo(null);
        setVideoForm({ title: '', description: '', url: '' });
        fetchVideos();
      }
    } catch (error) {
      console.error('Update video error:', error);
      const message = error.response?.data?.message || 'Failed to update video';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setVideoLoading(false);
    }
  };

  // Handle delete video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await videoAPI.deleteVideo(videoId);
      if (response.data.success) {
        toast.success('Video deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        fetchVideos();
      }
    } catch (error) {
      console.error('Delete video error:', error);
      const message = error.response?.data?.message || 'Failed to delete video';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    }
  };

  // Handle video creation
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.description || !videoForm.url) {
      toast.error('Please fill all fields', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }

    setVideoLoading(true);
    try {
      const response = await videoAPI.createVideo(videoForm);
      if (response.data.success) {
        toast.success('Video created successfully!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        setVideoForm({ title: '', description: '', url: '' });
        fetchVideos();
      }
    } catch (error) {
      console.error('Create video error:', error);
      const message = error.response?.data?.message || 'Failed to create video';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setVideoLoading(false);
    }
  };

  // Load videos when videos section is active
  useEffect(() => {
    if (activeSection === 'videos') {
      fetchVideos();
    }
  }, [activeSection]);

  // Socket listeners for real-time updates
  useEffect(() => {
    const socket = window.io ? window.io() : null;
    if (socket) {
      socket.on('newRequest', () => {
        refreshData(); // Refresh all data including requests
      });
      
      socket.on('requestUpdated', () => {
        refreshData(); // Refresh when request status changes
      });
      
      socket.on('requestDeleted', () => {
        refreshData(); // Refresh when request is deleted
      });
      
      return () => {
        socket.off('newRequest');
        socket.off('requestUpdated');
        socket.off('requestDeleted');
      };
    }
  }, [refreshData]);

  const handleApprove = (id) => {
    toast.success(`User ${id} approved successfully!`, {
      position: "top-right",
      autoClose: 3000,
      theme: "dark"
    });
  };

  const handleReject = (id) => {
    toast.error(`User ${id} rejected!`, {
      position: "top-right",
      autoClose: 3000,
      theme: "dark"
    });
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
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <img src={logo} alt="Logo" className="admin-logo me-3" style={{width: '50px', height: '50px'}} />
                  <div>
                    <h2 className="text-white mb-0">Admin Panel - ProfitPro</h2>
                    <small className="text-warning">Welcome, {currentUsername} ({isSuperAdmin ? 'Super Admin' : 'Admin'})</small>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <RefreshButton onRefresh={refreshData} />
                  <Button variant="outline-light" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-1"></i>
                    <span className="d-none d-sm-inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <Navbar className="admin-navbar" expand="lg" expanded={navbarExpanded} onToggle={setNavbarExpanded}>
              <Container fluid>
                <Navbar.Toggle aria-controls="admin-navbar-nav" />
                <Navbar.Collapse id="admin-navbar-nav">
                  <Nav className="me-auto">
                    <Nav.Link 
                      className={activeSection === 'home' ? 'active' : ''}
                      onClick={() => setActiveSection('home')}
                    >
                      <i className="bi bi-house me-2"></i>Home
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/users');
                      }}
                    >
                      <i className="bi bi-people me-2"></i>Users
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/requests');
                      }}
                    >
                      <i className="bi bi-arrow-left-right me-2"></i>Deposit/Withdraw Requests
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/cash');
                      }}
                    >
                      <i className="bi bi-cash-stack me-2"></i>Cash
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/announcements');
                      }}
                    >
                      <i className="bi bi-megaphone me-2"></i>Announcements
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/contacts');
                      }}
                    >
                      <i className="bi bi-envelope me-2"></i>User Contacts
                    </Nav.Link>
                    <Nav.Link 
                      className={activeSection === 'videos' ? 'active' : ''}
                      onClick={() => setActiveSection('videos')}
                    >
                      <i className="bi bi-play-btn me-2"></i>Videos
                    </Nav.Link>
                    <Nav.Link 
                      onClick={() => {
                        setNavbarExpanded(false);
                        navigate('/password-requests');
                      }}
                    >
                      <i className="bi bi-key me-2"></i>Password Requests
                    </Nav.Link>
                  </Nav>
                </Navbar.Collapse>
              </Container>
            </Navbar>
            <AnnouncementTicker />
          </Col>
        </Row>
        


        {loading ? (
          <Row className="p-4">
            <Col className="text-center">
              <Spinner animation="border" variant="warning" />
              <p className="text-white mt-3">Loading real-time data...</p>
            </Col>
          </Row>
        ) : activeSection === 'home' && (
          <>
            <Row className="p-4">
              <Col lg={4} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <h5 className="text-warning">Total Users</h5>
                    <h2 className="text-white">{stats.totalUsers}</h2>
                    <small className="text-warning">Real-time count</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <h5 className="text-warning">Active Users</h5>
                    <h2 className="text-white">{stats.activeUsers}</h2>
                    <small className="text-warning">Currently active</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={4} md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Body>
                    <h5 className="text-warning">Total Balance</h5>
                    <h2 className="text-white">₨{stats.totalBalance.toLocaleString()}</h2>
                    <small className="text-warning">Live balance</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="p-4">
              <Col lg={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Recent Users</h5>
                  </Card.Header>
                  <Card.Body>
                    {recentUsers.length > 0 ? (
                      <Table variant="dark" size="sm">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentUsers.map(user => (
                            <tr key={user._id}>
                              <td>{user.name}</td>
                              <td>
                                <Badge bg={user.accountStatus === 'approved' ? 'success' : user.accountStatus === 'pending' ? 'warning' : 'secondary'}>
                                  {user.accountStatus || user.status}
                                </Badge>
                              </td>
                              <td>₨{(user.balance || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <i className="bi bi-people text-warning" style={{fontSize: '2rem'}}></i>
                        <p className="text-warning mt-2 mb-0">No users registered yet</p>
                        <small className="text-light opacity-75">Users will appear here when they register</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
              
              <Col lg={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Recent Requests</h5>
                  </Card.Header>
                  <Card.Body>
                    {recentRequests.length > 0 ? (
                      <Table variant="dark" size="sm">
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentRequests.map(request => (
                            <tr key={request._id}>
                              <td>{request.user}</td>
                              <td>{request.type}</td>
                              <td>₨{request.amount.toLocaleString()}</td>
                              <td>
                                <Badge bg={request.status === 'Approved' ? 'success' : request.status === 'Pending' ? 'warning' : 'danger'}>
                                  {request.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center py-4">
                        <i className="bi bi-arrow-left-right text-warning" style={{fontSize: '2rem'}}></i>
                        <p className="text-warning mt-2 mb-0">No requests yet</p>
                        <small className="text-light opacity-75">Deposit/Withdraw requests will appear here</small>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {activeSection === 'videos' && (
          <>
            <Row className="p-4">
              <Col md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Add New Video</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form onSubmit={handleCreateVideo}>
                      <div className="input-wrapper mb-3">
                        <Form.Control
                          type="text"
                          value={videoForm.title}
                          onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                          className="form-input"
                          required
                        />
                        <label className={`input-label ${videoForm.title ? 'active' : ''}`}>
                          Video Title *
                        </label>
                      </div>
                      <div className="input-wrapper mb-3">
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={videoForm.description}
                          onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                          className="form-input"
                          required
                        />
                        <label className={`input-label ${videoForm.description ? 'active' : ''}`}>
                          Description *
                        </label>
                      </div>
                      <div className="input-wrapper mb-4">
                        <Form.Control
                          type="url"
                          value={videoForm.url}
                          onChange={(e) => setVideoForm({...videoForm, url: e.target.value})}
                          className="form-input"
                          required
                        />
                        <label className={`input-label ${videoForm.url ? 'active' : ''}`}>
                          Video URL *
                        </label>
                      </div>
                      <Button type="submit" className="login-button" style={{border: 'none'}} disabled={videoLoading}>
                        <i className="bi bi-plus-circle me-2"></i>{videoLoading ? 'Creating...' : 'Add Video'}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6} className="mb-4">
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Video Statistics</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="text-center py-4">
                      <i className="bi bi-play-btn text-warning mb-3" style={{fontSize: '50px'}}></i>
                      <h3 className="text-white mb-2">{videos.length}</h3>
                      <p className="text-warning">Total Videos</p>
                      <small className="text-muted">Users can click 10 videos daily</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row className="p-4">
              <Col>
                <Card className="admin-card">
                  <Card.Header>
                    <h5 className="text-warning mb-0">Manage Videos</h5>
                  </Card.Header>
                  <Card.Body>
                    {videos.length > 0 ? (
                      <div className="table-responsive">
                        <Table variant="dark" striped>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Title</th>
                              <th>Description</th>
                              <th>URL</th>
                              <th>Status</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {videos.map((video, index) => (
                              <tr key={video._id}>
                                <td>{index + 1}</td>
                                <td>{video.title}</td>
                                <td>{video.description.substring(0, 50)}...</td>
                                <td>
                                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-warning">
                                    <i className="bi bi-box-arrow-up-right"></i> View
                                  </a>
                                </td>
                                <td>
                                  <Badge bg={video.isActive ? 'success' : 'secondary'}>
                                    {video.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td>{new Date(video.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <Button 
                                    variant="outline-warning" 
                                    size="sm" 
                                    className="me-2"
                                    onClick={() => handleEditVideo(video)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button 
                                    variant="outline-danger" 
                                    size="sm"
                                    onClick={() => handleDeleteVideo(video._id)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="bi bi-camera-video text-warning mb-3" style={{fontSize: '60px'}}></i>
                        <h4 className="text-white mb-3">No Videos Added</h4>
                        <p className="text-white">Add videos for users to click and earn daily rewards.</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

      </Container>
      
      {/* Edit Video Modal */}
      <Modal show={showEditModal} onHide={() => {
        setShowEditModal(false);
        setEditingVideo(null);
        setVideoForm({ title: '', description: '', url: '' });
      }} centered>
        <Modal.Header closeButton className="bg-dark border-warning">
          <Modal.Title className="text-warning">
            <i className="bi bi-pencil me-2"></i>Edit Video
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <Form onSubmit={handleUpdateVideo}>
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={videoForm.title}
                onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${videoForm.title ? 'active' : ''}`}>
                Video Title *
              </label>
            </div>
            <div className="input-wrapper mb-3">
              <Form.Control
                as="textarea"
                rows={3}
                value={videoForm.description}
                onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${videoForm.description ? 'active' : ''}`}>
                Description *
              </label>
            </div>
            <div className="input-wrapper mb-4">
              <Form.Control
                type="url"
                value={videoForm.url}
                onChange={(e) => setVideoForm({...videoForm, url: e.target.value})}
                className="form-input"
                required
              />
              <label className={`input-label ${videoForm.url ? 'active' : ''}`}>
                Video URL *
              </label>
            </div>
            <div className="d-flex gap-2">
              <Button type="submit" className="login-button" style={{border: 'none'}} disabled={videoLoading}>
                <i className="bi bi-check-circle me-1"></i>
                {videoLoading ? 'Updating...' : 'Update Video'}
              </Button>
              <Button variant="outline-secondary" onClick={() => {
                setShowEditModal(false);
                setEditingVideo(null);
                setVideoForm({ title: '', description: '', url: '' });
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

export default AdminPanel;