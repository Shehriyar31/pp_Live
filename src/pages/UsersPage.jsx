import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { userAPI } from '../services/api';
import RefreshButton from '../components/RefreshButton';
import useAutoLogout from '../hooks/useAutoLogout';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/AdminPanel.css';
import '../components/ForceRefresh.css';
import '../components/UserRoles.css';
import 'react-toastify/dist/ReactToastify.css';

// Custom styles for search input
const searchInputStyles = `
  .form-input::placeholder {
    color: white !important;
    opacity: 0.8;
  }
  .form-input:focus::placeholder {
    color: rgba(255, 255, 255, 0.6) !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = searchInputStyles;
  document.head.appendChild(styleSheet);
}

const UsersPage = () => {
  useAutoLogout();
  const navigate = useNavigate();
  const currentUserRole = localStorage.getItem('userRole') || 'admin';
  const currentUsername = localStorage.getItem('username') || 'Admin';
  const isSuperAdmin = currentUserRole === 'superadmin';
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [referralTree, setReferralTree] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [cashTransaction, setCashTransaction] = useState({
    type: 'deposit',
    amount: '',
    description: ''
  });
  const [newUser, setNewUser] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    paymentMethod: 'Easypaisa',
    role: 'user',
    status: 'active'
  });
  const [editUser, setEditUser] = useState({
    id: '',
    username: '',
    password: '',
    role: '',
    status: ''
  });

  // Fetch users from MongoDB
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers();
      if (response.data.success) {
        // Filter out superadmin from display but show regular admins
        const filteredUsers = response.data.users.filter(user => user.role !== 'superadmin');
        setUsers(filteredUsers);
        setFilteredUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to load users', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount and set up auto-refresh
  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchUsers, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter users based on search term and status
  useEffect(() => {
    let filtered = users;
    
    // Filter by status
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.status === 'Active');
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(user => user.status === 'Inactive');
    }
    // 'all' shows all users, no additional filtering needed
    
    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, users, statusFilter]);

  // Calculate stats from users
  const getStats = () => {
    const regularUsers = users.filter(user => user.role === 'user');
    const adminUsers = users.filter(user => user.role === 'admin');
    
    return {
      totalUsers: regularUsers.length,
      activeUsers: regularUsers.filter(user => user.status === 'Active').length,
      inactiveUsers: regularUsers.filter(user => user.status === 'Inactive').length,
      totalBalance: regularUsers.reduce((sum, user) => sum + (user.balance || 0), 0),
      totalAdmins: adminUsers.length
    };
  };

  const stats = getStats();

  const handleCash = (user) => {
    setSelectedUser(user);
    setCashTransaction({ type: 'deposit', amount: '', description: '' });
    setShowCashModal(true);
  };

  const handleViewReferrals = async (user) => {
    setSelectedUser(user);
    setLoadingReferrals(true);
    setShowReferralModal(true);
    
    try {
      const response = await userAPI.getUserReferrals(user._id);
      if (response.data.success) {
        setReferralTree(response.data.referrals || []);
      }
    } catch (error) {
      console.error('Fetch referrals error:', error);
      toast.error('Failed to load referrals', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleEdit = (user) => {
    setEditUser({
      id: user._id,
      username: user.username,
      password: '',
      role: user.role || 'user',
      status: user.status.toLowerCase()
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        const response = await userAPI.deleteUser(id);
        
        if (response.data.success) {
          toast.success('User deleted successfully!', {
            position: "top-right",
            autoClose: 3000,
            theme: "dark"
          });
          fetchUsers(); // Refresh users list
        }
      } catch (error) {
        console.error('Delete user error:', error);
        toast.error('Failed to delete user', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.username || !newUser.email || !newUser.phone || !newUser.password) {
      toast.error('Please fill all required fields', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    
    if (!newUser.phone || newUser.phone.length !== 11 || !/^03\d{9}$/.test(newUser.phone)) {
      toast.error('Phone number must be 11 digits and start with 03', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    

    
    try {
      setLoading(true);
      const userData = {
        name: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        password: newUser.password,
        paymentMethod: newUser.paymentMethod,
        role: newUser.role
      };
      
      const response = await userAPI.createUser(userData);
      
      if (response.data.success) {
        toast.success(`${newUser.role === 'admin' ? 'Admin' : 'User'} created successfully!`, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        
        setNewUser({ fullName: '', username: '', email: '', phone: '', password: '', paymentMethod: 'Easypaisa', role: 'user', status: 'active' });
        setShowModal(false);
        fetchUsers(); // Refresh users list
      }
    } catch (error) {
      console.error('Create user error:', error);
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field, value) => {
    setEditUser(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const updateData = {
        status: editUser.status === 'active' ? 'Active' : 'Inactive'
      };
      
      // Only include password if it's provided
      if (editUser.password && editUser.password.trim()) {
        updateData.password = editUser.password;
      }
      
      const response = await userAPI.updateUser(editUser.id, updateData);
      
      if (response.data.success) {
        toast.success('User updated successfully!', {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        
        setShowEditModal(false);
        setEditUser({ id: '', username: '', password: '', role: '', status: '' });
        fetchUsers(); // Refresh users list
      }
    } catch (error) {
      console.error('Update user error:', error);
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message, {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCashInputChange = (field, value) => {
    setCashTransaction(prev => ({ ...prev, [field]: value }));
  };

  const handleCashSubmit = async (e) => {
    e.preventDefault();
    if (!cashTransaction.amount) {
      toast.error('Amount is required', {
        position: "top-right",
        autoClose: 3000,
        theme: "dark"
      });
      return;
    }
    
    try {
      setLoading(true);
      const amount = parseFloat(cashTransaction.amount);
      
      const response = await userAPI.updateBalance(selectedUser._id, {
        amount,
        type: cashTransaction.type,
        description: cashTransaction.description
      });
      
      if (response.data.success) {
        toast.success(`${cashTransaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ₨${amount.toLocaleString()} processed for ${selectedUser.name}`, {
          position: "top-right",
          autoClose: 3000,
          theme: "dark"
        });
        
        setShowCashModal(false);
        setCashTransaction({ type: 'deposit', amount: '', description: '' });
        setSelectedUser(null);
        fetchUsers(); // Refresh users list to show updated balance
      }
    } catch (error) {
      console.error('Balance update error:', error);
      const message = error.response?.data?.message || 'Failed to update balance';
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
                      <h2 className="text-white mb-0 header-title">Users Management</h2>
                      <small className="text-warning">Welcome, {currentUsername} ({isSuperAdmin ? 'Super Admin' : 'Admin'})</small>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6 col-md-12">
                  <div className="d-flex justify-content-lg-end justify-content-center gap-2">
                    <RefreshButton onRefresh={fetchUsers} />
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
                  <i className="bi bi-people-fill text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Regular Users</h6>
                    <h3 className="text-white mb-0">{stats.totalUsers}</h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <Card className="admin-card">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <i className="bi bi-shield-check text-warning me-3" style={{fontSize: '30px'}}></i>
                  <div>
                    <h6 className="text-warning mb-1">Admins</h6>
                    <h3 className="text-white mb-0">{stats.totalAdmins}</h3>
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
                    <h6 className="text-warning mb-1">Active</h6>
                    <h3 className="text-white mb-0">{stats.activeUsers}</h3>
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
                    <h6 className="text-warning mb-1">Inactive</h6>
                    <h3 className="text-white mb-0">{stats.inactiveUsers}</h3>
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
                    <h6 className="text-warning mb-1">Total Balance</h6>
                    <h3 className="text-white mb-0">₨{stats.totalBalance.toLocaleString()}</h3>
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="text-warning mb-0">All Users</h5>
                  <Button 
                    className="login-button" 
                    style={{border: 'none'}}
                    onClick={() => setShowModal(true)}
                  >
                    <i className="bi bi-plus-circle me-2"></i>Add New User
                  </Button>
                </div>
                <div className="d-flex justify-content-center mb-3">
                  <div className="btn-group" role="group">
                    <Button 
                      variant={statusFilter === 'active' ? 'success' : 'outline-success'}
                      size="sm"
                      onClick={() => setStatusFilter('active')}
                    >
                      <i className="bi bi-check-circle me-1"></i>Active
                    </Button>
                    <Button 
                      variant={statusFilter === 'inactive' ? 'secondary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setStatusFilter('inactive')}
                    >
                      <i className="bi bi-x-circle me-1"></i>Inactive
                    </Button>
                    <Button 
                      variant={statusFilter === 'all' ? 'warning' : 'outline-warning'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                    >
                      <i className="bi bi-people me-1"></i>All
                    </Button>
                  </div>
                </div>
                <div className="search-container" style={{position: 'relative'}}>
                  <Form.Control
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    id="userSearch"
                    placeholder="🔍 Search by name or username..."
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 140, 0, 0.3)',
                      color: 'white',
                      '::placeholder': { color: 'white !important' }
                    }}
                  />
                  {searchTerm && (
                    <Button 
                      variant="link" 
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                      style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', padding: '0', color: '#ff8c00', zIndex: 10}}
                    >
                      <i className="bi bi-x-circle"></i>
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="users-table-container">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center p-4">
                      <p className="text-warning">
                        {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found. Users will appear here after signup.'}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user, index) => (
                    <div key={user._id || `user-${index}`} className="user-row">
                      <div className="user-id">
                        <span className="id-badge">#{index + 1}</span>
                      </div>
                      <div className="user-info">
                        <div className="user-avatar">
                          <i className={`bi ${user.role === 'admin' ? 'bi-shield-check' : 'bi-person-circle'} text-warning`}></i>
                        </div>
                        <div className="user-details">
                          <div className="d-flex align-items-center gap-2">
                            <h6 className="user-name mb-0">{user.name}</h6>
                            <Badge 
                              bg={user.role === 'admin' ? 'warning' : 'info'} 
                              className="role-badge"
                            >
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </div>
                          <p className="user-username text-warning">@{user.username}</p>
                          <p className="user-email">{user.email}</p>
                          <p className="user-phone">{user.phone}</p>
                        </div>
                      </div>
                      <div className="user-meta">
                        <div className="meta-item">
                          <span className="meta-label">Payment:</span>
                          <Badge bg="info" className="ms-2">{user.paymentMethod}</Badge>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Balance:</span>
                          <span className={`meta-value cash-balance ${user.balance > 0 ? 'positive' : 'zero'}`}>
                            ₨{user.balance.toLocaleString()}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Role:</span>
                          <Badge 
                            bg={user.role === 'admin' ? 'warning' : 'info'}
                            className="ms-2"
                          >
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </div>
                        <div className="meta-item">
                          <span className="meta-label">Status:</span>
                          <Badge 
                            bg={user.status === 'Active' ? 'success' : 'secondary'}
                            className="ms-2"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="user-actions">
                        <Button 
                          size="sm" 
                          className="action-btn cash-btn"
                          onClick={() => handleCash(user)}
                          title="Cash Management"
                        >
                          C
                        </Button>
                        <Button 
                          size="sm" 
                          className="action-btn referral-btn"
                          onClick={() => handleViewReferrals(user)}
                          title="View Referral Tree"
                          style={{background: '#17a2b8', border: '1px solid #17a2b8'}}
                        >
                          <i className="bi bi-diagram-3"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          className="action-btn edit-btn"
                          onClick={() => handleEdit(user)}
                          title="Edit User"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button 
                          size="sm" 
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(user._id)}
                          title="Delete User"
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
      
      {/* Add User Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Form onSubmit={handleAddUser}>
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={newUser.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="form-input"
                id="newFullName"
                required
              />
              <label htmlFor="newFullName" className={`input-label ${newUser.fullName ? 'active' : ''}`}>
                Full Name
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={newUser.username}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  handleInputChange('username', value);
                }}
                className="form-input"
                id="newUsername"
                required
              />
              <label htmlFor="newUsername" className={`input-label ${newUser.username ? 'active' : ''}`}>
                Username (no spaces)
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="email"
                value={newUser.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="form-input"
                id="newEmail"
                required
              />
              <label htmlFor="newEmail" className={`input-label ${newUser.email ? 'active' : ''}`}>
                Email Address
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={newUser.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 11) {
                    handleInputChange('phone', value);
                  }
                }}
                className="form-input"
                id="newPhone"
                placeholder="03001234567"
                required
              />
              <label htmlFor="newPhone" className={`input-label ${newUser.phone ? 'active' : ''}`}>
                Phone Number (start with 03)
              </label>
              {newUser.phone && (newUser.phone.length !== 11 || !newUser.phone.startsWith('03')) && (
                <small className="text-danger mt-1 d-block">
                  Phone number must be 11 digits and start with 03
                </small>
              )}
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="password"
                value={newUser.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="form-input"
                id="newPassword"
                required
                minLength={8}
              />
              <label htmlFor="newPassword" className={`input-label ${newUser.password ? 'active' : ''}`}>
                Password (min 8 chars)
              </label>
            </div>
            
            <div className="mb-3">
              <Form.Select
                value={newUser.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                className="form-input modal-select"
              >
                <option value="Easypaisa">Easypaisa</option>
                <option value="SadaPay">SadaPay</option>
                <option value="Bank Account">Bank Account</option>
              </Form.Select>
              <small className="text-warning">Payment Method</small>
            </div>
            
            <div className="mb-3">
              <Form.Select
                value={newUser.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="form-input modal-select"
              >
                <option value="user">User</option>
                {isSuperAdmin && <option value="admin">Admin</option>}
              </Form.Select>
              <small className="text-warning">
                Role {!isSuperAdmin && '(Only User creation allowed)'}
              </small>
            </div>
            
            <div className="mb-4">
              <Form.Select
                value={newUser.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="form-input modal-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
              <small className="text-warning">Status</small>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                className="login-button flex-fill" 
                style={{border: 'none'}}
              >
                <i className="bi bi-plus-circle me-2"></i>Create User
              </Button>
              <Button 
                type="button" 
                variant="outline-secondary" 
                className="flex-fill"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Form onSubmit={handleUpdateUser}>
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={editUser.id}
                className="form-input"
                id="editId"
                disabled
              />
              <label htmlFor="editId" className="input-label active">
                ID
              </label>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="text"
                value={editUser.username}
                className="form-input"
                id="editUsername"
                disabled
              />
              <label htmlFor="editUsername" className="input-label active">
                Username
              </label>
            </div>
            
            <div className="mb-3">
              <Form.Select
                value={editUser.role}
                className="form-input modal-select"
                disabled
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </Form.Select>
              <small className="text-warning">Role (Read Only)</small>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="password"
                value={editUser.password}
                onChange={(e) => handleEditInputChange('password', e.target.value)}
                className="form-input"
                id="editPassword"
                placeholder="Enter new password (optional)"
              />
              <label htmlFor="editPassword" className={`input-label ${editUser.password ? 'active' : ''}`}>
                New Password (Optional)
              </label>
              <small className="text-warning">Leave empty to keep current password</small>
            </div>
            
            <div className="mb-4">
              <Form.Select
                value={editUser.status}
                onChange={(e) => handleEditInputChange('status', e.target.value)}
                className="form-input modal-select"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
              <small className="text-warning">Status</small>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                className="login-button flex-fill" 
                style={{border: 'none'}}
              >
                <i className="bi bi-check-circle me-2"></i>Update User
              </Button>
              <Button 
                type="button" 
                variant="outline-secondary" 
                className="flex-fill"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Cash Management Modal */}
      <Modal show={showCashModal} onHide={() => setShowCashModal(false)} centered>
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">Cash Management - {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Form onSubmit={handleCashSubmit}>
            <div className="mb-4">
              <div className="d-flex justify-content-center">
                <div className="btn-group cash-toggle" role="group">
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="transactionType" 
                    id="deposit" 
                    value="deposit"
                    checked={cashTransaction.type === 'deposit'}
                    onChange={(e) => handleCashInputChange('type', e.target.value)}
                  />
                  <label className="btn btn-outline-success" htmlFor="deposit">
                    <i className="bi bi-arrow-down-circle me-2"></i>Deposit
                  </label>
                  
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="transactionType" 
                    id="withdraw" 
                    value="withdraw"
                    checked={cashTransaction.type === 'withdraw'}
                    onChange={(e) => handleCashInputChange('type', e.target.value)}
                  />
                  <label className="btn btn-outline-danger" htmlFor="withdraw">
                    <i className="bi bi-arrow-up-circle me-2"></i>Withdraw
                  </label>
                </div>
              </div>
            </div>
            
            <div className="input-wrapper mb-3">
              <Form.Control
                type="number"
                value={cashTransaction.amount}
                onChange={(e) => handleCashInputChange('amount', e.target.value)}
                className="form-input"
                id="cashAmount"
                required
                min="1"
                step="0.01"
              />
              <label htmlFor="cashAmount" className={`input-label ${cashTransaction.amount ? 'active' : ''}`}>
                Amount (PKR)
              </label>
            </div>
            
            <div className="input-wrapper mb-4">
              <Form.Control
                as="textarea"
                rows={3}
                value={cashTransaction.description}
                onChange={(e) => handleCashInputChange('description', e.target.value)}
                className="form-input"
                id="cashDescription"
                placeholder="Optional description..."
              />
              <label htmlFor="cashDescription" className={`input-label ${cashTransaction.description ? 'active' : ''}`}>
                Description (Optional)
              </label>
            </div>
            
            <div className="d-flex gap-2">
              <Button 
                type="submit" 
                className={`flex-fill ${cashTransaction.type === 'deposit' ? 'btn-success' : 'btn-danger'}`}
                style={{border: 'none'}}
              >
                <i className={`bi ${cashTransaction.type === 'deposit' ? 'bi-plus-circle' : 'bi-dash-circle'} me-2`}></i>
                {cashTransaction.type === 'deposit' ? 'Process Deposit' : 'Process Withdrawal'}
              </Button>
              <Button 
                type="button" 
                variant="outline-secondary" 
                className="flex-fill"
                onClick={() => setShowCashModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Referral Tree Modal */}
      <Modal show={showReferralModal} onHide={() => setShowReferralModal(false)} centered size="lg">
        <Modal.Header closeButton style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Modal.Title className="text-warning">
            <i className="bi bi-diagram-3 me-2"></i>
            Referral Tree - {selectedUser?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)', maxHeight: '500px', overflowY: 'auto'}}>
          {loadingReferrals ? (
            <div className="text-center py-4">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">Loading referral tree...</p>
            </div>
          ) : referralTree.length > 0 ? (
            <div className="referral-tree">
              <div className="tree-header mb-4 p-3" style={{background: 'rgba(255,140,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,140,0,0.3)'}}>
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-circle text-warning me-3" style={{fontSize: '40px'}}></i>
                  <div>
                    <h5 className="text-white mb-1">{selectedUser?.name}</h5>
                    <p className="text-warning mb-0">@{selectedUser?.username} - Total Referrals: {referralTree.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="tree-content">
                {referralTree.map((referral, index) => (
                  <div key={referral._id} className="referral-item mb-3 p-3" style={{background: 'rgba(23, 162, 184, 0.1)', borderRadius: '8px', border: '1px solid rgba(23, 162, 184, 0.3)', marginLeft: '20px'}}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-arrow-return-right text-info me-2"></i>
                          <h6 className="text-white mb-0">{referral.name}</h6>
                          <Badge bg="info" className="ms-2">Level 1</Badge>
                        </div>
                        <div className="referral-details">
                          <div className="text-white small mb-1">
                            <i className="bi bi-at me-1"></i>{referral.username}
                          </div>
                          <div className="text-white small mb-1">
                            <i className="bi bi-envelope me-1"></i>{referral.email}
                          </div>
                          <div className="text-white small">
                            <i className="bi bi-calendar me-1"></i>Joined: {new Date(referral.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-end">
                        <Button 
                          size="sm" 
                          variant="outline-info"
                          onClick={() => handleViewReferrals({_id: referral._id, name: referral.name, username: referral.username})}
                          title="View their referrals"
                        >
                          <i className="bi bi-diagram-3"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-diagram-3 text-warning mb-3" style={{fontSize: '60px'}}></i>
              <h5 className="text-white mb-2">No Referrals Found</h5>
              <p className="text-white">This user hasn't referred anyone yet.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{background: 'rgba(30, 30, 30, 0.95)', border: '1px solid rgba(255, 140, 0, 0.3)'}}>
          <Button variant="outline-warning" onClick={() => setShowReferralModal(false)}>
            <i className="bi bi-x-circle me-1"></i>Close
          </Button>
        </Modal.Footer>
      </Modal>
      
      <ToastContainer />
    </div>
  );
};

export default UsersPage;