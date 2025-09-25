const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./models/db");

const app = express();
const PORT = process.env.PORT || 5000
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
// Import Routers
const legalDocumentsRouter = require("./routes/legal_documents");
const userRouter = require("./routes/users");
const courtsRoutes = require("./routes/courts");

// Routes Middleware
app.use("/legal_documents", legalDocumentsRouter);
app.use("/users", userRouter);
app.use("/courts", courtsRoutes);

// Handles any other endpoints [unassigned - endpoints]
app.use("*", (req, res) => res.status(404).json("NO content at this path"));

/*app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});*/

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

