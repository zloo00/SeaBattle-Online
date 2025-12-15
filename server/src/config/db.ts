import mongoose, { ConnectOptions } from "mongoose";
import { env } from "./env";

export const connectToDatabase = async () => {
  const options: ConnectOptions = {};

  if (env.mongoUsername && env.mongoPassword) {
    options.auth = {
      username: env.mongoUsername,
      password: env.mongoPassword
    };
    options.authSource = env.mongoAuthSource;
  }

  await mongoose.connect(env.mongoUri, options);
};
