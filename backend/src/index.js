import "dotenv/config";
import "./db.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 4000);
const { app } = createApp();
app.listen(PORT, () => {
  console.log(`dashboard-ai backend listening on http://localhost:${PORT}`);
});
