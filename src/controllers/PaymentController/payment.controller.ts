import type { Request, Response } from "express";
import crypto from "crypto";
import { asynWrapper } from "../../utils/asyncWrapper.js";
import { sendResponse } from "../../utils/responseHandler.js";
import order from "../../model/order.model.js";
import payment from "../../model/payment.model.js";
import Cart from "../../model/card.model.js";
import CartItem from "../../model/cartItem.model.js";

class PaymentController {
  public verifyPayment = asynWrapper(async (req: any, res: Response) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return sendResponse(res, 400, false, "Missing payment verification parameters", null);
      }

      // Secret key for HMAC SHA256 verification
      const secret = process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || "fMpxH2gX4tWk1e5q3J7y9Z8x";

      // Create HMAC-SHA256 hash using razorpayOrderId|razorpayPaymentId
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      const isAuthentic = generatedSignature === razorpaySignature;

      if (!isAuthentic) {
        // Mark payment as failed in DB if signature doesn't match
        if (orderId) {
          await payment.update(
            { status: "FAILED", razorpayPaymentId, razorPaySignature: razorpaySignature },
            { where: { orderId } }
          ).catch(() => {});
        }
        return sendResponse(res, 400, false, "Invalid payment signature. Verification failed.", null);
      }

      // Update payment record in database
      const targetOrderId = orderId;
      if (targetOrderId) {
        await payment.update(
          {
            status: "PAID",
            razorpayPaymentId,
            razorPaySignature: razorpaySignature,
          },
          { where: { orderId: targetOrderId } }
        );

        // Update order status in database
        await order.update(
          {
            status: "PROCESSING",
            paymentStatus: "PAID",
          },
          { where: { id: targetOrderId } }
        );
      } else {
        await payment.update(
          {
            status: "PAID",
            razorpayPaymentId,
            razorPaySignature: razorpaySignature,
          },
          { where: { razorpayOrderId } }
        );
      }

      // Clear user cart in DB after successful payment verification
      const userId = req.user?.id;
      if (userId) {
        const userCart = await Cart.findOne({ where: { user_id: userId } });
        if (userCart) {
          await CartItem.destroy({ where: { cart_id: userCart.id } }).catch(() => {});
        }
      }

      return sendResponse(res, 200, true, "Payment verified and order placed successfully", {
        orderId: targetOrderId,
        paymentId: razorpayPaymentId,
        status: "PAID",
      });
    } catch (error: any) {
      console.error("Error in verifyPayment:", error);
      return sendResponse(res, 500, false, error?.message || "Internal server error", null);
    }
  });
}

export const paymentController = new PaymentController();
