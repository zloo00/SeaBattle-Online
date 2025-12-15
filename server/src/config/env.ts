import dotenv from "dotenv";

dotenv.config();

const fallback = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
};

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: fallback(process.env.MONGODB_URI, "MONGODB_URI"),
  jwtSecret: fallback(process.env.JWT_SECRET, "JWT_SECRET")
};
