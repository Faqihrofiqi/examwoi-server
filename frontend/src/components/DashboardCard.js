// src/components/DashboardCard.js
import React from 'react';
import './DashboardCard.css'; // Pastikan untuk mengimpor CSS yang sesuai

// Tambahkan onClick dan style sebagai prop
const DashboardCard = ({ title, content, type, footer, span, isSimpleCard = false, onClick, style }) => {
  return (
    // Teruskan onClick dan style ke div utama
    <div
      className={`dashboard-card dashboard-card--${type || 'default'} ${span || ''}`}
      onClick={onClick}
      style={style} // Teruskan style yang diterima dari prop
    >
      {!isSimpleCard && title && <div className="card-header">{title}</div>}

      <div className="card-content">
        {isSimpleCard ? title : content}
      </div>

      {!isSimpleCard && footer && <div className="card-footer">{footer}</div>}
    </div>
  );
};

export default DashboardCard;