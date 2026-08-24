import type { Request, Response } from "express";
import { asynWrapper } from "../../utils/asyncWrapper.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { sequelize } from "../../Database/db.js";
import Cart from "../../model/card.model.js";
import CartItem from "../../model/cartItem.model.js";
import Product from "../../model/product.model.js";

import { razorpay } from "../../services/razorpay.services.js";
import order from "../../model/order.model.js";
import orderItems from "../../model/orderItems.model.js";
import payment from "../../model/payment.model.js";








class OrderController {

  public createOrder = asynWrapper(async (req: any, res: Response) => {
    let transaction;
    try {
      const user = req?.user;
      if (!user?.id) {
        return sendResponse(res, 401, false, "User is not authenticated", null);
      }
      const userId = user.id;

      // check address is available or not 
      const { addressId } = req.body;
      if (!addressId) {
        return sendResponse(res, 400, false, "Address is required", null);
      }

      transaction = await sequelize.transaction();

      // get User cart 
      const cart: any = await Cart.findOne({
        where: { user_id: userId },
        include: [
          {
            model: CartItem,
            include: [
              { model: Product }
            ]
          }
        ],
        transaction
      });

      const items = cart?.cartItems || cart?.items || [];

      if (!cart || !Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return sendResponse(res, 400, false, "Cart is Empty", null);
      }

      // calculate subtotal
      let subtotal = 0;

      const orderItemsData = items.map((cartItem: any) => {
        const product = cartItem.product;
        const price = Number(product?.price || 0);
        const quantity = Number(cartItem.quantity || 1);
        const itemSubTotal = price * quantity;
        subtotal = subtotal + itemSubTotal;

        return {
          productId: product?.id,
          productImage: product?.image?.[0] ?? product?.image ?? null,
          ProductName: product?.name || "Product",
          quantity,
          price,
          subtotal: itemSubTotal
        };
      });

      // calculate shipping & tax
      const shipping = 0;
      const tax = 0;
      const totalInRupees = subtotal + shipping + tax;
      const razorpayAmountInPaise = Math.round(totalInRupees * 100);

      const razorpayOrder = await razorpay.orders.create({
        amount: razorpayAmountInPaise,
        currency: "INR",
        receipt: `order_${userId.slice(0, 8)}_${Date.now()}`
      });

      // create our order 
      const orderData = await order.create({
        userId,
        subtotal: subtotal,
        shipping,
        tax,
        total: totalInRupees,
        status: "PENDING",
        paymentStatus: "PENDING",
        razorpayOrderId: razorpayOrder.id,
        addressId: addressId
      }, {
        transaction
      });

      // create orderItems
      const OrderItems = orderItemsData.map((item: any) => {
        return {
          ...item,
          orderId: orderData?.id
        };
      });

      await orderItems.bulkCreate(OrderItems, {
        transaction
      });

      // create payment record
      await payment.create({
        orderId: orderData?.id,
        razorpayOrderId: razorpayOrder?.id,
        amount: totalInRupees,
        currency: "INR",
        status: "PENDING"
      }, {
        transaction
      });

      await transaction.commit();

      return sendResponse(res, 201, true, "Order created successfully", {
        orderId: orderData?.id,
        razorpayOrderId: razorpayOrder?.id,
        amount: razorpayAmountInPaise,
        currency: "INR"
      });

    } catch (error: any) {
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rErr) {}
      }
      console.error("Order creation error:", error);
      return sendResponse(res, 500, false, error?.message || "Internal Server Error", null);
    }
  });







}


export const orderController = new OrderController()