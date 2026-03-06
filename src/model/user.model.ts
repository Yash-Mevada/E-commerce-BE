




import type { Optional } from "sequelize";
import { AllowNull, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";



export interface UserAttributes {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateAttributes extends Optional<UserAttributes, "id" | "createdAt" | "updatedAt" | "role"> { }


@Table({
  tableName: "users",
  timestamps: true,
  underscored: true
})
export default class User extends Model<UserAttributes, UserCreateAttributes> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  first_name!: string

  @Column(DataType.STRING)
  last_name!: string

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string

  @Column(DataType.STRING)
  phone_number!: string

  @AllowNull(false)
  @Column(DataType.STRING)
  password!: string

  @Default("user")
  @Column(DataType.STRING)
  role!: string

  @Column(DataType.TEXT)
  refresh_token!: string

  @Column(DataType.TEXT)
  fcm_token!: string

}


