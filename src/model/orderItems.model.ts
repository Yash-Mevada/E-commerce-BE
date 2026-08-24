
import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import order from "./order.model.js";
import Product from "./product.model.js";

@Table({
  tableName: "OrderItems",
  timestamps: true
})

class orderItems extends Model {

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

  @ForeignKey(() => Product)
  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare productId: string

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare ProductName: string

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  declare productImage: string | null

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  declare quantity: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  declare price: number

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false
  })
  declare subtotal: number


  @BelongsTo(() => order)
  declare order: order

  @BelongsTo(() => Product)
  declare product: Product

}

export default orderItems