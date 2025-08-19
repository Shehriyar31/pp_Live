import logo from '../assets/logo.png';
import './Common.css';
import './Preloader.css';

const Preloader = () => {
  return (
    <div className="preloader">
      <div className="preloader-content">
        <div className="logo-spinner">
          <img src={logo} alt="Logo" className="preloader-logo" />
        </div>
        <div className="loading-text">Loading...</div>
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;