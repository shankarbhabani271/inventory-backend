import productRoutes from "$/routes/product.routes.js";
import authRouter from "$/routes/auth.route.js";
import {Router} from "express"
const RootRouter = Router();

RootRouter.use("/auth",authRouter)
RootRouter.use("/product", productRoutes)
export default  RootRouter