import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../style/Layout.css";

export default function DashboardLayout({ children }) {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="layout-main">
        <Sidebar />
        <div className="layout-content">
          {children}
        </div>
      </div>
    </div>
  );
}