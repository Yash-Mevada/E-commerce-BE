import type { Request, Response } from "express";
import Customer from "../../model/customer.model.js";
import { Op } from "sequelize";
import { sendResponse } from "../../utils/responseHandler.js";
import { asynWrapper } from "../../utils/asyncWrapper.js";
import { CognitoServices } from "../../services/cognito.services.js";
import crypto from "crypto";

class CustomerController {

  public getAllCustomers = asynWrapper(async (req: Request, res: Response) => {
    const { filter, pagination, sort } = req.body;
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = [];

    let whereConditions: any = {};
    if (filter && filter?.search && filter?.keyword) {
      whereConditions = {
        [Op.or]: filter?.search && filter.search?.map((field: string) => {
          return {
            [field]: {
              [Op.iLike]: `%${filter.keyword}%`
            }
          };
        })
      };
    }

    // SORTING
    if (sort && Object.keys(sort).length > 0) {
      const validColumns = Object.keys(Customer.getAttributes());
      const [sortKey, sortValue]: any = Object.entries(sort)[0];
      if (
        validColumns.includes(sortKey) &&
        ["ASC", "DESC"].includes(String(sortValue).toUpperCase())
      ) {
        order = [[sortKey, String(sortValue).toUpperCase()]];
      }
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereConditions,
      limit: pagination?.limit ? pagination?.limit : undefined,
      offset: pagination?.page ? offset : 0,
      order: order
    });

    return sendResponse(res, 200, true, "Customers fetched successfully", rows, null, count);
  });

  public getCustomerById = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, 400, false, "Customer id is required", null);
    }
    const customer = await Customer.findByPk(id as string);
    if (!customer) {
      return sendResponse(res, 404, false, "Customer not found", null);
    }
    return sendResponse(res, 200, true, "Customer fetched successfully", customer);
  });

  public createCustomer = asynWrapper(async (req: Request, res: Response) => {
    const { first_name, last_name, email, phone_number, address, status } = req.body;
    if (!first_name || !last_name || !email) {
      return sendResponse(res, 400, false, "First name, last name, and email are required", null);
    }

    // Check if email already exists
    const existingCustomer = await Customer.findOne({ where: { email } });
    if (existingCustomer) {
      return sendResponse(res, 400, false, "Customer email already exists", null);
    }

    const customerPoolId = process.env.COGNITO_CUSTOMER_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID!;
    // Generate a random password for the cognito account since admin is adding them
    const randomPassword = crypto.randomBytes(12).toString("hex") + "aA1!";

    const cognitoUser = await CognitoServices.createUser({
      email,
      password: randomPassword,
      phone_number: phone_number || "+10000000000",
      first_name,
      last_name
    }, customerPoolId);

    try {
      const customer = await Customer.create({
        first_name,
        last_name,
        email,
        phone_number,
        address,
        status: status || "active",
        cognito_sub: cognitoUser.cognitoSub
      });

      return sendResponse(res, 201, true, "Customer created successfully", customer);
    } catch (error) {
      try {
        await CognitoServices.deleteUser(email, customerPoolId);
      } catch (rollbackError) {
        console.error("Failed to delete Cognito customer during rollback:", rollbackError);
      }
      throw error;
    }
  });

  public updateCustomer = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { first_name, last_name, email, phone_number, address, status, cognito_sub, access_token, refresh_token } = req.body;
    if (!id) {
      return sendResponse(res, 400, false, "Customer id is required", null);
    }

    const customer = await Customer.findByPk(id as string);
    if (!customer) {
      return sendResponse(res, 404, false, "Customer not found", null);
    }

    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({ where: { email } });
      if (existingCustomer) {
        return sendResponse(res, 400, false, "Customer email already exists", null);
      }
    }

    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone_number !== undefined) updateData.phone_number = phone_number;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;
    if (cognito_sub !== undefined) updateData.cognito_sub = cognito_sub;
    if (access_token !== undefined) updateData.access_token = access_token;
    if (refresh_token !== undefined) updateData.refresh_token = refresh_token;

    await customer.update(updateData);
    return sendResponse(res, 200, true, "Customer updated successfully", customer);
  });

  public deleteCustomer = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      return sendResponse(res, 400, false, "Customer id is required", null);
    }

    const customer = await Customer.findByPk(id as string);
    if (!customer) {
      return sendResponse(res, 404, false, "Customer not found", null);
    }

    const customerPoolId = process.env.COGNITO_CUSTOMER_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID!;
    try {
      await CognitoServices.deleteUser(customer.email, customerPoolId);
    } catch (cognitoError) {
      console.error("Failed to delete Customer from Cognito pool:", cognitoError);
    }

    await customer.destroy();
    return sendResponse(res, 200, true, "Customer deleted successfully", null);
  });

  public registerCustomer = asynWrapper(async (req: Request, res: Response) => {
    const { first_name, last_name, email, password, phone_number, address } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return sendResponse(res, 400, false, "First name, last name, email, and password are required", null);
    }

    // Check if customer already exists in DB
    const existingCustomer = await Customer.findOne({ where: { email } });
    if (existingCustomer) {
      return sendResponse(res, 400, false, "Customer already exists with this email", null);
    }

    const customerPoolId = process.env.COGNITO_CUSTOMER_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID!;

    const cognitoUser = await CognitoServices.createUser({
      email,
      password,
      phone_number: phone_number || "+10000000000",
      first_name,
      last_name
    }, customerPoolId);

    try {
      const customer = await Customer.create({
        first_name,
        last_name,
        email,
        phone_number,
        address,
        status: "active",
        cognito_sub: cognitoUser.cognitoSub
      });

      return sendResponse(res, 201, true, "Customer registered successfully", customer);
    } catch (error) {
      try {
        await CognitoServices.deleteUser(email, customerPoolId);
      } catch (rollbackError) {
        console.error("Failed to delete Cognito customer during rollback:", rollbackError);
      }
      throw error;
    }
  });

  public loginCustomer = asynWrapper(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return sendResponse(res, 400, false, "Email and password are required", null);
    }

    const customer = await Customer.findOne({ where: { email } });
    if (!customer) {
      return sendResponse(res, 401, false, "Customer not found", null);
    }

    const customerClientId = process.env.COGNITO_CUSTOMER_CLIENT_ID || process.env.COGNITO_CLIENT_ID!;
    const customerClientSecret = process.env.COGNITO_CUSTOMER_CLIENT_SECRET || process.env.COGNITO_CLIENT_SECRET;

    let refresh_token: string | undefined;
    let access_token: string | undefined;
    let id_token: string | undefined;
    let expires_in: number | undefined;

    try {
      const authResult = await CognitoServices.loginUser(
        { email, password },
        customerClientId,
        customerClientSecret
      );
      if (!authResult) {
        return sendResponse(res, 401, false, "Invalid credentials", null);
      }

      refresh_token = authResult.RefreshToken;
      access_token = authResult.AccessToken;
      id_token = authResult.IdToken;
      expires_in = authResult.ExpiresIn;
    } catch (cognitoError: any) {
      console.error("Customer Cognito login error:", cognitoError);
      if (cognitoError.name === "NotAuthorizedException" || cognitoError.name === "UserNotFoundException") {
        return sendResponse(res, 401, false, "Invalid credentials", null);
      }
      return sendResponse(res, 500, false, "Authentication failed", null);
    }

    // Update tokens in DB
    customer.access_token = access_token || "";
    if (refresh_token) {
      customer.refresh_token = refresh_token;
    }
    await customer.save();

    return sendResponse(res, 200, true, `Welcome back ${customer.first_name}`, {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone_number: customer.phone_number,
      address: customer.address,
      status: customer.status,
      cognito_sub: customer.cognito_sub,
      access_token,
      id_token
    }, {
      name: "customer_token",
      value: refresh_token || "",
      options: {
        secure: true,
        httpOnly: true,
        maxAge: (expires_in || 3600) * 1000,
        sameSite: "strict"
      }
    });
  });
}

export const customerController = new CustomerController();
