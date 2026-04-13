import express from "express";
import Suppression from "../models/Suppression.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const events = req.body;

  for (const event of events) {
    if (event.event === "bounce" || event.event === "spam") {
      await Suppression.create({
        email: event.email,
        reason: event.event
      });
    }
  }

  res.sendStatus(200);
});

export default router;