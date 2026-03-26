import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// import crypro from "node:crypto";

import { USER_STATUS } from "$/constants/user.constant.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "$/services/token.service.js";
// i otpModel
import envConfig from "$/config/env.config.js";
// import { OAuth2Client } from "google-auth-library";
// import transporter from "$/config/email.config.js";
// import otpModel from "$/models/otpModel.js";
import { UserModel } from "$/models/userModel.js";
import { OtpModel } from "$/models/otpModel.js";
// import OTPEmail from "$/emails/OTPEmail.js";
// import { render } from "@react-email/render";

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // const user = await UserModel.findOne({ email }).lean();

    const existingOtp = await OtpModel.findOne({ email });
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      res.status(429).json({ message: "OTP already sent. Try again later." });
      return;
    }

    // if (!user) {
    //   res.success({ message: "If the email exists, OTP has been sent" });
    //   return;
    // }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    await OtpModel.findOneAndUpdate(
      { email, organization: "" },
      {
        otpHash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      { upsert: true },
    );

    console.log("OTP:", otp);
    // const html = await render(OTPEmail({ otp }));
    // await transporter.sendMail({
    //   from: envConfig.NODE_MAILER_EMAIL,
    //   to: email,
    //   subject: "Your OTP Code",
    //   html
    // });
    res.success({ message: "If the email exists, OTP has been sent" });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
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
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
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

    // Delete OTP BEFORE password update
    await OtpModel.deleteOne({ email });

    user.password = await bcrypt.hash(password, 10);
    user.refreshTokens.splice(0, user.refreshTokens.length); // Invalidate all refresh tokens
    await user.save();

    res.success({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password  } = req.body;


    const user = await UserModel.findOne({ email });

    console.log(user,email,"++++++++++")
    if (!user) {
      res.badRequest({ message: "Invalid credentials email not found" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.badRequest({ message: "Invalid credentials pass issue" });
      return;
    }

    if (user.userStatus === USER_STATUS.SUSPENDED) {
      res.badRequest({ message: "You are suspended, contact admin" });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push({
      tokenHash: hashToken(refreshToken),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    user.lastLogin = new Date();
    await user.save();
    const isProd = envConfig.IS_PROD;

    const cookieName = "RefreshToken"

    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.success({
      data: { accessToken },
      message: "User logged in successfully",
    });
  } catch (error) {
    next(error);
  }
};
// export const GooglesignInController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {



//   try {
//     const ticket = await client.verifyIdToken({
//       idToken: req.body.token,
//       audience: envConfig.GOOGLE_CLIENT_ID,
//     });

//     const pannel = req?.body?.pannel ?? "user";

//     const payload = ticket.getPayload();
//     const user = await UserModel.findOne({ email: payload?.email });
//     if (!user) {
//       res.badRequest({ message: "Invalid credentials" });
//       return;
//     }


//     if (user.userStatus === USER_STATUS.SUSPENDED) {
//       res.badRequest({ message: "You are suspended, contact admin" });
//       return;
//     }

//     const accessToken = generateAccessToken(user._id.toString());
//     const refreshToken = generateRefreshToken(user._id.toString(),);

//     user.refreshTokens.push({
//       tokenHash: hashToken(refreshToken),
//       createdAt: new Date(),
//       expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//     });

//     user.lastLogin = new Date();
//     await user.save();
//     const isProd = envConfig.IS_PROD;

//     const cookieName ="RefreshToken"

//     res.cookie(cookieName, refreshToken, {
//       httpOnly: true,
//       secure: isProd,
//       sameSite: "lax",
//       path: "/",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     res.success({
//       data: { accessToken },
//       message: "User logged in successfully",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const googleSignUpController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const { token } = req.body;

//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: envConfig.GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();

//     if (!payload) {
//       res.status(401).json({ message: "Invalid Google token" });
//       return;
//     }

//     const { email, name,
//       // picture, sub, 
//       email_verified } = payload;

//     if (!email || !email_verified) {
//       res.status(403).json({ message: "Invalid email" });
//       return;
//     }

//     const existingUser = await UserModel.findOne({ email }).lean();
//     if (existingUser) {
//       res.status(400).json({ message: "User already exists" });
//       return;
//     }

//     const newUser = await UserModel.create({
//       name,
//       email,
//       password: crypro.randomBytes(20).toString("hex"),
//       // googleId: sub,
//       // provider: "google",
//       // picture,
//     });

//     const { password: _, ...userWithoutPassword } = newUser.toObject();

//     res.status(201).json({
//       data: userWithoutPassword,
//       message: "User Created Successfully via Google",
//     });

//   } catch (error) {
//     next(error);
//   }
// };

export const signUpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, phone, email, password } = req.body;

    // if (!otp) {
    //   res.status(400).json({ message: "OTP is required" });
    //   return;
    // }

    // if (!/^\d{6}$/.test(otp)) {
    //   res.status(400).json({ message: "OTP must be a 6-digit number" });
    //   return;
    // }
    const existingUser = await UserModel.findOne({ email }).lean();
    if (existingUser) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    // const checkedOtp = await OtpModel.findOne({ email });
    // if (!checkedOtp) {
    //   res.status(400).json({ message: "Invalid OTP" });
    //   return;
    // }

    // console.log(otp, checkedOtp.otpHash);
    // const isOtpValid = await bcrypt.compare(String(otp), checkedOtp.otpHash);

    // if (!isOtpValid) {
    //   throw new Error("Invalid OTP");
    // }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      phone,
      email,
      password: hashedPassword,
    });
    // await SubscriptionModel.create({
    //   createdBy: newUser._id,
    // });
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.created({
      data: userWithoutPassword,
      message: "User Created Successfully",
    });
    return;
  } catch (error) {
    next(error);
  }
};

