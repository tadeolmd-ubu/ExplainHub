import "dotenv/config";
import app from "./src/app.js";
import { validateEnv } from "./src/config/env.js";

const PORT = process.env.PORT || 3000;

validateEnv();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
