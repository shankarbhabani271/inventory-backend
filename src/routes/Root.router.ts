import authRouter from "$/routes/auth.route.js";
import {Router} from "express"
const RootRouter = Router();

RootRouter.use("/auth",authRouter)
export default  RootRouter