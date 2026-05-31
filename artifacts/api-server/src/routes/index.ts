import { Router, type IRouter } from "express";
import healthRouter from "./health";
import { authRouter } from "./auth";
import { positionsRouter } from "./positions";
import { applicationsRouter } from "./applications";
import { adminRouter } from "./admin";
import { serversRouter } from "./servers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/servers", serversRouter);
router.use("/positions", positionsRouter);
router.use("/applications", applicationsRouter);
router.use("/admin", adminRouter);

export default router;
