import { Model, Op } from "sequelize";

import { IMonitorDocument } from "@app/interfaces/monitor.interface";
import { MonitorModel } from "@app/models/monitor.model";
import { getSingleNotificationGroup } from "./notification.service";

import { INotificationDocument } from "@app/interfaces/notification.interface";
import dayjs from "dayjs";
import { getHttpHeartBeatsByDuration, httpStatusMonitor } from "./http.service";
import { toLower } from "lodash";
import { IHeartbeat } from "@app/interfaces/heartbeat.interface";

const HTTP_TYPE = "http";
const TCP_TYPE = "tcp";
const MONGO_TYPE = "mongodb";
const REDIS_TYPE = "redis";

/**
 * Create a monitor
 * @param data
 * @returns {Promise<IMonitorDocument>}
 */
export const createMonitor = async (
  data: IMonitorDocument
): Promise<IMonitorDocument> => {
  try {
    const result: Model = await MonitorModel.create(data);
    return result.dataValues;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get all monitors for a given user
 * @param userId
 * @param active
 * @returns {Promise<IMonitorDocument[]>}
 */
export const getUserMonitors = async (
  userId: number,
  active?: boolean
): Promise<IMonitorDocument[]> => {
  try {
    const monitors: IMonitorDocument[] = (await MonitorModel.findAll({
      raw: true,
      where: {
        [Op.and]: [
          {
            userId,
            ...(active && {
              active: true,
            }),
          },
        ],
      },
      order: [["createdAt", "DESC"]],
    })) as unknown as IMonitorDocument[];

    return monitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get active monitors only for a given user
 * @param userId
 * @returns {Promise<IMonitorDocument[]>}
 */
export const getUserActiveMonitors = async (
  userId: number
): Promise<IMonitorDocument[]> => {
  try {
    let heartbeats: IHeartbeat[] = [];
    const updatedMonitors: IMonitorDocument[] = [];
    const monitors: IMonitorDocument[] = await getUserMonitors(userId, true);
    for (let monitor of monitors) {
      const group: INotificationDocument = (await getSingleNotificationGroup(
        monitor.monitorId!
      )) as INotificationDocument;
      heartbeats = await getHeartbeats(
        monitor.type as "http" | "tcp" | "mongodb" | "redis",
        monitor.id!,
        24
      );
      monitor = {
        ...monitor,
        uptime: 0,
        heartbeats: heartbeats.slice(0, 16),
        notifications: group,
      };
      updatedMonitors.push(monitor);
    }
    return updatedMonitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get active monitors for all users
 * @returns {Promise<IMonitorDocument[]>}
 */

export const getAllUserActiveMonitors = async (): Promise<
  IMonitorDocument[]
> => {
  try {
    const monitors: IMonitorDocument[] = (await MonitorModel.findAll({
      raw: true,
      where: {
        active: true,
      },
      order: [["createdAt", "DESC"]],
    })) as unknown as IMonitorDocument[];

    return monitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get monitor by its id
 * @param monitorId
 * @returns {Promise<IMonitorDocument>}
 */
export const getMonitorById = async (
  monitorId: number
): Promise<IMonitorDocument> => {
  try {
    const monitor: IMonitorDocument = (await MonitorModel.findOne({
      raw: true,
      where: {
        id: monitorId,
      },
    })) as unknown as IMonitorDocument;

    let updatedMonitor: IMonitorDocument = { ...monitor };
    const notifications = (await getSingleNotificationGroup(
      updatedMonitor.notificationId!
    )) as INotificationDocument;
    updatedMonitor = { ...updatedMonitor, notifications };

    return updatedMonitor;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Toggle the active status of a given monitor
 * @param monitorId
 * @param userId
 * @param active
 * @returns {Promise<IMonitorDocument[]>}
 */
export const toggleMonitor = async (
  monitorId: number,
  userId: number,
  active: boolean
): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(
      { active },
      {
        where: {
          [Op.and]: [{ id: monitorId }, { userId }],
        },
      }
    );

    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Update a single monitor
 * @param monitorId
 * @param userId
 * @param data
 * @returns {Promise<IMonitorDocument[]>}
 */
export const updateSingleMonitor = async (
  monitorId: number,
  userId: number,
  data: IMonitorDocument
): Promise<IMonitorDocument[]> => {
  try {
    await MonitorModel.update(data, {
      where: {
        id: monitorId,
      },
    });

    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Update the status of a given monitor
 * to either success or have error (1 or 0)
 * @param monitorId
 * @param timestamp
 * @param type
 * @returns {Promise<IMonitorDocument>}
 */
export const updateMonitorStatus = async (
  monitor: IMonitorDocument,
  timestamp: number,
  type: "success" | "failure"
): Promise<IMonitorDocument> => {
  try {
    const now = timestamp ? dayjs(timestamp).toDate() : dayjs().toDate();
    const { id, status } = monitor;

    const updatedMonitor: IMonitorDocument = { ...monitor };
    updatedMonitor.status = type === "success" ? 0 : 1;
    const isStatus = type === "success" ? true : false;

    /**
     * Only update lastChanged depend on new status
     * and previous status of the monitor
     * status (0 - no error, 1 - has error)
     */
    // If isStatus (new status is success)
    // and status (previous status) has error
    // update lastChanged
    if (isStatus && status === 1) {
      updatedMonitor.lastChanged = now;
    } else if (!isStatus && status === 0) {
      updatedMonitor.lastChanged = now;
    }

    await MonitorModel.update(updatedMonitor, { where: { id } });
    return updatedMonitor;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Delete a single monitor along with its heartbeats
 * @param monitorId
 * @param userId
 * @param type
 * @returns {Promise<IMonitorDocument>}
 */
export const deleteSingleMonitor = async (
  monitorId: number,
  userId: number,
  type: string
): Promise<IMonitorDocument[]> => {
  try {
    await deleteMonitorTypeHeartbeats(monitorId, type);
    await MonitorModel.destroy({
      where: { id: monitorId },
    });

    const result: IMonitorDocument[] = await getUserMonitors(userId);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

export const getHeartbeats = async (
  type: "http" | "tcp" | "mongodb" | "redis",
  monitorId: number,
  duration: number
): Promise<IHeartbeat[]> => {
  let heartbeats: IHeartbeat[] = [];

  if (type === HTTP_TYPE) {
    heartbeats = await getHttpHeartBeatsByDuration(monitorId, duration);
  }
  if (type === TCP_TYPE) {
    console.log("tcp");
  }
  if (type === MONGO_TYPE) {
    console.log("mongodb");
  }
  if (type === REDIS_TYPE) {
    console.log("redis");
  }

  return heartbeats;
};

export const startCreatedMonitors = (
  monitor: IMonitorDocument,
  name: string,
  type: "http" | "tcp" | "mongodb" | "redis"
): void => {
  if (type === HTTP_TYPE) {
    httpStatusMonitor(monitor!, toLower(name));
  }
  if (type === TCP_TYPE) {
    console.log("tcp", monitor.name, name);
  }
  if (type === MONGO_TYPE) {
    console.log("mongodb", monitor.name, name);
  }
  if (type === REDIS_TYPE) {
    console.log("redis", monitor.name, name);
  }
};

const deleteMonitorTypeHeartbeats = async (
  monitorId: number,
  type: string
): Promise<void> => {
  console.log(monitorId, type);
};
