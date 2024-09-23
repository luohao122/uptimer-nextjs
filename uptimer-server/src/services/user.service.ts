import { Model, Op } from "sequelize";
import { omit, toLower, upperFirst } from "lodash";

import { IUserDocument } from "@app/interfaces/user.interface";
import { UserModel } from "@app/models/user.model";

export async function createNewUser(
  data: IUserDocument
): Promise<IUserDocument> {
  try {
    const result: Model = await UserModel.create(data);
    const userData: IUserDocument = omit(result.dataValues, [
      "password",
    ]) as IUserDocument;

    return userData;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserByUsernameOrEmail(
  username: string,
  email: string
): Promise<IUserDocument | null> {
  try {
    const user: IUserDocument | null = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          { username: upperFirst(username) },
          { email: toLower(email) },
        ],
      },
    })) as IUserDocument | null;

    return user;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserBySocialId(
  socialId: string,
  email: string,
  type: "facebook" | "google"
): Promise<IUserDocument | null> {
  try {
    const user: IUserDocument | null = (await UserModel.findOne({
      raw: true,
      where: {
        [Op.or]: [
          {
            ...(type === "facebook" && {
              facebookId: socialId,
            }),
            ...(type === "google" && {
              googleId: socialId,
            }),
          },
          { email: toLower(email) },
        ],
      },
    })) as IUserDocument | null;

    if (!user) {
      throw new Error(`getUserBySocialId() method - User not found`);
    }

    return user;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getUserByProp(
  prop: string,
  type: "username" | "email"
): Promise<IUserDocument | null> {
  try {
    const user: IUserDocument | null = (await UserModel.findOne({
      raw: true,
      where: {
        ...(type === "username" && {
          username: upperFirst(prop),
        }),
        ...(type === "email" && {
          email: toLower(prop),
        }),
      },
    })) as IUserDocument | null;

    if (!user) {
      throw new Error(`getUserByProp() method - User not found`);
    }

    return user;
  } catch (error) {
    throw new Error(error);
  }
}
