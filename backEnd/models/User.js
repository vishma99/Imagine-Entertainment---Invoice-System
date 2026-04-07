import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },

    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "financial", "Marketing"],
      default: "Section User",
    },
    isVerified: { type: Boolean, default: false },
    isAdminApproved: { type: Boolean, default: false },
    verificationToken: String,
    resetOTP: { type: String },
    resetOTPExpires: { type: Date },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
