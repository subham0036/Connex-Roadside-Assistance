const mongoose = require("mongoose");

function stripEnvQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function buildUriFromParts() {
  const user = stripEnvQuotes(process.env.MONGO_USER || "");
  const password = stripEnvQuotes(process.env.MONGO_PASSWORD || "");
  if (!user || !password) return "";

  const host = stripEnvQuotes(
    process.env.MONGO_HOST || "cluster0.hfpod8x.mongodb.net"
  ).replace(/^mongodb(\+srv)?:\/\//, "");
  const db = stripEnvQuotes(process.env.MONGO_DB || "connex");

  return `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${db}?retryWrites=true&w=majority`;
}

/**
 * If the password contains "@", Atlas strings like
 * mongodb+srv://user:pass@123@cluster0... must encode "@" as %40.
 * Without encoding, the host is parsed as "123" → querySrv ENOTFOUND _mongodb._tcp.123
 */
function normalizeMongoUri(uri) {
  const trimmed = stripEnvQuotes(uri);
  const match = trimmed.match(/^(mongodb(\+srv)?:\/\/)(.+)$/i);
  if (!match) return trimmed;

  const protocol = match[1];
  const rest = match[3];
  const atCount = (rest.match(/@/g) || []).length;
  if (atCount <= 1) {
    // Ensure database name exists (Atlas template often ends with /?appName=...)
    if (/^mongodb(\+srv)?:\/\/[^/]+\/?(\?|$)/i.test(trimmed)) {
      const db = stripEnvQuotes(process.env.MONGO_DB || "connex");
      return trimmed.replace(/\/?(\?|$)/, `/${db}$1`);
    }
    return trimmed;
  }

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
  const fromParts = buildUriFromParts();
  if (fromParts) return fromParts;

  const envKeys = ["MONGO_URI", "MONGODB_URI", "MONGO_URL", "DATABASE_URL"];
  let raw = "";

  for (const key of envKeys) {
    if (process.env[key]) {
      raw = stripEnvQuotes(process.env[key]);
      break;
    }
  }

  if (!raw) {
    const isProduction =
      process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

    if (isProduction) {
      throw new Error(
        "MongoDB not configured. On Render set MONGO_URI, or MONGO_USER + MONGO_PASSWORD (+ optional MONGO_HOST, MONGO_DB)."
      );
    }

    return "mongodb://127.0.0.1:27017/connex";
  }

  if (/<db_password>|<password>/i.test(raw)) {
    throw new Error(
      "MONGO_URI still contains <db_password>. Replace it with your real Atlas password in Render → Environment."
    );
  }

  return normalizeMongoUri(raw);
}

function logSafeTarget(uri) {
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "https://"));
    const db = parsed.pathname.replace(/^\//, "").split("/")[0] || "(default)";
    const user = parsed.username || "(none)";
    console.log(`MongoDB target: user=${user} host=${parsed.hostname} db=${db}`);
  } catch {
    console.log("MongoDB target: (could not parse URI — check MONGO_URI format)");
  }
}

const connectDB = async () => {
  const uri = resolveMongoUri();
  logSafeTarget(uri);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      authSource: "admin",
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);

    if (err.message.includes("_mongodb._tcp.123")) {
      console.error(
        "Fix: password contains '@'. In Render MONGO_URI use %40 instead of @ in the password."
      );
    }

    if (/bad auth|authentication failed/i.test(err.message)) {
      console.error(
        "Fix: use separate Render vars MONGO_USER + MONGO_PASSWORD (recommended), or reset Atlas password and update MONGO_URI."
      );
    }

    if (process.env.RENDER && !process.env.MONGO_URI && !process.env.MONGO_PASSWORD) {
      console.error(
        "Render: set MONGO_USER and MONGO_PASSWORD in Environment (easiest), or set MONGO_URI."
      );
    }

    process.exit(1);
  }
};

module.exports = connectDB;
