import type { Request, Response } from "express"
import Category from "../../model/category.model.js"
import { asynWrapper } from "../../utils/asyncWrapper.js"
import { sendResponse } from "../../utils/responseHandler.js"
import Product from "../../model/product.model.js"
import { Op } from "sequelize"

export interface CategoryRequest extends Request {
  category: Category | any
}

class CategoryController {

  public createCategory = asynWrapper(async (req: Request, res: Response) => {
    const { name, description } = req.body
    if (!name || !description) {
      return sendResponse(res, 400, false, "Name and description are required", null)
    }

    const category = await Category.create({
      name,
      description
    })

    return sendResponse(res, 201, true, "Category created successfully", category)
  })


  public getAllCategories = asynWrapper(async (req: Request, res: Response) => {

    const { filter, pagination, sort } = req.body
    const page = Number(pagination?.page) || 1;
    const limit = Number(pagination?.limit) || 10;
    const offset = (page - 1) * limit;
    let order: any = []

    let whereConditions = {}
    if (filter && filter?.search && filter?.keyword) {
      whereConditions =
      {
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

      const validColumns = Object.keys(Category.getAttributes());

      const [sortKey, sortValue]: any = Object.entries(sort)[0];
      if (
        validColumns.includes(sortKey) &&
        ["ASC", "DESC"].includes(String(sortValue).toUpperCase())
      ) {
        order = [[sortKey, String(sortValue).toUpperCase()]];
      }
    }
    // const categories = await Category.findAll({
    //   attributes: ["id", "name", "description", "created_at", "updated_at"],
    //   include: [
    //     {
    //       model: Product
    //     }
    //   ]
    // })


    const { count, rows } = await Category.findAndCountAll(
      {
        where: whereConditions,
        attributes: ["id", "name", "description", "created_at", "updated_at"],
        include: [
          {
            model: Product
          }
        ],
        limit: pagination?.limit ? pagination?.limit : undefined,
        offset: pagination?.page ? offset : 0,
        order: order

      }
    )
    // return sendResponse(res, 200, true, "All categories fetched successfully", categories)
    return sendResponse(res, 200, true, "All categories fetched successfully", rows, null, count)
  })


  public getCategoryById = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params
    const category = await Category.findByPk(id as string, {
      attributes: ["id", "name", "description", "created_at", "updated_at"],
      include: [
        {
          model: Product
        }
      ]
    })
    return sendResponse(res, 200, true, "Category fetched successfully", category)
  })


  public updateCategory = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params
    const { name, description } = req.body

    const updateData: {
      name?: string,
      description?: string
    } = {}
    if (name) updateData.name = name
    if (description) updateData.description = description
    const category = await Category.update({
      name,
      description
    }, {
      where: {
        id
      }
    })
    return sendResponse(res, 200, true, "Category updated successfully", null)
  })

  public deleteCategory = asynWrapper(async (req: Request, res: Response) => {
    const { id } = req.params
    const category = await Category.findByPk(id as string)
    if (!category) {
      return sendResponse(res, 404, false, "Category not found", null)
    }
    await category.destroy()
    return sendResponse(res, 200, true, "Category deleted successfully", null)
  })

}


export const categoryController = new CategoryController()