import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/ForceRefresh.css';

const SuccessPage = () => {
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
                <div className="success-icon">
                  <i className="bi bi-check-circle-fill" style={{fontSize: '60px', color: '#28a745'}}></i>
                </div>
                <h2>Verification Submitted Successfully!</h2>
                <div className="success-message">
                  <p><strong>Please wait for approval</strong></p>
                  <p>Your payment verification has been submitted and is under review.</p>
                  <p>You will be notified once your account is approved.</p>
                  <p>Thank you for joining ProfitPro!</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link to="/login">
                  <Button className="login-button" style={{border: 'none'}}>
                    Back to Login
                  </Button>
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SuccessPage;