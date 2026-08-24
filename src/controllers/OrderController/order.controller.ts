import type { Request, Response } from "express";
import { Op } from "sequelize";
import { asynWrapper } from "../../utils/asyncWrapper.js";
import { sendResponse } from "../../utils/responseHandler.js";
import { sequelize } from "../../Database/db.js";
import Cart from "../../model/card.model.js";
import CartItem from "../../model/cartItem.model.js";
import Product from "../../model/product.model.js";
import User from "../../model/user.model.js";
import Address from "../../model/address.model.js";

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

  public getAllOrders = asynWrapper(async (req: Request, res: Response) => {
    const { filter, pagination, sort, filterByStatus, filterByPaymentStatus, filterByDate } = req.body;
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;

    let orderSorting: any = [["createdAt", "DESC"]];

    let whereConditions: any = {};

    if (filter && filter?.keyword && filter.keyword.trim() !== "") {
      const kw = filter.keyword.trim();
      whereConditions[Op.or] = [
        sequelize.where(sequelize.cast(sequelize.col("order.id"), "varchar"), { [Op.iLike]: `%${kw}%` }),
        { razorpayOrderId: { [Op.iLike]: `%${kw}%` } },
        { '$user.first_name$': { [Op.iLike]: `%${kw}%` } },
        { '$user.last_name$': { [Op.iLike]: `%${kw}%` } },
        { '$user.email$': { [Op.iLike]: `%${kw}%` } },
      ];
    }

    if (filterByStatus) {
      whereConditions.status = filterByStatus;
    }

    if (filterByPaymentStatus) {
      whereConditions.paymentStatus = filterByPaymentStatus;
    }

    if (filterByDate) {
      const { startDate, endDate } = filterByDate;
      if (startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereConditions.createdAt = {
          [Op.between]: [new Date(startDate), end]
        };
      } else if (startDate) {
        whereConditions.createdAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereConditions.createdAt = {
          [Op.lte]: end
        };
      }
    }

    // SORTING
    if (sort && Object.keys(sort).length > 0) {
      const validColumns = Object.keys(order.getAttributes());
      const [sortKey, sortValue]: any = Object.entries(sort)[0];
      if (
        validColumns.includes(sortKey) &&
        ["ASC", "DESC"].includes(String(sortValue).toUpperCase())
      ) {
        orderSorting = [[sortKey, String(sortValue).toUpperCase()]];
      }
    }

    const queryOptions: any = {
      where: whereConditions,
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name", "email", "phone_number"]
        },
        {
          model: Address
        },
        {
          model: orderItems,
          include: [
            {
              model: Product
            }
          ]
        },
        {
          model: payment
        }
      ],
      offset: pagination?.page ? offset : 0,
      order: orderSorting,
      distinct: true
    };

    if (pagination?.limit) {
      queryOptions.limit = limit;
    }

    const { count, rows } = await order.findAndCountAll(queryOptions);

    return sendResponse(res, 200, true, "All orders fetched successfully", rows, null, count);
  });

  public getOrderById = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const orderData = await order.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name", "email", "phone_number"]
        },
        {
          model: Address
        },
        {
          model: orderItems,
          include: [
            {
              model: Product
            }
          ]
        },
        {
          model: payment
        }
      ]
    });

    if (!orderData) {
      return sendResponse(res, 404, false, "Order not found", null);
    }
    return sendResponse(res, 200, true, "Order fetched successfully", orderData);
  });

  public updateOrderStatus = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status, paymentStatus } = req.body;

    const orderData = await order.findByPk(id);
    if (!orderData) {
      return sendResponse(res, 404, false, "Order not found", null);
    }

    const updateData: { status?: string; paymentStatus?: string } = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    await orderData.update(updateData);

    if (paymentStatus) {
      await payment.update(
        { status: paymentStatus },
        { where: { orderId: id } }
      );
    }

    const updatedOrder = await order.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "first_name", "last_name", "email", "phone_number"]
        },
        {
          model: Address
        },
        {
          model: orderItems
        },
        {
          model: payment
        }
      ]
    });

    return sendResponse(res, 200, true, "Order status updated successfully", updatedOrder);
  });

  public deleteOrder = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const orderData = await order.findByPk(id);
    if (!orderData) {
      return sendResponse(res, 404, false, "Order not found", null);
    }
    await orderData.destroy();
    return sendResponse(res, 200, true, "Order deleted successfully", null);
  });

}

export const orderController = new OrderController()
