import type { Request, Response } from "express"
import Product from "../../model/product.model.js"
import ProductImage from "../../model/productImages.model.js"
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
    const { name, description, price, stock, category_id, image, productImages } = req.body
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

    if (productImages && Array.isArray(productImages)) {
      const imageRecords = productImages.map((img: any) => {
        const image_url = typeof img === "string" ? img : (img.imageUrl || img.image_url || "")
        const public_id = typeof img === "string" ? "" : (img.publicId || img.public_id || "")
        return {
          product_id: product.id,
          image_url,
          public_id
        }
      })
      await ProductImage.bulkCreate(imageRecords)
    }

    const productWithImages = await Product.findByPk(product.id, {
      include: [Category, ProductImage]
    })

    return sendResponse(res, 201, true, "Product created successfully", productWithImages)
  })

  public getAllProducts = asynWrapper(async (req: Request, res: Response) => {
    const { filter, pagination, sort, filterByCategory, filterByDate } = req.body
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = []

    let whereConditions: any = {}
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

    if (filterByCategory) {
      whereConditions.category_id = filterByCategory
    }

    if (filterByDate) {
      const { startDate, endDate } = filterByDate
      if (startDate && endDate) {
        // Set endDate to end of day to include all events on that day
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereConditions.created_at = {
          [Op.between]: [new Date(startDate), end]
        }
      } else if (startDate) {
        whereConditions.created_at = {
          [Op.gte]: new Date(startDate)
        }
      } else if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereConditions.created_at = {
          [Op.lte]: end
        }
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
        },
        {
          model: ProductImage
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
        },
        {
          model: ProductImage
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

    const { name, description, price, stock, category_id, image, productImages } = req.body
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

    if (productImages && Array.isArray(productImages)) {
      await ProductImage.destroy({ where: { product_id: id } })
      const imageRecords = productImages.map((img: any) => {
        const image_url = typeof img === "string" ? img : (img.imageUrl || img.image_url || "")
        const public_id = typeof img === "string" ? "" : (img.publicId || img.public_id || "")
        return {
          product_id: id,
          image_url,
          public_id
        }
      })
      await ProductImage.bulkCreate(imageRecords)
    }

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
      let publicId: string = ""
      if (process.env.UPLOAD_PROVIDER === "cloudinary") {
        const uploadResult = await CloudinaryServices.uploadImageBuffer(file.buffer)
        imageUrl = uploadResult.imageUrl
        publicId = uploadResult.publicId
      } else {
        imageUrl = await LocalUploadServices.uploadImageBuffer(file)
      }
      return sendResponse(res, 200, true, "Image uploaded successfully", { imageUrl, publicId })
    } catch (error: any) {
      console.error("Upload error:", error)
      return sendResponse(res, 500, false, error.message || "Failed to upload image", null)
    }
  })
}



export const productController = new ProductController()