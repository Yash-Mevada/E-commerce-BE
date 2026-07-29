import type { Optional } from "sequelize";
import { PrimaryKey, Table, Default, Column, AllowNull, Model, DataType, HasMany } from "sequelize-typescript";
import ProductClass from "./product.model.js";

interface Product extends ProductClass { }


export interface categoryAttributes {
  id: string;
  name: string;
  description: string
}


export interface CategoryCreateAttributes extends Optional<categoryAttributes, "id"> { }


@Table({
  tableName: "categories",
  timestamps: true,
  underscored: true
})


export default class Category extends Model<categoryAttributes, CategoryCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  description!: string

  @HasMany(() => ProductClass)
  products!: Product[]

}