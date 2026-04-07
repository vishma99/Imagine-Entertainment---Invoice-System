import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../config/mailer.js";

// [REGISTER]
export const registerUser = async (req, res) => {
  try {
    const { name, email, username, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
      role,
      verificationToken: otp,
      isVerified: false,
      isAdminApproved: false, // සැමවිටම false වේ
    });
    await newUser.save();
    try {
      const htmlContent = `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; text-align: center; border-radius: 10px;">
      <h2 style="color: #1e3a8a;">Welcome to Imagine Entertainment</h2>
      <p>Hi ${name}, please use the following OTP to verify your email address:</p>
      <h1 style="color: #1a73e8; font-size: 36px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; display: inline-block;">${otp}</h1>
      <p>This code is valid for 10 minutes. Do not share this with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">&copy; 2026 Imagine Entertainment. All rights reserved.</p>
    </div>
  `;
      await sendEmail(
        email,
        "Verification OTP - Imagine Entertainment",
        htmlContent,
      );
    } catch (error) {
      console.error("API Email Error:", error.message);
    }

    res.status(201).json({ message: "Registration successful. OTP sent!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [VERIFY OTP]
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, verificationToken: otp });
    if (!user) return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;

    // මීට පෙර Admin කෙනෙකුට ස්වයංක්‍රීයව ලැබුණු අවසරය මෙහිදී ඉවත් කර ඇත.
    // දැන් ඕනෑම Role එකක කෙනෙකුට Approve Token එකක් සෑදේ.
    const approveToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = approveToken;
    await user.save();

    // පද්ධතියේ දැනට සිටින Verified සහ Approved Admin ලා සොයා ගැනීම
    const admins = await User.find({ role: "Admin", isAdminApproved: true });

    if (admins.length > 0) {
      const approveLink = `http://localhost:5000/api/user/approve/${approveToken}`;
      const adminHtml = `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
      <h2 style="color: #e67e22;">New User Approval Required</h2>
      <p>A new user has verified their email and is waiting for your approval.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><b>Name:</b> ${user.name}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><b>Email:</b> ${user.email}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><b>Role:</b> ${user.role}</td></tr>
      </table>
      <div style="text-align: center; margin-top: 25px;">
        <a href="${approveLink}" style="background-color: #1a73e8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Approve This User</a>
      </div>
    </div>
  `;

      admins.forEach((admin) => {
        sendEmail(admin.email, "Action Required: New User Approval", adminHtml);
      });
    }
    res
      .status(200)
      .json({ message: "Email verified! Waiting for Admin approval." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// [APPROVE USER]
export const approveUser = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).send("<h1>Invalid Link</h1>");
    user.isAdminApproved = true;
    user.verificationToken = undefined;
    await user.save();
    res.send(`<h1>User ${user.name} Approved Successfully!</h1>`);
  } catch (error) {
    res.status(500).send("Error");
  }
};
