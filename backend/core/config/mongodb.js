import mongoose from "mongoose";
import config from "./index.js";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("DB Connected 🦾🤷‍♂️");
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. Retrying...");
  });
  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err?.message || err);
  });

  // Build a safe Mongo URI:
  // - If MONGODB_URI already includes a database path, use it as-is
  // - Otherwise append the configured dbName
  const baseUri = (config.database.mongoUri || "").trim();
  const hasDbInUri = /mongodb(\+srv)?:\/\/[^/]+\/[^^?]+/i.test(baseUri);
  const uri = hasDbInUri ? baseUri : `${baseUri.replace(/\/$/, "")}/${config.database.dbName}`;

  const attemptConnect = async (retries = Infinity) => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000, // fail fast if DB is unreachable
      });
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err?.message || err);
      console.error("➡️ URI used:", uri);
      console.error(
        "💡 Tips: Start MongoDB locally (MongoDB Community Server) or set an Atlas URI in backend/.env as MONGODB_URI."
      );
      if (retries !== 0) {
        setTimeout(() => attemptConnect(retries === Infinity ? Infinity : retries - 1), 5000);
      }
    }
  };

  attemptConnect();
};

export default connectDB;
