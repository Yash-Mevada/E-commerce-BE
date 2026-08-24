import Razorpay from "razorpay";
import { sendResponse } from "../utils/responseHandler.js";


const key_id = process.env.RAZORPAY_KEY_ID
const key_secret = process.env.RAZORPAY_KEY_SECRET

if (!key_id || !key_secret) {
  throw new Error("Razorpay credentials are missing")
}

export const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret

})