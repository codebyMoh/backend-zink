import express from 'express';
import type { Request, Response, NextFunction } from 'express';
//  env variables
import config from './config/env/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
// import main routes entry
import userRoutes from './routes/user.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import { connectDB } from './config/DB/db.config.js';
const app = express();

// strict origin cors configuration
const getOrigins = process.env.ALLOWEDORIGIN!;
const allowedOrigins = getOrigins?.toString().split(',');
const deploy = process.env.DEPLOY;
// apis cors configuration
app.use(
  cors({
    origin: function (origin, callback) {
      if (deploy == 'development') {
        // In development, allow all origins
        return callback(null, true);
      } else if (deploy == 'production') {
        // In production, only allow specific origins
        if (!origin || !allowedOrigins.includes(origin)) {
          return callback(new Error('Unauthorized'));
        }
      } else {
        // Default behavior if deploy is not set or unknown
        return callback(new Error('Unauthorized'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
    ],
    credentials: true,
    exposedHeaders: ['set-cookie'],
  }),
);
// send error when client is not authorized
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err?.message === 'Unauthorized') {
    return res.status(403).json({
      code: 403,
      success: false,
      error: 'Unauthorized request!!',
      data: {},
    });
  }
});

// rate limit set up
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 1000, // 1 second
  limit: Number(config.RATE_LIMIT), // Limit each IP to 5 requests per `window` (here, per 1 minutes).
  standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

// Apply the rate limiting middleware to all requests.
app.use(limiter);

// set limit on data
app.use(express.json());
// set cookie parser
app.use(cookieParser());
// uncode url
app.use(express.urlencoded({ extended: true }));

// defined entry routes
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔥 API Hit: [${req.method}] ${req.originalUrl}`);
  next();
});

// user
app.use('/api/v1/user', userRoutes);
// transaction
app.use('/api/v1/transaction', transactionRoutes);

app.post('/health', (req, res) => {
  res.send('server is running...');
});

// connect to the db and start the server
connectDB()
  .then((res) => {
    // server is running
    app.listen(config.PORT, () => {
      console.log(`server is running on port: ${config.PORT}`);
    });
  })
  .catch((err) => {
    console.log('🚀 ~ err:', err);
  });

// Request<Params, ResBody, ReqBody, ReqQuery>
