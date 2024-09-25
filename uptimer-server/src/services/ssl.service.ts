import { Model, Op } from "sequelize";

import { getSingleNotificationGroup } from "./notification.service";
import { INotificationDocument } from "@app/interfaces/notification.interface";
import { ISSLMonitorDocument } from "@app/interfaces/ssl.interface";
import { SSLModel } from "@app/models/ssl.model";
import { startSingleJob } from "@app/utils/jobs";
import { appTimeZone } from "@app/utils/utils";
import { sslMonitor } from "@app/monitors/ssl.monitor";

/**
 * Create a ssl monitor
 * @param data
 * @returns {Promise<ISSLMonitorDocument>}
 */
export const createSSLMonitor = async (
  data: ISSLMonitorDocument
): Promise<ISSLMonitorDocument> => {
  try {
    const result: Model = await SSLModel.create(data);
    return result.dataValues;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get all monitors for a given user
 * @param userId
 * @param active
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const getUserSSLMonitors = async (
  userId: number,
  active?: boolean
): Promise<ISSLMonitorDocument[]> => {
  try {
    const monitors: ISSLMonitorDocument[] = (await SSLModel.findAll({
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
    })) as unknown as ISSLMonitorDocument[];

    return monitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get active monitors only for a given user
 * @param userId
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const getUserActiveSSLMonitors = async (
  userId: number
): Promise<ISSLMonitorDocument[]> => {
  try {
    const monitors: ISSLMonitorDocument[] = await getUserSSLMonitors(
      userId,
      true
    );

    return monitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get active monitors for all users
 * @returns {Promise<ISSLMonitorDocument[]>}
 */

export const getAllUserActiveSSLMonitors = async (): Promise<
  ISSLMonitorDocument[]
> => {
  try {
    const monitors: ISSLMonitorDocument[] = (await SSLModel.findAll({
      raw: true,
      where: {
        active: true,
      },
      order: [["createdAt", "DESC"]],
    })) as unknown as ISSLMonitorDocument[];

    return monitors;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Get monitor by its id
 * @param monitorId
 * @returns {Promise<ISSLMonitorDocument>}
 */
export const getSSLMonitorById = async (
  monitorId: number
): Promise<ISSLMonitorDocument> => {
  try {
    const monitor: ISSLMonitorDocument = (await SSLModel.findOne({
      raw: true,
      where: {
        id: monitorId,
      },
    })) as unknown as ISSLMonitorDocument;

    let updatedMonitor: ISSLMonitorDocument = { ...monitor };
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
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const toggleSSLMonitor = async (
  monitorId: number,
  userId: number,
  active: boolean
): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.update(
      { active },
      {
        where: {
          [Op.and]: [{ id: monitorId }, { userId }],
        },
      }
    );

    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
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
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const updateSingleSSLMonitor = async (
  monitorId: number,
  userId: number,
  data: ISSLMonitorDocument
): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.update(data, {
      where: {
        id: monitorId,
      },
    });

    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Update the info attribute of a single monitor
 * @param monitorId
 * @param info
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const updateSSLMonitorInfo = async (
  monitorId: number,
  info: string
): Promise<void> => {
  try {
    await SSLModel.update(
      {
        info,
      },
      {
        where: {
          id: monitorId,
        },
      }
    );
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Delete a single monitor
 * @param monitorId
 * @param userId
 * @param type
 * @returns {Promise<ISSLMonitorDocument[]>}
 */
export const deleteSingleSSLMonitor = async (
  monitorId: number,
  userId: number
): Promise<ISSLMonitorDocument[]> => {
  try {
    await SSLModel.destroy({
      where: { id: monitorId },
    });

    const result: ISSLMonitorDocument[] = await getUserSSLMonitors(userId);
    return result;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Start ssl monitor cron job
 * @param monitor
 * @param name
 */
export const sslStatusMonitor = (
  monitor: ISSLMonitorDocument,
  name: string
): void => {
  const sslData: ISSLMonitorDocument = {
    monitorId: monitor.id,
    url: monitor.url,
  } as ISSLMonitorDocument;
  startSingleJob(name, appTimeZone, monitor.frequency, async () =>
    sslMonitor.start(sslData)
  );
};
