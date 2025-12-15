import mongoose from "mongoose";
import { env } from "./env";

export const connectToDatabase = async () => {
  await mongoose.connect(env.mongoUri);
};
