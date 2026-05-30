import React from "react";
import LiveMap from "../../components/common/LiveMap";
import "../../style/RescueTheme.css";

export default function MechanicDashboard() {
  return (
    <div className="page-container">
      <h2 className="page-title">Mechanic Dashboard</h2>

      <div className="dashboard-grid">

        <div className="glass-card">
          <h3>Assigned Jobs</h3>
          <p>No jobs assigned yet.</p>
          <button className="rescue-btn">Refresh</button>
        </div>

        <div className="glass-card">
          <h3>Garage Live Location</h3>
          <div className="map-wrapper">
            <LiveMap lat={28.6139} lng={77.2090} label="Garage Location" />
          </div>
        </div>
      </div>
    </div>
  );
}