import { Button } from 'react-bootstrap';
import { useState } from 'react';

const RefreshButton = ({ onRefresh, className }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        window.location.reload();
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <Button
      variant="outline-warning"
      size="sm"
      onClick={handleRefresh}
      disabled={refreshing}
      className={className ? `refresh-btn ${className}` : 'refresh-btn'}
      title="Refresh Page"
    >
      <i className={refreshing ? 'bi bi-arrow-clockwise spin' : 'bi bi-arrow-clockwise'}></i>
      <span className="d-none d-sm-inline ms-1">Refresh</span>
    </Button>
  );
};

export default RefreshButton;