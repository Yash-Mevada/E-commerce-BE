import { AllowNull, AutoIncrement, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import User from "./user.model.js";
import Address from "./address.model.js";
import orderItems from "./orderItems.model.js";
import payment from "./payment.model.js";

@Table({
  tableName: "orders",
  timestamps: true
})

class order extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare userId: string

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  declare subtotal: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  declare shipping: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  declare tax: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  })
  declare total: number

  @Column({
    type: DataType.ENUM(
      "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED",
    ),
    allowNull: false,
    defaultValue: "PENDING"
  })
  declare status: string

  @Column({
    type: DataType.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
    allowNull: false,
    defaultValue: "PENDING"
  })
  declare paymentStatus: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true
  })
  declare razorpayOrderId: string | null

  @ForeignKey(() => Address)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare addressId: string

  @BelongsTo(() => User)
  declare user: User

  @BelongsTo(() => Address)
  declare address: Address

  @HasMany(() => orderItems)
  declare items: orderItems

  @HasOne(() => payment)
  declare payment: payment

}


export default order