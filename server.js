import "dotenv/config";
import app from "./src/app.js";
import { validateEnv } from "./src/config/env.js";

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "127.0.0.1";

validateEnv();

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
