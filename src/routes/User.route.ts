import {Router} from "express"
import {registerUser,loginUser,logoutUser} from "../controller/User.controller.js"
import { validateRequest } from "$/middlewares/validate.middleware.js";
import { signUpSchema } from "$/validations/user.validation.js";
import { sendOtp } from "$/controller/otp.controller.js";
const userouter = Router();

//Register

userouter.post("/register",validateRequest(signUpSchema),registerUser);

// Login
userouter.post("/send-otp", sendOtp)

userouter.post("/login",loginUser);

//Logout
userouter.post("/logout",logoutUser);


export default userouter