import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  registerUser,
  verifyOTP,
  approveUser,
} from "../controllers/userController.js";
import { sendEmail } from "../config/mailer.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.get("/approve/:token", approveUser);

const JWT_SECRET = "ImagineEnt_Secret_Key_2026"; // මෙය ඔබේ .env එකේ ඇති අගයට සමාන විය යුතුයි

// --- MIDDLEWARE SECTION ---

// Token එක පරීක්ෂා කිරීම
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied." });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Role එක පරීක්ෂා කිරීම
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied. Role not allowed." });
    }
    next();
  };
};

// [LOGIN]
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid Email or Password" });
    }
    if (!user.isVerified)
      return res.status(401).json({ message: "Verify OTP first." });
    if (!user.isAdminApproved)
      return res.status(401).json({ message: "Wait for Admin approval." });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [FORGOT PASSWORD]
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = Date.now() + 600000; // විනාඩි 10 කින් අහෝසි වේ
    await user.save();

    // ලස්සන HTML Email එක මෙතැන සිට...
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <div style="background-color: #1e3a8a; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Imagine Entertainment</h1>
          <p style="color: #bfdbfe; margin-top: 5px; font-size: 14px;">Secure Password Reset</p>
        </div>
        <div style="padding: 40px; background-color: #ffffff; text-align: center;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Password Reset Request</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Hi <strong>${user.name}</strong>, <br>
            We received a request to reset your password. Use the code below to complete the process.
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
            <p style="color: #64748b; font-size: 13px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
            <h1 style="color: #2563eb; font-size: 42px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
          </div>
          <p style="color: #ef4444; font-size: 14px; font-weight: 500;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 30px;">
            If you did not request this, please ignore this email or contact support if you have concerns.
          </p>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">&copy; 2026 Imagine Entertainment Team. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail(
      email,
      "Your Password Reset OTP - Imagine Entertainment",
      htmlContent,
    );

    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [VERIFY FORGOT OTP]
router.post("/verify-otpForgot", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (
      !user ||
      user.resetOTP?.toString() !== otp?.toString() ||
      user.resetOTPExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }

    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();
    res.status(200).json({ message: "OTP Verified Successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [RESET PASSWORD]
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [ADMIN ONLY ROUTES]
router.get(
  "/all-users",
  verifyToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      const users = await User.find({}, "-password");
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete(
  "/delete-user/:id",
  verifyToken,
  authorizeRoles("Admin"),
  async (req, res) => {
    try {
      if (req.user.id === req.params.id)
        return res.status(400).json({ message: "Cannot delete yourself!" });
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

export default router;
