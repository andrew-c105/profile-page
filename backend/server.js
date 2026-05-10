const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Routes modules
const noteRoutes = require("./routes/noteRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors()); // Allows frontend to talk to us
app.use(express.json()); // Parse JSON request bodies

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/notes", noteRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
