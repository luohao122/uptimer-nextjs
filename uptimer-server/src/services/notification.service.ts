import { INotificationDocument } from "@app/interfaces/notification.interface";
import { NotificationModel } from "@app/models/notification.model";
import { Model } from "sequelize";

export async function createNotificationGroup(
  data: INotificationDocument
): Promise<INotificationDocument> {
  try {
    const result: Model = await NotificationModel.create(data);

    return result.dataValues;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getSingleNotificationGroup(
  notificationId: number
): Promise<INotificationDocument | null> {
  try {
    const notifications: INotificationDocument | null =
      (await NotificationModel.findOne({
        raw: true,
        where: {
          id: notificationId,
        },
        order: [["createdAt", "DESC"]],
      })) as INotificationDocument | null;

    // if (!notifications) {
    //   throw new Error(`Notification with ID ${notificationId} not found`);
    // }

    return notifications;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAllNotificationGroups(
  userId: number
): Promise<INotificationDocument[] | null> {
  try {
    const notifications = (await NotificationModel.findAll({
      raw: true,
      where: {
        userId,
      },
      order: [["createdAt", "DESC"]],
    })) as unknown as INotificationDocument[];

    if (!notifications) {
      throw new Error(
        `getAllNotificationGroups() method - Notifications not found`
      );
    }

    if (!notifications.length) {
      return [];
    }

    return notifications;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateNotificationGroup(
  notificationId: number,
  data: INotificationDocument
): Promise<void> {
  try {
    await NotificationModel.update(data, {
      where: { id: notificationId },
    });
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteNotificationGroup(
  notificationId: number
): Promise<void> {
  try {
    await NotificationModel.destroy({
      where: { id: notificationId },
    });
  } catch (error) {
    throw new Error(error);
  }
}
