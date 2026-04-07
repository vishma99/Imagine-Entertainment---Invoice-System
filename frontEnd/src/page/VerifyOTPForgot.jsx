import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../css/register.css";

const VerifyOTPForgot = () => {
  const [otp, setOtp] = useState(new Array(6).fill("")); // ඉලක්කම් 6 සඳහා array එකක්
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef([]); // කොටු 6 focus කිරීම සඳහා refs

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  // එක් එක් කොටුවක අගය වෙනස් වන විට
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false; // අංක පමණක් ඇතුළත් කිරීමට

    let newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // අංකයක් ටයිප් කළ පසු ඊළඟ කොටුවට මාරු වීම
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Backspace එබූ විට කලින් කොටුවට යාම
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const finalOtp = otp.join(""); // Array එක string එකක් බවට පත් කිරීම

    if (finalOtp.length < 6) {
      setErrorMessage("Please enter all 6 digits.");
      return;
    }

    try {
      const response = await fetch(
        "https://imagine-entertaintment.onrender.com/api/user/verify-otpForgot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: finalOtp }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("resetEmail", email);
        alert("Account Verified Successfully!");
        navigate("/reset-password", { state: { email } });
      } else {
        setErrorMessage(data.message || "Invalid OTP");
      }
    } catch (error) {
      setErrorMessage("Connection error. Please try again.");
    }
  };

  return (
    <div className="auth-container1">
      <div className="auth-card1">
        <h2 className="auth-title1">Verify OTP</h2>
        <p className="auth-subtitle1">
          Sent to: <b>{email}</b>
        </p>

        {errorMessage && (
          <p style={{ color: "red", textAlign: "center", fontSize: "14px" }}>
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleVerify}>
          <div
            className="otp-input-container"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                className="otp-box"
                value={data}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  width: "45px",
                  height: "50px",
                  fontSize: "24px",
                  textAlign: "center",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  backgroundColor: "#f9f9f9",
                }}
                required
              />
            ))}
          </div>

          <button type="submit" className="auth-btn1">
            Verify & Activate
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPForgot;
