import { GraphQLError } from "graphql";

import { INotificationDocument } from "@app/interfaces/notification.interface";
import logger from "@app/server/logger";
import {
  createNotificationGroup,
  deleteNotificationGroup,
  getAllNotificationGroups,
  updateNotificationGroup,
} from "@app/services/notification.service";

import { authenticateGraphQLRoute } from "@app/utils/utils";
import { AppContext } from "@app/interfaces/monitor.interface";

export const NotificationResolver = {
  Query: {
    async getUserNotificationGroups(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!userId) {
        logger.info(`getUserNotificationGroups() method - Missing user's id.`);
        throw new GraphQLError("Missing required field");
      }

      const notifications: INotificationDocument[] | null =
        await getAllNotificationGroups(parseInt(userId));

      if (!notifications) {
        return {
          notifications: [],
        };
      }

      return { notifications };
    },
  },
  Mutation: {
    async createNotificationGroup(
      _: undefined,
      args: { group: INotificationDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.group) {
        logger.info("createNotificationGroup() method - missing group data");
        throw new GraphQLError("Missing required parameter");
      }

      const notification: INotificationDocument = await createNotificationGroup(
        args.group
      );

      return {
        notifications: [notification],
      };
    },
    async updateNotificationGroup(
      _: undefined,
      args: { notificationId: string; group: INotificationDocument },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.group || !args.notificationId) {
        logger.info("updateNotificationGroup() method - missing required data");
        throw new GraphQLError("Missing required parameter");
      }

      const { notificationId, group } = args;
      await updateNotificationGroup(parseInt(notificationId), group);
      const notification = { ...group, id: parseInt(notificationId) };

      return {
        notifications: [notification],
      };
    },
    async deleteNotificationGroup(
      _: undefined,
      args: { notificationId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.notificationId) {
        logger.info(
          "deleteNotificationGroup() method - missing notificationId"
        );
        throw new GraphQLError("Missing required parameter");
      }

      const { notificationId } = args;
      await deleteNotificationGroup(parseInt(notificationId));

      return {
        id: notificationId,
      };
    },
  },
};
