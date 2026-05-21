import express from "express";
import analyzerRoutes from "./routes/analyzer.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", analyzerRoutes);

app.use(errorHandler);

export default app;
