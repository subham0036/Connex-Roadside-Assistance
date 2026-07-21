const mongoose = require("mongoose");

/**
 * If the password contains "@", Atlas strings like
 * mongodb+srv://user:pass@123@cluster0... must encode "@" as %40.
 * Without encoding, the host is parsed as "123" → querySrv ENOTFOUND _mongodb._tcp.123
 */
function normalizeMongoUri(uri) {
  const trimmed = uri.trim();
  const match = trimmed.match(/^(mongodb(\+srv)?:\/\/)(.+)$/i);
  if (!match) return trimmed;

  const protocol = match[1];
  const rest = match[3];
  const atCount = (rest.match(/@/g) || []).length;
  if (atCount <= 1) return trimmed;

  const lastAt = rest.lastIndexOf("@");
  const credentials = rest.slice(0, lastAt);
  const hostPart = rest.slice(lastAt + 1);
  const colonIdx = credentials.indexOf(":");
  if (colonIdx === -1) return trimmed;

  const user = credentials.slice(0, colonIdx);
  const password = credentials.slice(colonIdx + 1);
  const encodedPassword = encodeURIComponent(decodeURIComponent(password));

  return `${protocol}${user}:${encodedPassword}@${hostPart}`;
}

function resolveMongoUri() {
  const raw = (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();

  if (raw) return normalizeMongoUri(raw);

  const isProduction =
    process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

  if (isProduction) {
    throw new Error(
      "MONGO_URI is not set. Add it in Render → Environment (mongodb+srv://... from MongoDB Atlas)."
    );
  }

  return "mongodb://127.0.0.1:27017/connex";
}

const connectDB = async () => {
  const uri = resolveMongoUri();

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    if (err.message.includes("_mongodb._tcp.123")) {
      console.error(
        "Fix: your password contains '@'. In Render MONGO_URI use %40 instead, e.g. Mongodb242143%40123"
      );
    }
    if (process.env.RENDER && !process.env.MONGO_URI) {
      console.error(
        "Render: set MONGO_URI in your service Environment tab (Atlas connection string)."
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
