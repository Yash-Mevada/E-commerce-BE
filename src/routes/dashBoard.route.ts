


import { Router } from "express"
import { dashBoardController } from "../controllers/DashBoardController/dashBoard.controller.js"



const router = Router()



router.get("/", dashBoardController.getDashBoardStat)


export default router