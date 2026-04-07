import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/register.css";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email =
    location.state?.email || localStorage.getItem("resetEmail") || "";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch(
        "https://imagine-entertaintment.onrender.com/api/user/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, newPassword: formData.newPassword }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.removeItem("resetEmail");
        alert(
          "Password updated successfully! Please login with your new password.",
        );
        navigate("/login");
      } else {
        setError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setError("Server connection failed.");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1">
        <h2 className="auth-title1">Create New Password</h2>
        <p className="auth-subtitle1">Resetting password for: {email}</p>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-group1">
            <label>New Password</label>
            <input
              type="password"
              name="newPassword"
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group1">
            <label>Confirm New Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth-btn1">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
