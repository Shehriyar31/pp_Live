import { useGlobalState } from '../context/GlobalContext';
import './AnnouncementTicker.css';

const AnnouncementTicker = () => {
  const { announcements } = useGlobalState();

  const tickerText = announcements.length > 0 
    ? announcements.map(a => `${a.title}: ${a.message}`).join(' • ')
    : 'Welcome to ProfitPro! • Real-time updates available • Start earning today!';

  return (
    <div className="announcement-ticker">
      <div className="ticker-content">
        <span className="ticker-icon">📢</span>
        <span className="ticker-item">{tickerText}</span>
      </div>
    </div>
  );
};

export default AnnouncementTicker;