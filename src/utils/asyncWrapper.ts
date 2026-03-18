import type { NextFunction, Request, Response } from "express";


export const asynWrapper = (fn: Function) => async (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return res.status(400).json({
      success: false,
      message: message
    })
  })
}