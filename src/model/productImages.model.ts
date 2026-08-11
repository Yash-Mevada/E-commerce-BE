import type { Optional } from "sequelize";
import { AllowNull, Column, DataType, Default, ForeignKey, BelongsTo, Model, PrimaryKey, Table } from "sequelize-typescript";
import ProductClass from "./product.model.js";

interface Product extends ProductClass { }

export interface ProductImageAttributes {
  id: string;
  product_id: string;
  image_url: string;
  public_id?: string;
}

export interface ProductImageCreateAttributes extends Optional<ProductImageAttributes, "id"> { }

@Table({
  tableName: "product_images",
  timestamps: true,
  underscored: true
})
export default class ProductImage extends Model<ProductImageAttributes, ProductImageCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => ProductClass)
  @AllowNull(false)
  @Column(DataType.UUID)
  product_id!: string

  @BelongsTo(() => ProductClass)
  product!: Product

  @AllowNull(false)
  @Column(DataType.STRING)
  image_url!: string

  @Column(DataType.STRING)
  public_id!: string

}