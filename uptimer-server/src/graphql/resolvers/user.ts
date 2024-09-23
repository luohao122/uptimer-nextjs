import { GraphQLError } from "graphql";
import { toLower, upperFirst } from "lodash";
import { sign } from "jsonwebtoken";

import { Request } from "express";

import { INotificationDocument } from "@app/interfaces/notification.interface";
import { IUserDocument, IUserResponse } from "@app/interfaces/user.interface";
import { DEFAULT_GROUP, JWT_TOKEN } from "@app/server/config";

import {
  createNotificationGroup,
  getAllNotificationGroups,
} from "@app/services/notification.service";
import {
  createNewUser,
  getUserByProp,
  getUserBySocialId,
  getUserByUsernameOrEmail,
} from "@app/services/user.service";

import { authenticateGraphQLRoute, isEmail } from "@app/utils/utils";
import { UserModel } from "@app/models/user.model";
import { UserLoginRules, UserRegisterationRules } from "@app/validations";

import logger from "@app/server/logger";
import { AppContext } from "@app/interfaces/monitor.interface";

export const UserResolver = {
  Query: {
    async checkCurrentUser(
      _: undefined,
      __: undefined,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!req.currentUser) {
        logger.info("checkCurrentUser() method - Missing current user.");
        throw new GraphQLError("Please login again.");
      }

      const notifications = await getAllNotificationGroups(req.currentUser.id);

      return {
        user: {
          id: req.currentUser?.id,
          username: req.currentUser?.username,
          email: req.currentUser?.email,
        },
        notifications,
      };
    },
  },
  Mutation: {
    async loginUser(
      _: undefined,
      args: { username: string; password: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { username, password } = args;

      // Validate data coming from client side
      await UserLoginRules.validate(
        { username, password },
        { abortEarly: false }
      );

      const isValidEmail = isEmail(username);
      const propName = !isValidEmail ? "username" : "email";

      const existingUser: IUserDocument | null = await getUserByProp(
        username,
        propName
      );
      if (!existingUser) {
        logger.info(`loginUser() method - User does not exist`);
        throw new GraphQLError("Invalid credentials");
      }

      const passwordMatch: boolean = await UserModel.prototype.comparePassword(
        password,
        existingUser.password!
      );
      if (!passwordMatch) {
        logger.info("loginUser() method - Incorrect Password");
        throw new GraphQLError("Invalid credentials");
      }

      const response: IUserResponse = await userReturnValue(
        req,
        existingUser,
        "login"
      );

      return response;
    },
    async registerUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;

      await UserRegisterationRules.validate(user, { abortEarly: false });

      const { username, email, password } = user;
      if (!username || !email) {
        logger.info(`registerUser() method - Missing username or email`);
        throw new GraphQLError("Missing required field");
      }

      const isUserExisted: IUserDocument | null =
        await getUserByUsernameOrEmail(username, email);
      if (isUserExisted) {
        logger.info('registerUser() method - User already exists')
        throw new GraphQLError("Invalid credentials. Email or username.");
      }

      const authData: IUserDocument = {
        username: upperFirst(username),
        email: toLower(email),
        password,
      } as IUserDocument;
      const result: IUserDocument | null = await createNewUser(authData);

      const response: IUserResponse = await userReturnValue(
        req,
        result,
        "register"
      );

      return response;
    },
    async authSocialUser(
      _: undefined,
      args: { user: IUserDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      const { user } = args;

      await UserRegisterationRules.validate(user, { abortEarly: false });

      const { username, email, socialId, type } = user;

      const existingUser: IUserDocument | null = await getUserBySocialId(
        socialId!,
        email!,
        type!
      );
      if (existingUser) {
        const response: IUserResponse = await userReturnValue(
          req,
          existingUser,
          "login"
        );
        return response;
      } else {
        const authData: IUserDocument = {
          username: upperFirst(username),
          email: toLower(email),
          ...(type === "facebook" && {
            facebookId: socialId,
          }),
          ...(type === "google" && {
            googleId: socialId,
          }),
        } as IUserDocument;
        const result: IUserDocument | null = await createNewUser(authData);

        const response: IUserResponse = await userReturnValue(
          req,
          result,
          "register"
        );

        return response;
      }
    },
    logout(_: undefined, __: undefined, contextValue: AppContext) {
      const { req } = contextValue;
      req.session = null;
      req.currentUser = undefined;
      return null;
    },
  },
  User: {
    createdAt: (user: IUserDocument) => {
      return new Date(`${user.createdAt}`).toISOString();
    },
  },
};

async function userReturnValue(
  req: Request,
  result: IUserDocument,
  type: "register" | "login"
): Promise<IUserResponse> {
  let notifications: INotificationDocument[] = [];
  // When user register for an account, assign them
  // to the default group
  if (type === "register" && result && result.id && result.email) {
    const notification = await createNotificationGroup({
      userId: result.id,
      groupName: DEFAULT_GROUP,
      emails: JSON.stringify([result.email]),
    });
    notifications.push(notification);
  } else if (result && result.id && result.email) {
    // When user logged in to their account
    const notilist = await getAllNotificationGroups(result.id);
    if (notilist) {
      notifications = notilist;
    }
  }

  const userJwt: string = sign(
    {
      id: result.id,
      email: result.email,
      username: result.username,
    },
    JWT_TOKEN
  );

  req.session = { jwt: userJwt, enableAutomaticRefresh: false };

  const user: IUserDocument = {
    id: result.id,
    email: result.email,
    username: result.username,
    createdAt: result.createdAt,
  } as IUserDocument;

  return {
    user,
    notifications,
  };
}
