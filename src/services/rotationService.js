let index = 0;

export default function getSender() {
  const senders = (process.env.SENDERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (senders.length === 0) {
    throw new Error("No SENDERS configured in .env");
  }

  const sender = senders[index % senders.length];
  index++;
  return sender;
}
