import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: String,
  name: String,
  status: String,
  sentAt: Date
});

export default mongoose.model("Email", schema);