import fs from "fs";
import csv from "csv-parser";
import sendEmail from "../services/emailService.js";
import Suppression from "../models/Suppression.js";
import Email from "../models/Email.js";
import personalize from "../services/templateService.js";
import getSender from "../services/rotationService.js";

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
      let sent = 0;
      let skipped = 0;
      let failed = 0;

      for (const row of results) {
        const { email, name, company } = row;

        const blocked = await Suppression.findOne({ email });
        if (blocked) {
          console.log(`⛔ Skipping suppressed: ${email}`);
          skipped++;
          continue;
        }

        const message = personalize(name, company);
        const sender = getSender();

        try {
          await sendEmail(email, sender, message);
          await Email.create({ email, name, status: "sent", sentAt: new Date() });
          console.log(`✉️  Sent to ${email} via ${sender}`);
          sent++;
        } catch (err) {
          await Email.create({ email, name, status: "failed" });
          console.error(`❌ Failed ${email}:`, err.message);
          failed++;
        }
      }

      fs.unlink(req.file.path, () => {});
      res.json({ message: "Emails processed", sent, skipped, failed });
    });
}
