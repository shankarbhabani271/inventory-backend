import cookieParser from 'cookie-parser';
import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import { createServer } from 'http';
import mongoose3, { Schema } from 'mongoose';
import { z, ZodError } from 'zod';
import dotenv from 'dotenv';
import os from 'os';
import { v4 } from 'uuid';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

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
    category: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    variants: [
      {
        type: mongoose3.Schema.Types.ObjectId,
        ref: "Variant"
      }
    ],
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
var ProductModel = mongoose3.model("Product", productSchema);
var variantSchema = new mongoose3.Schema(
  {
    product: {
      type: mongoose3.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    attributes: [
      {
        key: String,
        value: String
      }
    ],
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
var VariantModel = mongoose3.model("Variant", variantSchema);

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
var getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const total = await ProductModel.countDocuments();
    const PopulatedProducts = await ProductModel.find().populate("category").populate("variants").skip(skip).limit(limit);
    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      nextPages: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null
    };
    res.success({
      message: "Products retrieved successfully",
      data: {
        product: PopulatedProducts,
        meta
      }
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
    const product = await ProductModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
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
  if (mongoose3.connection.readyState === 1) {
    console.info("MongoDB is already connected.");
    return;
  }
  try {
    await mongoose3.connect(env_config_default.DB_URI);
    console.log("Connected to MongoDB");
    console.info("Connected to MongoDB");
    mongoose3.connection.on("disconnected", () => {
      console.log("Lost MongoDB connection");
      console.warn("Lost MongoDB connection");
    });
    mongoose3.connection.on("reconnected", () => {
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
var userSchema = new mongoose3.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true,
      select: false
    }
  },
  {
    timestamps: true
  }
);
var UserModel = mongoose3.model("User", userSchema);
var userModel_default = UserModel;
var otpSchema = new mongoose3.Schema({
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
var otpModel_default = mongoose3.model("OTP", otpSchema);
var registerUser = async (req, res, next) => {
  try {
    const { email, password, otp } = req.body;
    const otpData = await otpModel_default.findOne({ email, otp });
    if (!otpData) {
      res.status(400).json({
        message: "Invalid OTP"
      });
      return;
    }
    if (otpData.expiresAt < /* @__PURE__ */ new Date()) {
      res.status(400).json({
        message: "OTP expired"
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel_default.create({
      email,
      password: hashedPassword
    });
    await otpModel_default.deleteMany({ email });
    res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel_default.findOne({ email });
    if (!user) {
      res.status(400).json({
        message: "User not found"
      });
      return;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      res.status(400).json({
        message: "Invalid password"
      });
      return;
    }
    res.status(200).json({
      message: "Login successful",
      user
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
};
var logoutUser = async (req, res) => {
  res.status(200).json({
    message: "Logout successful"
  });
};
var signUpSchema = {
  body: z.object({
    name: z.string({ message: "Name is required" }).min(3, "Name must be at least 3 characters long").nonempty("Name is required"),
    password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters long.").refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter."
    }).refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter."
    }).refine((password) => /\d/.test(password), {
      message: "Password must contain at least one number."
    }),
    email: z.string({ message: "Email is required" }).email({ message: "Invalid email format" }),
    phone: z.number({ message: "Phone number is required" }).min(10, "Phone number must be at least 10 digits long"),
    userType: z.enum(["ADMIN", "SUPER_ADMIN"], {
      message: "userType must be ADMIN or SUPER_ADMIN"
    })
  })
};
({
  body: z.object({
    email: z.string({ message: "Email is required" }).email(),
    password: z.string({ message: "Password is required" }).min(8, "Password must be at least 8 characters long.").refine((password) => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter."
    }).refine((password) => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter."
    }).refine((password) => /\d/.test(password), {
      message: "Password must contain at least one number."
    })
  })
});
console.log("EMAIL:", env_config_default.NODE_MAILER_EMAIL);
console.log("PASS:", env_config_default.NODE_MAILER_PASS);
var transporter = nodemailer.createTransport({
  host: env_config_default.SMTP_HOST,
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: env_config_default.NODE_MAILER_EMAIL,
    pass: env_config_default.NODE_MAILER_PASS
  },
  logger: false
});
transporter.verify((error, success) => {
  if (success) {
    console.info("Nodemailer is ready to send emails");
  }
  if (error) {
    console.error("Nodemailer configuration error:", error);
  } else {
    console.info("Nodemailer is ready to send emails");
  }
});
var email_config_default = transporter;

// src/controller/otp.controller.ts
var sendOtp = async (req, res, next) => {
  try {
    console.log("object", "+++++++++");
    const { email } = req.body;
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    await otpModel_default.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1e3)
    });
    email_config_default.sendMail({
      from: env_config_default.NODE_MAILER_EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 5 minutes.`
    });
    res.success({
      message: "OTP sent successfully",
      data: { otp }
    });
  } catch (err) {
    next(err);
  }
};

// src/routes/User.route.ts
var userouter = Router();
userouter.post("/register", validateRequest(signUpSchema), registerUser);
userouter.post("/send-otp", sendOtp);
userouter.post("/login", loginUser);
userouter.post("/logout", logoutUser);
var User_route_default = userouter;
var RootRouter = Router();
RootRouter.use("/auth", User_route_default);
RootRouter.use("/product", product_routes_default);
var routes_default = RootRouter;

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
