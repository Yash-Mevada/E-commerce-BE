import type { Optional } from "sequelize";
import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import UserClass from "./user.model.js";
import CartItemClass from "./cartItem.model.js";

interface User extends UserClass { }
interface CartItem extends CartItemClass { }

interface cardAttributes {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface cardCreateAttributes extends Optional<cardAttributes, "id" | "created_at" | "updated_at"> { }

@Table({
  tableName: "carts",
  timestamps: true,
  underscored: true
})
export default class Cart extends Model<cardAttributes, cardCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => UserClass)
  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    unique: true
  })
  user_id!: string

  @BelongsTo(() => UserClass)
  user!: User

  @HasMany(() => CartItemClass)
  cartItems!: CartItem[]

}