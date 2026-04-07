import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
    role: "Admin",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("please enter a valid email address.");
      return;
    }
    if (formData.confirmPassword !== formData.password) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    try {
      const { confirmPassword, ...dataToSend } = formData;
      const response = await fetch("http://localhost:5000/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        alert("OTP sent to your email!");
        navigate("/verify-otp", { state: { email: formData.email } });
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      alert("Connection Error");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1">
        <h2 className="auth-title1">Create Account</h2>
        <p className="auth-subtitle1">
          Join Imagine Entertainment Quotation Team
        </p>
        {errorMessage && (
          <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group1">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              onChange={handleChange}
              value={formData.name}
              required
            />
          </div>

          <div className="input-group1">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="email@imagine.com"
              onChange={handleChange}
              value={formData.email}
              required
            />
          </div>
          <div className="input-group1">
            <label>User Name</label>
            <input
              type="text"
              name="username"
              placeholder="Enter your user name"
              onChange={handleChange}
              value={formData.username}
              required
            />
          </div>

          <div className="input-group1">
            <label>User Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="auth-select1"
            >
              <option value="Admin">Admin</option>

              <option value="Marketing">Marketing</option>
              <option value="financial">financial</option>
            </select>
          </div>

          <div className="input-group1">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.password}
              required
            />
          </div>
          <div className="input-group1">
            <label>Confrom Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.confirmPassword}
              required
            />
          </div>

          <button type="submit" className="auth-btn1">
            Register Now
          </button>
        </form>
        <p className="auth-footer1">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
