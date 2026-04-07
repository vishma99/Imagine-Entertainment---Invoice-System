import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    // සාමාන්‍ය මිල (Unit Price)
    price: {
      type: Number,
      required: true,
    },
    // LED සඳහා වර්ග අඩියක මිල (Square Feet Price)
    // මෙය අත්‍යවශ්‍ය (required) නැති ලෙස තබා ඇත, මන්ද අනෙක් categories වලට මෙය අවශ්‍ය නොවන බැවිනි.
    sqPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
    }, // (උදා: ledSystems, soundSystems, lightSystems)
    subcategory: {
      type: String,
      enum: ["Normal", "Goalpost", "Marquee", "Main Stage", "Platform", "None"],
      default: "None",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Item", itemSchema);
