import fs from "fs";
import csv from "csv-parser";
import { emailQueue } from "../queue/queue.js";

export default async function uploadController(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "CSV file required (field: file)" });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("error", (err) => {
      console.error("CSV parse error:", err);
      res.status(500).json({ error: "Failed to parse CSV" });
    })
    .on("end", async () => {
      try {
        for (const row of results) {
          await emailQueue.add("send-email", row, {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: true,
            removeOnFail: 100,
          });
        }
        res.json({ message: "Emails queued successfully", count: results.length });
      } catch (err) {
        console.error("Queue error:", err);
        res.status(500).json({ error: "Failed to queue emails" });
      } finally {
        fs.unlink(req.file.path, () => {});
      }
    });
}
