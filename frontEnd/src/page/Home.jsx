import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Plus,
  Eye,
  Trash2,
  Search,
  Bell,
  User,
} from "lucide-react"; // ලස්සන Icons සඳහා
import "../css/home.css";

const Home = () => {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await axios.get("https://imagine-entertainment-invoice-system.onrender.com/api/quotations");
        setQuotations(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this quotation?")) {
      try {
        await axios.delete(`https://imagine-entertainment-invoice-system.onrender.com/api/quotations/${id}`);
        setQuotations(quotations.filter((q) => q._id !== id));
      } catch (err) {
        alert("Error deleting quotation");
      }
    }
  };

  // Filter logic for Stats
  const totalCount = quotations.length;
  const vatCount = quotations.filter((q) =>
    q.quotationCategory?.includes("Vat"),
  ).length;
  const normalCount = quotations.filter((q) =>
    q.quotationCategory?.includes("Normal"),
  ).length;
  const totalRevenue = quotations.reduce(
    (acc, curr) => acc + (curr.grandTotal || 0),
    0,
  );

  // Search logic
  const filteredQuotations = quotations.filter(
    (q) =>
      q.ClientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="dashboard-wrapper">
      {/* Top Header */}
      <header className="top-navbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Client or QT No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="header-actions">
          <Bell size={20} className="icon-btn" />
          <div className="user-profile">
            <User size={20} />
            <span>Admin</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="welcome-section">
          <div>
            <h1>Dashboard Overview</h1>
            <p>Imagine Entertainment Management System</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/create")}>
            <Plus size={18} /> Create New Quotation
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <FileText />
            </div>
            <div className="stat-info">
              <span className="label">Total Quotations</span>
              <h2 className="value">
                {totalCount.toString().padStart(2, "0")}
              </h2>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <CheckCircle />
            </div>
            <div className="stat-info">
              <span className="label">VAT Quotations</span>
              <h2 className="value">{vatCount.toString().padStart(2, "0")}</h2>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">
              <AlertCircle />
            </div>
            <div className="stat-info">
              <span className="label">Normal Quotations</span>
              <h2 className="value">
                {normalCount.toString().padStart(2, "0")}
              </h2>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">
              <TrendingUp />
            </div>
            <div className="stat-info">
              <span className="label">Total Revenue</span>
              <h2 className="value">Rs. {(totalRevenue / 1000).toFixed(1)}K</h2>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          <div className="table-header">
            <h2>Recent Activity</h2>
            <span>Showing {filteredQuotations.length} records</span>
          </div>
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>QT NO</th>
                  <th>CLIENT NAME</th>
                  <th>CATEGORY</th>
                  <th>GRAND TOTAL</th>
                  <th style={{ textAlign: "center" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      Loading data...
                    </td>
                  </tr>
                ) : filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => (
                    <tr key={q._id}>
                      <td className="date-col">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="qt-badge">{q.invoiceNo}</span>
                      </td>
                      <td className="client-name">{q.ClientName || "N/A"}</td>
                      <td>
                        <span
                          className={`status-pill ${q.quotationCategory?.toLowerCase().includes("vat") ? "vat" : "normal"}`}
                        >
                          {q.quotationCategory}
                        </span>
                      </td>
                      <td className="amount-col">
                        Rs.{" "}
                        {q.grandTotal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="action-btns">
                        <button
                          className="view-btn"
                          title="View"
                          onClick={() => navigate(`/view/${q._id}`)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="delete-btn"
                          title="Delete"
                          onClick={() => handleDelete(q._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
