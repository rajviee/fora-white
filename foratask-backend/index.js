import express, { json } from "express";
const app = express();
const PORT = 3000;

// Middleware
app.use(json());

// Routes
app.get("/", (req, res) => {
  res.send("Hello, FORATASK");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
