import { Router } from "express";

import {
  sendOtp,
  forgotPasswordController,
  signInController,
  refreshTokenController,
  logoutController,
  updateProfileDetails,
  checkCookiesEnabled,
  setCookieTest,
  signUpController
} from "$/controllers/auth.controller.js";

import { validateRequest } from "$/middlewares/validate.middleware.js";
import authenticate from "$/middlewares/auth.middleware.js";

import {
  forgotSchema,
  otpSchema,
  signInSchema,
  signUpSchema,
  // updateProfileSchema,
} from "$/validations/user.validation.js";


const authRouter = Router();

authRouter.post("/sign-in", validateRequest(signInSchema), signInController);

// authRouter.post("/google-sign-in", GooglesignInController )
authRouter.post("/signUp", validateRequest(signUpSchema), signUpController);
// authRouter.post("/google-sign-up", googleSignUpController);

authRouter.post("/refresh", refreshTokenController);
authRouter.post("/check-cookies", checkCookiesEnabled);
authRouter.post("/set-check-cookies", setCookieTest);

authRouter.post("/logout", logoutController);
// authRouter.post("/me", me);

authRouter.post("/generate-otp", validateRequest(otpSchema), sendOtp);

authRouter.patch(
  "/forgot",
  validateRequest(forgotSchema),
  forgotPasswordController,
);

/* PROFILE */

authRouter.patch(
  "/update-profile",
  authenticate(),
  updateProfileDetails,
);

// authRouter.post(
//   "/add-admin",
//   authenticate(),
//   validateRequest(signUpSchema),
//   AddAdmin,
// );




export default authRouter;