import type { Request, Response } from "express"
import Product from "../../model/product.model.js"
import { sendResponse } from "../../utils/responseHandler.js"
import Category from "../../model/category.model.js"
import { asynWrapper } from "../../utils/asyncWrapper.js"



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

    const products = await Product.findAll({
      attributes: ["id", "name", "description", "price", "stock", "image", "created_at", "updated_at"],
      include: [
        {
          model: Category
        }
      ]
    })
    return sendResponse(res, 200, true, "All products fetched successfully", products)
  })


  public getProductById = asynWrapper(async (req: Request, res: Response) => {
    const id = req.params.id as string

    const product = await Product.findByPk(id, {
      attributes: ["id", "name", "description", "price", "stock", "image", "created_at", "updated_at"],
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




}



export const productController = new ProductController()