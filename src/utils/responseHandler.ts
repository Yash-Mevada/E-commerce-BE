import type { Response } from "express";


interface CookieOptions {
  name: string;
  value: string;
  options?: object;
}

export const sendResponse = (
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: any,
  cookie?: CookieOptions | null,
  dataCount?: number,
) => {

  if (cookie) {
    res.cookie(cookie.name, cookie.value, cookie.options || {});
  }

  return res.status(statusCode).json({
    success,
    message,
    data,
    count: dataCount
  });
};