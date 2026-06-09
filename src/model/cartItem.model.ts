
import type { Optional } from "sequelize";
import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";

import ProductClass from "./product.model.js";
import CardClass from "./card.model.js";

interface Product extends ProductClass {}
interface Card extends CardClass {}

interface cartItemAttributes {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface cartItemCreateAttributes extends Optional<cartItemAttributes, "id" | "created_at" | "updated_at"> { }

@Table({
  tableName: "cart_items",
  timestamps: true,
  underscored: true
})
export default class CartItem extends Model<cartItemAttributes, cartItemCreateAttributes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => CardClass)
  @AllowNull(false)
  @Column(DataType.UUID)
  cart_id!: string

  @ForeignKey(() => ProductClass)
  @AllowNull(false)
  @Column(DataType.UUID)
  product_id!: string

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    validate: {
      min: 1
    }
  })
  quantity!: number

  @BelongsTo(() => CardClass)
  cart!: Card

  @BelongsTo(() => ProductClass)
  product!: Product
}