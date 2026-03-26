import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import { createServer } from 'http';
import mongoose2, { Schema } from 'mongoose';
import { z, ZodError } from 'zod';
import dotenv from 'dotenv';
import os from 'os';
import { v4 } from 'uuid';
import cors from 'cors';
<<<<<<< HEAD
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
=======
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
>>>>>>> 453003f225b70a968af64ea89b0b30435b4a4945

// src/server.ts
var LOG_DIR = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}
var baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);
var logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: baseFormat,
  transports: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, "app-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true
    }),
    new DailyRotateFile({
      filename: path.join(LOG_DIR, "error-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxSize: "20m",
      maxFiles: "30d",
      zippedArchive: true
    })
  ],
  exitOnError: false
});
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

// src/middlewares/accessLogger.middleware.ts
var accessLoggerMiddleware = morgan(
  (tokens, req, res) => {
    const payload = {
      requestId: req.requestId,
      method: tokens.method(req, res) ?? "",
      url: tokens.url(req, res) ?? "",
      status: Number(tokens.status(req, res)),
      responseTimeMs: Number(tokens["response-time"](req, res)),
      ip: tokens["remote-addr"](req, res) ?? "",
      userAgent: tokens["user-agent"](req, res)
    };
    return JSON.stringify(payload);
  },
  {
    stream: {
      write: (message) => {
        logger.info(JSON.parse(message));
      }
    }
  }
);
var productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    // category: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Category",
    //   required: true
    // },
    // image:
    // {
    //   url: String,
    //   publicId: String,
    // },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);
