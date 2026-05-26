import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bunkerRouter from "./bunker";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bunkerRouter);

export default router;
