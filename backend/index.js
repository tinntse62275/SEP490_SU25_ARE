// app.js
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectToDatabase from "./db/db.js";
import authRouter from "./router/auth.js";

dotenv.config(); // Load biến môi trường từ .env

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình CORS
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Route kiểm tra
app.get("/", (req, res) => res.send("API working"));

// Routes chính
app.use("/api/auth", authRouter);

// Kết nối DB và khởi chạy server
const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
};

startServer();