export const checkCookiesEnabled = (req: Request, res: Response) => {
  const hasCookie = Boolean(req.cookies?.cookie_test);

  if (!hasCookie) {
    return res.status(401).json({
      success: false,
      code: "COOKIES_DISABLED",
      message: "Cookies are required for authentication",
    });
  }

  return res.success({
    message: "Cookies enabled",
  });
};

export const setCookieTest = (_req: Request, res: Response) => {
  res.cookie("cookie_test", "1", {
    httpOnly: true,
    secure: envConfig.IS_PROD,
    sameSite: envConfig.IS_PROD ? "lax" : "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.success({
    message: "Test cookie set successfully",
  });
};



export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const cookieName = "RefreshToken"
    const refreshToken = req.cookies?.[cookieName];

    if (!refreshToken) {
      res.unauthorized({ message: "Unauthenticated" });
      return;
    }

    let payload: { sub: string };

    try {
      payload = jwt.verify(refreshToken, envConfig.JWT_REFRESH_SECRET) as {
        sub: string;
      };
    } catch {
      res.unauthorized({ message: "Invalid refresh token" });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    const user = await UserModel.findOne({
      _id: payload.sub,
      refreshTokens: {
        $elemMatch: {
          tokenHash,
          expiresAt: { $gt: now },
        },
      },
    });

    if (!user) {
      res.unauthorized({ message: "Invalid refresh token" });
      return;
    }

    res.success({
      message: "Token refreshed",
      data: {
        accessToken: generateAccessToken(user._id.toString()),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await UserModel.updateOne(
        { "refreshTokens.tokenHash": hashToken(token) },
        { $pull: { refreshTokens: { tokenHash: hashToken(token) } } },
      );
    }

    const cookieName = "RefreshToken"

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: envConfig.IS_PROD,
      sameSite: "lax",
      path: "/",
    });

    res.success({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateProfileDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user || !req.user._id) {
      res.unauthorized({ message: "Unauthorized" });
      return;
    }

    const { name, phone } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      {
        ...(name && { name }),
        ...(phone && { phone }), // phone is string now
      },
      {
        new: true,
        runValidators: true,
        select: "-password -refreshTokens",
      },
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.success({
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
