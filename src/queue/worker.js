import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { connectDB } from "../config/db.js";

import sendEmail from "../services/emailService.js";
import Email from "../models/Email.js";
import Suppression from "../models/Suppression.js";
import personalize from "../services/templateService.js";
import getSender from "../services/rotationService.js";

connectDB();

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { email, name, company } = job.data;

    const blocked = await Suppression.findOne({ email });
    if (blocked) {
      console.log(`⛔ Skipping suppressed address: ${email}`);
      return;
    }

    const message = personalize(name, company);
    const sender = getSender();

    try {
      await sendEmail(email, sender, message);
      await Email.create({ email, name, status: "sent", sentAt: new Date() });
      console.log(`✉️  Sent to ${email} via ${sender}`);
    } catch (err) {
      await Email.create({ email, name, status: "failed" });
      console.error(`❌ Failed to ${email}:`, err.message);
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("🚀 Worker running...");
