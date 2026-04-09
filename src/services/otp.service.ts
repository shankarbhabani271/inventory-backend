import OTP from "../models/otpModel.js";
import { AppError } from "../utils/appError.js";

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOtp = async (email: string, otp: string) => {
  return OTP.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
};

export const verifyOtpService = async (email: string, otp: string) => {

  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new AppError("VALIDATION_ERROR", "Invalid OTP");
  }

  if (otpRecord.expiresAt < new Date()) {
    throw new AppError("VALIDATION_ERROR", "OTP expired");
  }

  await OTP.deleteOne({ _id: otpRecord._id });

  return true;
};