import express from "express";
import analyzerRoutes from "./routes/analyzer.routes.js";

const app = express();

app.use(express.json());

// Healt
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", analyzerRoutes);
export default app;
