import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import quotationRoutes from "./routes/quotationRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import userRouter from "./routes/userRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 2. Debugging: MONGO_URI එක පරීක්ෂා කිරීම (ප්‍රශ්නය විසඳුනාම මෙය අයින් කරන්න)
console.log("Connecting to:", MONGO_URI);

// 3. Mongoose Connection එක වඩාත් හොඳින් සැකසීම
if (!MONGO_URI) {
  console.error("❌ Error: MONGO_URI is not defined in .env file");
  process.exit(1); 
}

mongoose
  .connect(MONGO_URI, {
    // Timeout එකක් දාමු තත්පර 10ක් බලන් ඉන්නේ නැතුව ඉක්මනින් Error එක දැනගන්න
    serverSelectionTimeoutMS: 5000, 
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

app.use("/api/quotations", quotationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
