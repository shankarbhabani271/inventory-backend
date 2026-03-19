import productRoutes from "$/routes/product.routes.js";
import userouter from "$/routes/User.route.js";
import {Router} from "express"
const RootRouter = Router();

RootRouter.use("/auth",userouter)
RootRouter.use("/product", productRoutes)
export default  RootRouter