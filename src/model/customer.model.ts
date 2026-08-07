import type { Optional } from "sequelize";
import { PrimaryKey, Table, Default, Column, AllowNull, Model, DataType } from "sequelize-typescript";

export interface customerAttributes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  status: string; // e.g. "active" | "inactive"
  cognito_sub?: string;
  access_token?: string;
  refresh_token?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerCreateAttributes extends Optional<customerAttributes, "id" | "status" | "createdAt" | "updatedAt" | "cognito_sub" | "access_token" | "refresh_token"> { }

@Table({
  tableName: "customers",
  timestamps: true,
  underscored: true
})
export default class Customer extends Model<customerAttributes, CustomerCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  first_name!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  last_name!: string

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true
  })
  email!: string

  @Column(DataType.STRING)
  phone_number!: string

  @Column(DataType.STRING)
  address!: string

  @Default("active")
  @Column(DataType.STRING)
  status!: string

  @Column(DataType.STRING)
  cognito_sub!: string

  @Column(DataType.TEXT)
  access_token!: string

  @Column(DataType.TEXT)
  refresh_token!: string

}
