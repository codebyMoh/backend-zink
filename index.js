require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { intialModels } = require("./src/model");
const userRoutes = require("./src/routes/user.routes");
const transactionRoutes = require("./src/routes/transactions.routes");
const adminRoutes = require("./src/routes/admin.routes");
const authRoutes = require("./src/routes/auth.routes");

const http = require("http");
const { Server } = require("socket.io");
const eventEmitter = require("./src/utils/events/eventEmmiter");
const { default: rateLimit } = require("express-rate-limit");
const {
  callAllAdminFunction,
} = require("./src/services/adminServices/adminServices");
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;
const RATE_LIMIT_NUMBER = process.env.RATE_LIMIT_NUMBER;
// strict origin cors configuration
const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:7777",
];

app.set("trust proxy", 1);
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  limit: Number(RATE_LIMIT_NUMBER), // Limit each IP to 5 requests per `window` (here, per 1 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});
// Apply the rate limiting middleware to all requests.
app.use(limiter);
// check health
app.use("/health", express.static(path.join(__dirname, "public")));
// server is running
app.get("/health", (req, res) => {
  res.sendFile("/public/index.html");
});

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) {
        return callback(new Error("Unauthorized"));
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("🚀 ~ Blocked origin:", origin);
        return callback(new Error("Unauthorized"));
      }
    },
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
    ],
    credentials: true,
  },
});
// apis cors configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        // ✅ Allow both listed origins and no-origin requests (like Postman/mobile)
        return callback(null, true);
      }
      console.log("❌ CORS Blocked origin:", origin);
      return callback(new Error("Unauthorized"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-API-Key",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);


// =========================================== events =========================================================
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// send error when client is not authorized
app.use((err, req, res, next) => {d
  if (err?.message == "Unauthorized") {
    return res.status(403).json({
      code: 403,
      success: false,
      error: "Unauthorized request!!",
      data: {},
    });
  }
});

// set limit on data
app.use(express.json({ limit: "500kb" }));
// uncode url
app.use(express.urlencoded({ extended: true }));
// allow file to render
app.use(express.static(path.resolve("./public")));

// redirect to routes
// user
app.use("/api/v1/user", userRoutes);
// transaction
app.use("/api/v1/transactions", transactionRoutes);
// admin routes
app.use("/api/v1/admin", adminRoutes);
// auth
app.use("/api/auth", authRoutes);

intialModels()
  .then(async (res) => {
    server.listen(PORT, async () => {
      // callAllAdminFunction();
      console.log(`Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err?.message);
  });