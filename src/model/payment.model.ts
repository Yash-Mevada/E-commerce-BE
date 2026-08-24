import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import order from "./order.model.js";

@Table({
  tableName: "payments",
  timestamps: true
})

class payment extends Model {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string

  @ForeignKey(() => order)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare orderId: string


  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare razorpayOrderId: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true
  })
  declare razorpayPaymentId: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare razorPaySignature: string | null

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  declare amount: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "INR"
  })
  declare currency: string


  @Column({
    type: DataType.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
    allowNull: false,
    defaultValue: "PENDING"
  })
  declare status: string


  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare method: string | null


  @BelongsTo(() => order)
  declare order: order

}

export default payment