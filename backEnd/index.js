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

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/quotations", quotationRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
