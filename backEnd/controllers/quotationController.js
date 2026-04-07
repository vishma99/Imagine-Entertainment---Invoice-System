import Quotation from "../models/Quotation.js";

// 1. අලුත් Quotation එකක් සෑදීම
export const createQuotation = async (req, res) => {
  try {
    console.log("Data Received:", req.body); // මේකෙන් දත්ත එනවද කියලා බලන්න පුළුවන්
    const newQuotation = new Quotation(req.body);
    const savedQuotation = await newQuotation.save();
    res.status(201).json(savedQuotation);
  } catch (error) {
    console.error("Mongoose Save Error:", error); // මොකක්ද වැරැද්ද කියලා CMD එකේ පෙන්වයි
    res
      .status(500)
      .json({ message: "Error saving quotation", error: error.message });
  }
};

// 2. සියලුම Quotations ලබා ගැනීම (දත්ත දර්ශනය වීමට මෙය අවශ්‍යයි)
export const getQuotations = async (req, res) => {
  try {
    const allQuotations = await Quotation.find().sort({ createdAt: -1 });
    res.status(200).json(allQuotations); // මෙලෙස දත්ත Array එකක් ලෙස යවන්න
  } catch (error) {
    res.status(500).json({ message: "Error fetching data", error });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const updated = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body, // මෙලෙස මුළු body එකම යැවිය යුතුය
      { new: true },
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};
