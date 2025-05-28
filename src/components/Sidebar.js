
// src/components/Sidebar.js
import React from 'react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>CREATIVE TIM</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className="active">
            <a href="#dashboard">
              <i className="material-icons">dashboard</i> {/* Placeholder untuk ikon */}
              Dashboard
            </a>
          </li>
          <li>
            <a href="#user-profile">
              <i className="material-icons">person</i>
              User Profile
            </a>
          </li>
          <li>
            <a href="#table-list">
              <i className="material-icons">list_alt</i>
              Table List
            </a>
          </li>
          <li>
            <a href="#typography">
              <i className="material-icons">text_fields</i>
              Typography
            </a>
          </li>
          <li>
            <a href="#icons">
              <i className="material-icons">star_border</i>
              Icons
            </a>
          </li>
          <li>
            <a href="#maps">
              <i className="material-icons">map</i>
              Maps
            </a>
          </li>
          <li>
            <a href="#notifications">
              <i className="material-icons">notifications_none</i>
              Notifications
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;