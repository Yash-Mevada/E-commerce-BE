import type { Request, Response } from "express"
import Product from "../../model/product.model.js"
import { sendResponse } from "../../utils/responseHandler.js"
import Category from "../../model/category.model.js"
import { asynWrapper } from "../../utils/asyncWrapper.js"
import { CloudinaryServices } from "../../services/cloudinary.services.js"
import { LocalUploadServices } from "../../services/local.services.js"



import { Op } from "sequelize"

export interface productRequest extends Request {
  product: Product | any
}



class ProductController {


  public createProductController = asynWrapper(async (req: Request, res: Response) => {
    const { name, description, price, stock, category_id, image } = req.body
    if (!name || !description || !price || !stock || !category_id || !image) {
      return sendResponse(res, 400, false, "Name, description, price, stock, category_id, image are required", null)
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category_id,
      image
    })
    return sendResponse(res, 201, true, "Product created successfully", product)
  })

  public getAllProducts = asynWrapper(async (req: Request, res: Response) => {
    const { filter, pagination, sort } = req.body
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = []

    let whereConditions = {}
    if (filter && filter?.search && filter?.keyword) {
      whereConditions = {
        [Op.or]: filter?.search && filter.search?.map((field: string) => {
          return {
            [field]: {
              [Op.iLike]: `%${filter.keyword}%`
            }
          }
        })
      }
    }

    // SORTING
    if (sort && Object.keys(sort).length > 0) {
      const validColumns = Object.keys(Product.getAttributes());
      const [sortKey, sortValue]: any = Object.entries(sort)[0];
      if (
        validColumns.includes(sortKey) &&
        ["ASC", "DESC"].includes(String(sortValue).toUpperCase())
      ) {
        order = [[sortKey, String(sortValue).toUpperCase()]];
      }
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereConditions,
      attributes: ["id", "name", "description", "price", "stock", "category_id", "image", "created_at", "updated_at"],
      include: [
        {
          model: Category
        }
      ],
      limit: pagination?.limit ? pagination?.limit : undefined,
      offset: pagination?.page ? offset : 0,
      order: order
    })

    return sendResponse(res, 200, true, "All products fetched successfully", rows, null, count)
  })


  public getProductById = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const product = await Product.findByPk(id, {
      attributes: ["id", "name", "description", "price", "stock", "category_id", "image", "created_at", "updated_at"],
      include: [
        {
          model: Category
        }
      ]
    })

    if (!product) {
      return sendResponse(res, 404, false, "Product not found", null)
    }
    return sendResponse(res, 200, true, "Product fetched successfully", product)
  })



  public updateProduct = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const { name, description, price, stock, category_id, image } = req.body
    if (!name || !description || !price || !stock || !category_id || !image) {
      return sendResponse(res, 400, false, "Name, description, price, stock, category_id, image are required", null)
    }


    const updateData: {
      name?: string,
      description?: string,
      price?: number,
      stock?: number,
      category_id?: string,
      image?: string
    } = {}
    if (name) updateData.name = name
    if (description) updateData.description = description
    if (price) updateData.price = price
    if (stock) updateData.stock = stock
    if (category_id) updateData.category_id = category_id as string
    if (image) updateData.image = image as string

    const product = await Product.findByPk(id)
    if (!product) {
      return sendResponse(res, 404, false, "Product not found", null)
    }
    await product.update(updateData)
    return sendResponse(res, 200, true, "Product updated successfully", null)
  })


  public deleteProduct = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const product = await Product.findByPk(id)
    if (!product) {
      return sendResponse(res, 404, false, "Product not found", null)
    }
    await product.destroy()
    return sendResponse(res, 200, true, "Product deleted successfully", null)
  })

  public uploadProductImage = asynWrapper(async (req: Request, res: Response) => {
    const file = req.file
    if (!file) {
      return sendResponse(res, 400, false, "No image file provided", null)
    }

    try {
      let imageUrl: string
      if (process.env.UPLOAD_PROVIDER === "cloudinary") {
        imageUrl = await CloudinaryServices.uploadImageBuffer(file.buffer)
      } else {
        imageUrl = await LocalUploadServices.uploadImageBuffer(file)
      }
      return sendResponse(res, 200, true, "Image uploaded successfully", { imageUrl })
    } catch (error: any) {
      console.error("Upload error:", error)
      return sendResponse(res, 500, false, error.message || "Failed to upload image", null)
    }
  })
}



export const productController = new ProductController()