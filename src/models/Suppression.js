import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: String,
  reason: String
});

export default mongoose.model("Suppression", schema);