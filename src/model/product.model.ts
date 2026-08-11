import type { Optional } from "sequelize";
import { AllowNull, Column, DataType, Default, Model, PrimaryKey, Table, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import CategoryClass from "./category.model.js";
import CartItem from "./cartItem.model.js";
import ProductImageClass from "./productImages.model.js";

interface Category extends CategoryClass { }
interface ProductImage extends ProductImageClass { }




interface productAttributes {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  image: string;
  created_at: Date;
  updated_at: Date;
}


export interface ProductCreateAttributes extends Optional<productAttributes, "id" | "created_at" | "updated_at"> { }


@Table({
  tableName: "products",
  timestamps: true,
  underscored: true
})


export default class Product extends Model<productAttributes, ProductCreateAttributes> {

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


  @AllowNull(false)
  @Column(DataType.DECIMAL)
  price!: number

  @AllowNull(false)
  @Column(DataType.INTEGER)
  stock!: number

  @ForeignKey(() => CategoryClass)
  @AllowNull(false)
  @Column(DataType.UUID)
  category_id!: string

  @BelongsTo(() => CategoryClass)
  category!: Category

  @AllowNull(false)
  @Column(DataType.STRING)
  image!: string

  @HasMany(() => CartItem)
  cartItems!: CartItem[]

  @HasMany(() => ProductImageClass)
  productImages!: ProductImage[]

}