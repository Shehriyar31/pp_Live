import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import '../components/Common.css';
import '../components/ErrorPage.css';

const ErrorPage = () => {
  return (
    <div className="login-wrapper">
      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={6} sm={8}>
            <div className="login-box">
              <div className="login-header">
                <div className="logo-container">
                  <img src={logo} alt="Logo" className="logo" />
                </div>
                <h2>404 - Page Not Found</h2>
                <p>The page you're looking for doesn't exist</p>
              </div>
              
              <div className="error-actions">
                <Link to="/login">
                  <Button className="login-button mb-3">
                    Go to Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="login-button">
                    Go to Sign Up
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

export default ErrorPage;