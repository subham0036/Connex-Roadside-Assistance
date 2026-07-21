const mongoose = require("mongoose");

function resolveMongoUri() {
  const uri = (
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    ""
  ).trim();

  if (uri) return uri;

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
    if (process.env.RENDER && !process.env.MONGO_URI) {
      console.error(
        "Render: set MONGO_URI in your service Environment tab (Atlas connection string)."
      );
    }
    process.exit(1);
  }
};

module.exports = connectDB;
