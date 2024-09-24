import { GraphQLError } from "graphql";
import { toLower } from "lodash";
import { PubSub } from "graphql-subscriptions";

import {
  AppContext,
  IMonitorArgs,
  IMonitorDocument,
} from "@app/interfaces/monitor.interface";
import logger from "@app/server/logger";
import {
  createMonitor,
  deleteSingleMonitor,
  getHeartbeats,
  getMonitorById,
  getUserActiveMonitors,
  getUserMonitors,
  startCreatedMonitors,
  toggleMonitor,
  updateSingleMonitor,
} from "@app/services/monitor.service";

import { getSingleNotificationGroup } from "@app/services/notification.service";
import { startSingleJob, stopSingleBackgroundJob } from "@app/utils/jobs";
import {
  appTimeZone,
  authenticateGraphQLRoute,
  resumeMonitors,
  uptimePercentage,
} from "@app/utils/utils";
import { IHeartbeat } from "@app/interfaces/heartbeat.interface";

export const pubSub: PubSub = new PubSub();

export const MonitorResolver = {
  Query: {
    async getSingleMonitor(
      _: undefined,
      { monitorId }: { monitorId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (!monitorId) {
        logger.info("getSingleMonitor() method - Missing monitorId arguement");
        throw new GraphQLError("Missing required arguement");
      }

      const monitor: IMonitorDocument = await getMonitorById(
        parseInt(monitorId!)
      );

      return {
        monitors: [monitor],
      };
    },
    async getUserMonitors(
      _: undefined,
      { userId }: { userId: string },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);
      if (!userId) {
        logger.info("getUserMonitors() method - Missing userId arguement");
        throw new GraphQLError("Missing required arguement");
      }

      const monitors: IMonitorDocument[] = await getUserMonitors(
        parseInt(userId!)
      );

      return {
        monitors,
      };
    },
    async autoRefresh(
      _: undefined,
      { userId, refresh }: { userId: string; refresh: boolean },
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!userId) {
        logger.info("autoRefresh() method - Missing userId arguement");
        throw new GraphQLError("Missing required arguement");
      }

      if (refresh) {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: true,
        };
        // Start auto refresh cron job
        startSingleJob(
          `${toLower(req.currentUser?.username)}`,
          appTimeZone,
          10,
          async () => {
            const monitors: IMonitorDocument[] = await getUserActiveMonitors(
              parseInt(userId!)
            );
            pubSub.publish("MONITORS_UPDATED", {
              monitorsUpdated: {
                userId: parseInt(userId),
                monitors,
              },
            });
          }
        );
      } else {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: false,
        };
        stopSingleBackgroundJob(`${toLower(req.currentUser?.username)}`);
      }

      return {
        refresh,
      };
    },
  },
  Mutation: {
    async createMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("createMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const body: IMonitorDocument = args.monitor!;
      const monitor: IMonitorDocument = await createMonitor(body);

      // Start the monitor emmediately after its creation
      // if the client's payload is active (body.active)
      if (body.active && monitor?.active) {
        logger.info("Start new monitor");
        startCreatedMonitors(
          monitor,
          toLower(body.name),
          body.type as "http" | "tcp" | "mongodb" | "redis"
        );
      }

      return {
        monitors: [monitor],
      };
    },
    async toggleMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("toggleMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId, name, active } = args.monitor!;
      const results: IMonitorDocument[] = await toggleMonitor(
        monitorId!,
        userId,
        active as boolean
      );

      const hasActiveMonitors: boolean = results.some(
        (monitor: IMonitorDocument) => monitor.active
      );
      /**
       * Stop auto refresh if there are no active monitors for a single user
       * (auto refresh cron job - based on user's name)
       */
      if (!hasActiveMonitors) {
        req.session = {
          ...req.session,
          enableAutomaticRefresh: false,
        };
        stopSingleBackgroundJob(`${toLower(req.currentUser?.username)}`);
      }

      // Stop the monitor's job if it being set to inactive
      if (!active) {
        stopSingleBackgroundJob(name, monitorId!);
      } else {
        logger.info("Resume monitor");
        resumeMonitors(monitorId!);
      }

      return {
        monitors: results,
      };
    },
    async updateMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitor) {
        logger.info("updateMonitor() method - Missing monitor arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId, monitor } = args;
      const monitors: IMonitorDocument[] = await updateSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        monitor
      );

      return {
        monitors,
      };
    },
    async deleteMonitor(
      _: undefined,
      args: IMonitorArgs,
      contextValue: AppContext
    ) {
      const { req } = contextValue;
      authenticateGraphQLRoute(req);

      if (!args.monitorId || !args.type || !args.userId) {
        logger.info("deleteMonitor() method - Missing required arguement");
        throw new GraphQLError("Missing required parameter");
      }

      const { monitorId, userId, type } = args;
      await deleteSingleMonitor(
        parseInt(`${monitorId}`),
        parseInt(`${userId}`),
        type!
      );

      return {
        id: monitorId,
      };
    },
  },
  MonitorResult: {
    lastChanged: (monitor: IMonitorDocument) =>
      JSON.stringify(monitor.lastChanged),
    responseTime: (monitor: IMonitorDocument) => {
      return monitor.responseTime
        ? parseInt(`${monitor.responseTime}`)
        : monitor.responseTime;
    },
    notifications: (monitor: IMonitorDocument) => {
      return getSingleNotificationGroup(monitor.notificationId!);
    },
    heartbeats: async (monitor: IMonitorDocument): Promise<IHeartbeat[]> => {
      const heartbeats = await getHeartbeats(
        monitor.type as "http" | "tcp" | "mongodb" | "redis",
        monitor.id!,
        24
      );

      return heartbeats.slice(0, 16);
    },
    uptime: async (monitor: IMonitorDocument): Promise<number> => {
      const heartbeats = await getHeartbeats(
        monitor.type as "http" | "tcp" | "mongodb" | "redis",
        monitor.id!,
        24
      );
      const uptime: number = uptimePercentage(heartbeats);
      return uptime;
    },
  },
  Subscription: {
    monitorsUpdated: {
      subscribe: () => pubSub.asyncIterator(["MONITORS_UPDATED"]),
    },
  },
};
