import type { Optional } from "sequelize";
import { AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import UserClass from "./user.model.js";

interface User extends UserClass { }

interface addressAttributes {
  id: string;
  user_id: string;
  full_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone_number: string;
  country: string;
  created_at: Date;
  updated_at: Date;
}


export interface addressCreateAttributes extends Optional<addressAttributes, "id" | "created_at" | "updated_at"> { }


@Table({
  tableName: "addresses",
  timestamps: true,
  underscored: true
})


export default class Address extends Model<addressAttributes, addressCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @ForeignKey(() => UserClass)
  @Column(DataType.UUID)
  user_id!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  full_name!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  address!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  city!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  pincode!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  phone_number!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  country!: string



  // BelongsTo
  @BelongsTo(() => UserClass)
  user!: User


}