var ProductModel = mongoose2.model("Product", productSchema);
var variantSchema = new mongoose2.Schema(
  {
    product: {
      type: mongoose2.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    attributes: {
      type: mongoose2.Schema.Types.Mixed,
      default: {}
    },
    attributesKey: {
      type: String,
      required: true
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    price: {
      salePrice: {
        type: Number,
        required: true
      },
      mrp: {
        type: Number,
        required: true
      }
    }
  },
  { timestamps: true }
);
var VariantModel = mongoose2.model("Variant", variantSchema);

// src/controller/product.controller.ts
var createProduct = async (req, res, next) => {
  try {
    const {
      variants,
      prodDetails
    } = req.body;
    const product = await ProductModel.create({ ...prodDetails });
    const rex = variants.map((item) => {
      const sku = `${prodDetails.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1e4)}`;
      return {
        ...item,
        sku
      };
    });
    rex.forEach(async (variant) => {
      await VariantModel.create({
        ...variant,
        product: product._id
      });
    });
    res.success({
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    next(error);
  }
};
var getAllProducts = async (_req, res) => {
  try {
    const products = await ProductModel.find();
    const PopulatedProd = await Promise.all(
      products.map(async (product) => {
        const variants = await VariantModel.find({ product: product._id });
        return {
          product,
          variants
        };
      })
    );
    res.success({
      message: "Products retrieved successfully",
      data: PopulatedProd
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getSingleProduct = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id).populate("category").populate("variants");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var updateProduct = async (req, res) => {
  try {
    const product = await ProductModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    if (req.body.variants) {
      await VariantModel.updateMany(
        { product: req.params.id },
        { $set: req.body.variants }
      );
    }
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var deleteProduct = async (req, res) => {
  try {
    const product = await ProductModel.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }
    if (req.params.id) {
      await VariantModel.deleteMany({ product: req.params.id });
    }
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// src/middlewares/validate.middleware.ts
var validateRequest = (schemas) => {
  return async (req, _res, next) => {
    try {
      if (schemas.body) {
        await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// src/middlewares/createzodschema.ts
var CreateZodSchema = ({
  body,
  params,
  query
}) => {
  return {
    body,
    params,
    query
  };
};

// src/validations/product.validation.ts
var createProductSchema = CreateZodSchema(
  {
    body: z.object({
      prodDetails: z.object({
        name: z.string({ message: "Name is required" }).min(3, "Name must be at least 3 characters long").nonempty("Name is required"),
        description: z.string({ message: "Description is required" }).min(30, "Description must be at least 30 characters long").nonempty("Description is required"),
        brand: z.string({ message: "Brand is required" }).min(3, "Brand must be at least 3 characters long").nonempty("Brand is required"),
        category: z.string({ message: "Category is required" }).nonempty("Category is required")
      }),
      variants: z.array(
        z.object({
          attribute: z.string({ message: "Attribute is required" }).nonempty("Attribute is required"),
          attributeKey: z.string({ message: "Attribute Key is required" }).nonempty("Attribute Key is required"),
          price: z.object({
            salePrice: z.number({ message: "Sale Price is required" }).positive("Sale Price must be a positive number"),
            mrp: z.number({ message: "MRP is required" }).positive("MRP must be a positive number")
          })
        })
      )
    })
  }
);

// src/routes/product.routes.ts
var productRoutes = Router();
productRoutes.post("/", validateRequest(createProductSchema), createProduct);
productRoutes.get("/", getAllProducts);
productRoutes.get("/:id", getSingleProduct);
productRoutes.put("/:id", updateProduct);
productRoutes.delete("/:id", deleteProduct);
var product_routes_default = productRoutes;
dotenv.config();
var envConfig = {
  DB_URI: process.env.DB_URI || "",
  PORT: process.env.PORT || 4500,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
  RAZOR_KEY_ID: process.env.RAZOR_KEY_ID,
  RAZOR_KEY_SECRET: process.env.RAZOR_KEY_SECRET,
  RAZOR_WEBHOOK_SECRET: process.env.RAZOR_WEBHOOK_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  IS_PROD: process.env.NODE_ENV !== "dev",
  NODE_MAILER_EMAIL: process.env.NODE_MAILER_EMAIL || "",
  NODE_MAILER_PASS: process.env.NODE_MAILER_PASS || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number.parseInt(process.env.SMTP_PORT || "465", 10),
  // AWS
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  LOG_FILE_VALIDITY: process.env.LOG_FILE_VALIDITY || "1d",
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || ""
};
var env_config_default = envConfig;

// src/types/error.ts
var ERROR_TYPES = {
  VALIDATION_ERROR: {
    defaultMessage: "Validation Error",
    statusCode: 400,
    errorType: "ValidationError",
    errorCode: "VALIDATION_ERROR"
  },
  NOT_FOUND_ERROR: {
    defaultMessage: "Resource Not Found",
    statusCode: 404,
    errorType: "NotFoundError",
    errorCode: "NOT_FOUND_ERROR"
  },
  UNAUTHORIZED_ERROR: {
    defaultMessage: "Unauthorized Access",
    statusCode: 401,
    errorType: "UnauthorizedError",
    errorCode: "UNAUTHORIZED_ERROR"
  },
  FORBIDDEN_ERROR: {
    defaultMessage: "Forbidden Access",
    statusCode: 403,
    errorType: "ForbiddenError",
    errorCode: "FORBIDDEN_ERROR"
  },
  INTERNAL_SERVER_ERROR: {
    defaultMessage: "Internal Server Error",
    statusCode: 500,
    errorType: "InternalServerError",
    errorCode: "INTERNAL_SERVER_ERROR"
  },
  RATE_LIMITER_ERROR: {
    defaultMessage: "Too Many Requests",
    statusCode: 429,
    errorType: "RateLimiterError",
    errorCode: "RATE_LIMITER_ERROR"
  },
  CAST_ERROR: {
    defaultMessage: "Invalid resource identifier",
    statusCode: 400,
    errorType: "CastError",
    errorCode: "CAST_ERROR"
  },
  JWT_EXPIRED_ERROR: {
    defaultMessage: "Token has expired. Please log in again.",
    statusCode: 401,
    errorType: "TokenExpiredError",
    errorCode: "JWT_EXPIRED_ERROR"
  },
  JWT_INVALID_ERROR: {
    defaultMessage: "Invalid token. Please log in again.",
    statusCode: 401,
    errorType: "JsonWebTokenError",
    errorCode: "JWT_INVALID_ERROR"
  },
  DUPLICATE_FIELD_ERROR: {
    defaultMessage: "Duplicate field value. Please use another value!",
    statusCode: 400,
    errorType: "DuplicateFieldError",
    errorCode: "DUPLICATE_FIELD_ERROR"
  },
  BAD_REQUEST_ERROR: {
    defaultMessage: "Bad Request",
    statusCode: 400,
    errorType: "BadRequestError",
    errorCode: "BAD_REQUEST_ERROR"
  },
  CORS_ERROR: {
    defaultMessage: "Not allowed by CORS",
    statusCode: 403,
    errorType: "CorsError",
    errorCode: "CORS_ERROR"
  }
};

// src/utils/appError.ts
var AppError = class extends Error {
  statusCode;
  errorType;
  errorCode;
  isOperational;
  data;
  constructor(errorKey, message, data) {
    const { defaultMessage, statusCode, errorType, errorCode } = ERROR_TYPES[errorKey];
    super(message || defaultMessage);
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.data = data;
  }
};
var ValidationError = class extends AppError {
  validationMessages;
  constructor(validationMessages) {
    const primary = validationMessages[0] ?? "Invalid request data";
    super("VALIDATION_ERROR", primary);
    this.validationMessages = validationMessages;
  }
  toJSON() {
    return {
      success: false,
      error: {
        code: 400,
        message: this.message,
        // primary
        details: this.validationMessages
        // all messages
      }
    };
  }
};
var JwtExpiredError = class extends AppError {
  constructor(message) {
    super("JWT_EXPIRED_ERROR", message);
  }
};
var notFoundMiddleware = (req, res) => {
  logger.warn({
    event: "route_not_found",
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl
  });
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestId: req.requestId
  });
};
var errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message;
  logger.error({
    event: "application_error",
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl
  });
  if (err instanceof ZodError) {
    res.badRequest({
      statusCode: 400,
      message: err.issues[0].message,
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        // ex: "email", "user.address.zip"
        message: issue.message
      }))
    });
    return;
  }
  if (err instanceof ValidationError) {
    res.badRequest({
      statusCode: 400,
      message
    });
    return;
  }
  res.status(statusCode).json({
    success: false,
    message: env_config_default.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    errorCode: err.errorCode ?? "UNKNOWN_ERROR",
    requestId: req.requestId
  });
};
var getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};
var initializeServer = ({ server: server2 }) => {
  server2.listen(env_config_default.PORT, () => {
    console.log(`\u2192 Localhost: http://localhost:${env_config_default.PORT}/`);
    try {
      const localIP = getLocalIP();
      console.log(`\u2192 Local IP : http://${localIP}:${env_config_default.PORT}/`);
    } catch (error) {
      console.log(error);
    }
  }).on("error", (err) => {
    console.log(err);
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    server2.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  });
  process.on("SIGINT", () => {
    server2.close(() => {
      console.log("the server stopped with (Ctrl+C).");
      process.exit(0);
    });
  });
};
var server_config_default = initializeServer;
var requestContextMiddleware = (req, res, next) => {
  const requestId = req.header("x-request-id") ?? v4();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
};

// src/middlewares/response.middleware.ts
var successResponse = (res, {
  data = {},
  message = "Operation Successful",
  statusCode = 200
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
var createdResponse = (res, {
  data = {},
  message = "Resource Created Successfully",
  statusCode = 201
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
var badRequest = (res, params) => {
  const { message = "Bad Request", statusCode = 400, errors } = params;
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};
var unauthorized = (res, { message = "Unauthorized" }) => {
  return res.status(401).json({
    success: false,
    message
  });
};
var forbidden = (res, { message = "Forbidden" }) => {
  return res.status(403).json({
    message
  });
};
var responseHandler = (_req, res, next) => {
  res.success = ({ data = {}, message = "Operation Successful", statusCode }) => successResponse(res, { data, message, statusCode });
  res.created = ({ data = {}, message = "Resource Created Successfully" }) => createdResponse(res, { data, message });
  res.unauthorized = ({ message = "Unauthorized" }) => unauthorized(res, { message});
  res.forbidden = ({ message = "Forbidden" }) => forbidden(res, { message});
  res.badRequest = ({ message = "Bad Request", statusCode = 400, errors }) => badRequest(res, { message, statusCode, errors });
  next();
};
var response_middleware_default = responseHandler;
var applyCores = ({ app: app2 }) => {
  const allowedOrigins = [
    "http://localhost:4173",
    "http://localhost:4550",
    "http://localhost:5173",
    "http://localhost:5174"
  ];
  app2.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app2.options(/.*/, cors());
};
var connectDB = async () => {
  if (mongoose2.connection.readyState === 1) {
    console.info("MongoDB is already connected.");
    return;
  }
  try {
    await mongoose2.connect(env_config_default.DB_URI);
    console.log("Connected to MongoDB");
    console.info("Connected to MongoDB");
    mongoose2.connection.on("disconnected", () => {
      console.log("Lost MongoDB connection");
      console.warn("Lost MongoDB connection");
    });
    mongoose2.connection.on("reconnected", () => {
      console.log("Reconnected to MongoDB");
      console.info("Reconnected to MongoDB");
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.log(env_config_default.DB_URI, "iiiii");
    process.exit(1);
  }
};
var db_config_default = connectDB;
<<<<<<< HEAD

// src/constants/user.constant.ts
var USER_STATUS = /* @__PURE__ */ ((USER_STATUS2) => {
  USER_STATUS2["ACTIVE"] = "ACTIVE";
  USER_STATUS2["SUSPENDED"] = "SUSPENDED";
  return USER_STATUS2;
})(USER_STATUS || {});
var USER_ROLE = /* @__PURE__ */ ((USER_ROLE2) => {
  USER_ROLE2["SUPER_ADMIN"] = "SUPER_ADMIN";
  USER_ROLE2["USER"] = "USER";
  return USER_ROLE2;
})(USER_ROLE || {});
var ACCESS_TOKEN_TTL = "1d";
var REFRESH_TOKEN_TTL = "15d";
var generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, env_config_default.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL
  });
};
var generateRefreshToken = (userId) => {
  return jwt.sign({ sub: userId }, env_config_default.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL
  });
};
var hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
var verifyToken = ({
  token,
  type
}) => {
  const secret = env_config_default.JWT_SECRET ;
  if (token) {
    return jwt.verify(token, secret);
  }
};
var refreshTokenSchema = new Schema(
=======
var userSchema = new mongoose2.Schema(
>>>>>>> 453003f225b70a968af64ea89b0b30435b4a4945
  {
    tokenHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
  },
  { _id: false }
);
var userSchema = new Schema(
  {
    name: String,
    phone: { type: String },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: { unique: true }
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLE),
      default: "USER" /* USER */
    },
    userStatus: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: "ACTIVE" /* ACTIVE */
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: []
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);
<<<<<<< HEAD
var UserModel = mongoose.model("User", userSchema);
var otpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    organization: { type: String },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }
  },
  { timestamps: true }
);
var OtpModel = mongoose.model("otp", otpSchema);

// src/controllers/auth.controller.ts
var sendOtp = async (req, res, next) => {
=======
var UserModel = mongoose2.model("User", userSchema);
var userModel_default = UserModel;
var otpSchema = new mongoose2.Schema({
  email: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
});
var otpModel_default = mongoose2.model("OTP", otpSchema);
var registerUser = async (req, res, next) => {
>>>>>>> 453003f225b70a968af64ea89b0b30435b4a4945
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }
    const existingOtp = await OtpModel.findOne({ email });
    if (existingOtp && existingOtp.expiresAt > /* @__PURE__ */ new Date()) {
      res.status(429).json({ message: "OTP already sent. Try again later." });
      return;
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    await OtpModel.findOneAndUpdate(
      { email, organization: "" },
      {
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1e3)
      },
      { upsert: true }
    );
    console.log("OTP:", otp);
    res.success({ message: "If the email exists, OTP has been sent" });
  } catch (error) {
    next(error);
  }
};
var forgotPasswordController = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) {
      res.status(400).json({ message: "Email, OTP and password are required" });
      return;
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid OTP or expired" });
      return;
    }
    const otpRecord = await OtpModel.findOne({ email });
    if (!otpRecord || otpRecord.expiresAt < /* @__PURE__ */ new Date()) {
      await OtpModel.deleteOne({ email });
      res.status(400).json({ message: "OTP expired or invalid" });
      return;
    }
    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValidOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      if (otpRecord.attempts >= 5) {
        await OtpModel.deleteOne({ email });
        res.status(400).json({ message: "Too many attempts. OTP expired." });
        return;
      }
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    await OtpModel.deleteOne({ email });
    user.password = await bcrypt.hash(password, 10);
    user.refreshTokens.splice(0, user.refreshTokens.length);
    await user.save();
    res.success({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
var signInController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    console.log(user, email, "++++++++++");
    if (!user) {
      res.badRequest({ message: "Invalid credentials email not found" });
      return;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.badRequest({ message: "Invalid credentials pass issue" });
      return;
    }
    if (user.userStatus === "SUSPENDED" /* SUSPENDED */) {
      res.badRequest({ message: "You are suspended, contact admin" });
      return;
    }
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      createdAt: /* @__PURE__ */ new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    });
    user.lastLogin = /* @__PURE__ */ new Date();
    await user.save();
    const isProd = env_config_default.IS_PROD;
    const cookieName = "RefreshToken";
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    res.success({
      data: { accessToken },
      message: "User logged in successfully"
    });
  } catch (error) {
    next(error);
  }
};
var signUpController = async (req, res, next) => {
  try {
    const { name, phone, email, password } = req.body;
    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      name,
      phone,
      email,
      password: hashedPassword
    });
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.created({
      data: userWithoutPassword,
      message: "User Created Successfully"
    });
    return;
  } catch (error) {
    next(error);
  }
};
var checkCookiesEnabled = (req, res) => {
  const hasCookie = Boolean(req.cookies?.cookie_test);
  if (!hasCookie) {
    return res.status(401).json({
      success: false,
      code: "COOKIES_DISABLED",
      message: "Cookies are required for authentication"
    });
  }
  return res.success({
    message: "Cookies enabled"
  });
};
<<<<<<< HEAD
var setCookieTest = (_req, res) => {
  res.cookie("cookie_test", "1", {
    httpOnly: true,
    secure: env_config_default.IS_PROD,
    sameSite: env_config_default.IS_PROD ? "lax" : "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1e3
  });
  return res.success({
    message: "Test cookie set successfully"
  });
};
var refreshTokenController = async (req, res, next) => {
  try {
    const cookieName = "RefreshToken";
    const refreshToken = req.cookies?.[cookieName];
    if (!refreshToken) {
      res.unauthorized({ message: "Unauthenticated" });
      return;
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, env_config_default.JWT_REFRESH_SECRET);
    } catch {
      res.unauthorized({ message: "Invalid refresh token" });
      return;
    }
    const tokenHash = hashToken(refreshToken);
    const now = /* @__PURE__ */ new Date();
    const user = await UserModel.findOne({
      _id: payload.sub,
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          expiresAt: { $gt: now }
        }
      }
    });
    if (!user) {
      res.unauthorized({ message: "Invalid refresh token" });
      return;
    }
    res.success({
      message: "Token refreshed",
      data: {
        accessToken: generateAccessToken(user._id.toString())
      }
    });
  } catch (error) {
    next(error);
  }
};
var logoutController = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await UserModel.updateOne(
        { "refreshTokens.tokenHash": hashToken(token) },
        { $pull: { refreshTokens: { tokenHash: hashToken(token) } } }
      );
    }
    const cookieName = "RefreshToken";
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: env_config_default.IS_PROD,
      sameSite: "lax",
      path: "/"
    });
    res.success({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
var updateProfileDetails = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      res.unauthorized({ message: "Unauthorized" });
      return;
    }
    const { name, phone } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        ...name && { name },
        ...phone && { phone }
        // phone is string now
      },
      {
        new: true,
        runValidators: true,
        select: "-password -refreshTokens"
      }
    );
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.success({
      data: user,
      message: "Profile updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

// src/middlewares/validate.middleware.ts
var validateRequest = (schemas) => {
  return async (req, _res, next) => {
    try {
      if (schemas.body) {
        await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var authenticate = (roles = []) => {
  const allowedRoles = roles?.length ? [...roles, "SUPER_ADMIN" /* SUPER_ADMIN */] : null;
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const cookieName = "RefreshToken";
      const refreshToken = req.cookies?.[cookieName];
      if (!token && refreshToken) {
        res.unauthorized({
          message: "Session expired. Please reload."
        });
        return;
      }
      if (!token) {
        res.unauthorized({
          message: "Token not found"
        });
        return;
      }
      try {
        const decoded = verifyToken({
          token,
          type: "ACCESS" /* ACCESS */
        });
        const user = await UserModel.findById(decoded?.sub).lean();
        if (!user) {
          if (refreshToken) {
            await UserModel.updateOne(
              { "refreshTokens.tokenHash": hashToken(refreshToken) },
              {
                $pull: {
                  refreshTokens: { tokenHash: hashToken(refreshToken) }
                }
              }
            );
            res.clearCookie("refreshToken", {
              httpOnly: true,
              secure: env_config_default.IS_PROD,
              sameSite: env_config_default.IS_PROD ? "lax" : "none",
              path: "/"
            });
          }
          return res.badRequest({
            message: "User not found",
            statusCode: 400
          });
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return res.forbidden({
            message: "You do not have permission to access this resource"
          });
        }
        req.user = user;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new JwtExpiredError("Session expired. Please reload.");
        }
        return next(error);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_middleware_default = authenticate;

// src/functions/CreateZodSchema.ts
var CreateZodSchema = ({
  body,
  params,
  query
}) => {
  return {
    body,
    params,
    query
  };
};
var signUpSchema = CreateZodSchema({
=======
var signUpSchema = {
>>>>>>> 453003f225b70a968af64ea89b0b30435b4a4945
  body: z.object({
    name: z.string({ message: "Name is required" }).min(3, "Name must be at least 3 characters long").nonempty("Name is required"),
    password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters long.").refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter."
    }).refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter."
    }).refine((password) => /\d/.test(password), {
      message: "Password must contain at least one number."
    }),
    // role: z
    //   .enum(USER_ROLE, {
    //     message: `role must be ${Object.keys(USER_ROLE).join(", ")}`,
    //   })
    //   ?.optional(),
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email format" }),
    phone: z.number({ message: "Phone number must be a number" }).positive("Phone number must be a positive number").min(1e9, "Phone number must be exactly 10 digits").max(9999999999, "Phone number must be exactly 10 digits")
  })
});
var signInSchema = CreateZodSchema({
  body: z.object({
    email: z.string({ message: "Email is required" }).email(),
    password: z.string({ message: "Password is required" })
  })
});
var forgotSchema = CreateZodSchema({
  body: z.object({
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email format" }),
    password: z.string({ message: "Password is required" }),
    otp: z.number({ message: "OTP Must be a number" }).min(6, "OTP must be 6 digits")
  })
});
var otpSchema2 = CreateZodSchema({
  body: z.object({
    email: z.string({ message: "Email is required" }).email()
  })
});
CreateZodSchema({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(3, "Name must be at least 3 characters long").optional(),
    phone: z.number({ message: "Phone number must be a number" }).positive("Phone number must be a positive number").min(1e9, "Phone number must be exactly 10 digits").max(9999999999, "Phone number must be exactly 10 digits").optional()
  })
});

// src/routes/auth.route.ts
var authRouter = Router();
authRouter.post("/sign-in", validateRequest(signInSchema), signInController);
authRouter.post("/signUp", validateRequest(signUpSchema), signUpController);
authRouter.post("/refresh", refreshTokenController);
authRouter.post("/check-cookies", checkCookiesEnabled);
authRouter.post("/set-check-cookies", setCookieTest);
authRouter.post("/logout", logoutController);
authRouter.post("/generate-otp", validateRequest(otpSchema2), sendOtp);
authRouter.patch(
  "/forgot",
  validateRequest(forgotSchema),
  forgotPasswordController
);
authRouter.patch(
  "/update-profile",
  auth_middleware_default(),
  updateProfileDetails
);
var auth_route_default = authRouter;
var RootRouter = Router();
<<<<<<< HEAD
RootRouter.use("/auth", auth_route_default);
var Root_router_default = RootRouter;
=======
RootRouter.use("/auth", User_route_default);
RootRouter.use("/product", product_routes_default);
var routes_default = RootRouter;
>>>>>>> 453003f225b70a968af64ea89b0b30435b4a4945

// src/server.ts
var __filename$1 = fileURLToPath(import.meta.url);
var __dirname$1 = path.dirname(__filename$1);
var app = express();
var publicDir = path.join(__dirname$1, "..", "public");
app.use(express.static(publicDir));
var server = createServer(app);
app.use(response_middleware_default);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
applyCores({ app });
var initialize = () => {
  db_config_default();
};
initialize();
server_config_default({ server });
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname$1, "../public/starter.html"));
});
app.set("trust proxy", true);
app.use(requestContextMiddleware);
app.use(accessLoggerMiddleware);
app.use("/api", routes_default);
app.use("/api/products", product_routes_default);
app.use(notFoundMiddleware);
app.use(errorHandler);

export { app, server };
