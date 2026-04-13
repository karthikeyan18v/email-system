import axios from "axios";

export default async function sendEmail(to, from, message) {
  const apiKey = process.env.BREVO_API_KEY || process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY / SENDGRID_API_KEY in .env");
  }

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: from, name: "Karthikeyan" },
      to: [{ email: to }],
      subject: "Quick question",
      htmlContent: message,
    },
    {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
    }
  );
}
