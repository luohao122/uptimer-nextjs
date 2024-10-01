import { GraphQLError } from "graphql";
import { toLower } from "lodash";

import { AppContext } from "@app/interfaces/monitor.interface";
import logger from "@app/server/logger";
import { getSingleNotificationGroup } from "@app/services/notification.service";

import { stopSingleBackgroundJob } from "@app/utils/jobs";
import { authenticateGraphQLRoute, resumeSSLMonitors } from "@app/utils/utils";
import {
  ISSLMonitorArgs,
  ISSLMonitorDocument,
} from "@app/interfaces/ssl.interface";

import {
  createSSLMonitor,
  deleteSingleSSLMonitor,
  getSSLMonitorById,
  getUserSSLMonitors,
  sslStatusMonitor,
  toggleSSLMonitor,
  updateSingleSSLMonitor,
} from "@app/services/ssl.service";

export const SSLMonitorResolver = {
  Query: {
    async getSingleSSLMonitor(
      _: undefined,
      { monitorId }: { monitorId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (!monitorId) {
        logger.info(
          "getSingleSSLMonitor() method - Missing monitorId arguement"
        );
        throw new GraphQLError("Missing required arguement");
      }

      const monitor: ISSLMonitorDocument = await getSSLMonitorById(
        parseInt(monitorId!)
      );

      return {
        sslMonitors: [monitor],
      };
    },
    async getUserSSLMonitors(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (!userId) {
        logger.info("getUserSSLMonitor() method - Missing userId arguement");
        throw new GraphQLError("Missing required arguement");
      }

      const monitors: ISSLMonitorDocument[] = await getUserSSLMonitors(
        parseInt(userId!)
      );

      return {
        sslMonitors: monitors,
      };
    },
  },
  Mutation: {
    async createSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("createSSLMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const body: ISSLMonitorDocument = args.monitor!;
      const monitor: ISSLMonitorDocument = await createSSLMonitor(body);

      // Start the monitor emmediately after its creation
      // if the client's payload is active (body.active)
      if (body.active && monitor?.active) {
        logger.info("Start new SSL monitor");
        sslStatusMonitor(monitor, toLower(body.name));
      }

      return {
        sslMonitors: [monitor],
      };
    },
    async toggleSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("toggleSSLMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId, name, active } = args.monitor!;
      const results: ISSLMonitorDocument[] = await toggleSSLMonitor(
        monitorId!,
        userId,
        active as boolean
      );

      // Stop the monitor's job if it being set to inactive
      if (!active) {
        stopSingleBackgroundJob(name, monitorId!);
      } else {
        logger.info("Resume SSL monitor");
        resumeSSLMonitors(monitorId!);
      }

      return {
        sslMonitors: results,
      };
    },
    async updateSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("updateSSLMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId, monitor } = args;
      const monitors: ISSLMonitorDocument[] = await updateSingleSSLMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        monitor
      );

      return {
        sslMonitors: monitors,
      };
    },
    async deleteSSLMonitor(
      _: undefined,
      args: ISSLMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitorId || !args.userId) {
        logger.info("deleteSSLMonitor() method - Missing required arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId } = args;
      await deleteSingleSSLMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`)
      );

      return {
        id: parseInt(monitorId!),
      };
    },
  },
  SSLMonitorResult: {
    notifications: (monitor: ISSLMonitorDocument) => {
      return getSingleNotificationGroup(monitor.notificationId!);
    },
  },
};
