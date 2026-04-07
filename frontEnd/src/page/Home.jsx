import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/home.css";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="db-header">
        <h1>Imagine Entertainment Dashboard</h1>
        <button className="btn-create" onClick={() => navigate("/create")}>
          + New Quotation
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card blue">
          <h3>Total Quotations</h3>
          <p className="value">24</p>
        </div>
        <div className="stat-card green">
          <h3>Confirmed Invoices</h3>
          <p className="value">12</p>
        </div>
        <div className="stat-card orange">
          <h3>Pending Approvals</h3>
          <p className="value">05</p>
        </div>
        <div className="stat-card red">
          <h3>Total Revenue (Monthly)</h3>
          <p className="value">Rs. 1.2M</p>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Quotations</h3>
        <table className="db-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>T-102</td>
              <td>Dialog Axiata</td>
              <td>2026-03-10</td>
              <td>
                <span className="badge-sent">Sent</span>
              </td>
              <td>
                <button className="btn-view" onClick={() => navigate("/list")}>
                  View
                </button>
              </td>
            </tr>
            {/* තවත් පේළි මෙහි එකතු වේ */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Home;
