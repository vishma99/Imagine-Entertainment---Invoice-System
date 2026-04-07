import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/register.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/user/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("6-digit OTP sent to your email!");

        navigate("/verify-otp-forgot", { state: { email } });
      } else {
        alert(data.message || "Something went wrong!");
      }
    } catch (err) {
      alert("Server connection failed.");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1">
        <h2 className="auth-title1">Reset Password</h2>
        <p className="auth-subtitle1">
          Enter your email to receive a reset link
        </p>

        <form onSubmit={handleResetRequest}>
          <div className="input-group1">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="email@imagine.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn1">
            Send Reset Link
          </button>
        </form>

        <p className="auth-footer1">
          Remember your password?{" "}
          <span onClick={() => navigate("/login")}>Back to Login</span>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
