import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./api/routes.js";
import webhook from "./webhook/sendgridWebhook.js";
import { connectDB } from "./config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

connectDB();

app.use("/api", routes);
app.use("/webhook", webhook);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
