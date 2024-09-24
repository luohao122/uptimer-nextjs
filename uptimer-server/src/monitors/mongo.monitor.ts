import dayjs from "dayjs";

import {
  IMonitorDocument,
  IMonitorResponse,
} from "@app/interfaces/monitor.interface";
import logger from "@app/server/logger";
import {
  getMonitorById,
  updateMonitorStatus,
} from "@app/services/monitor.service";

import { IHeartbeat } from "@app/interfaces/heartbeat.interface";
import { mongodbPing } from "./monitors";
import { createMongoHeartBeat } from "@app/services/mongo.service";

class MongoMonitor {
  errorCount: number;
  noSuccessAlert: boolean;

  constructor() {
    this.errorCount = 0;
    this.noSuccessAlert = true;
  }

  async start(data: IMonitorDocument): Promise<void> {
    const { monitorId, url } = data;
    try {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);

      const response: IMonitorResponse = await mongodbPing(url!);
      if (monitorData.connection !== response.status) {
        this.errorAssertionCheck(response.responseTime, monitorData);
      } else {
        this.successAssertionCheck(response, monitorData);
      }
    } catch (error) {
      const monitorData: IMonitorDocument = await getMonitorById(monitorId!);
      this.mongoDBError(monitorData, error);
    }
  }

  async errorAssertionCheck(
    responseTime: number,
    monitorData: IMonitorDocument
  ): Promise<void> {
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartbeat = {
      monitorId: monitorData.id!,
      status: 1,
      code: 500,
      message: "Connection status incorrect",
      timestamp,
      responseTime,
      connection: "refused",
    };
    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createMongoHeartBeat(heartbeatData),
    ]);

    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
    }
    logger.info(
      `MongoDB heartbeat failed assertion: Monitor ID ${monitorData.id}`
    );
  }

  async successAssertionCheck(
    response: IMonitorResponse,
    monitorData: IMonitorDocument
  ): Promise<void> {
    const heartbeatData: IHeartbeat = {
      monitorId: monitorData.id!,
      status: 0,
      code: response.code,
      message: response.message,
      timestamp: dayjs.utc().valueOf(),
      responseTime: response.responseTime,
      connection: response.status,
    };

    await Promise.all([
      updateMonitorStatus(monitorData, heartbeatData.timestamp, "success"),
      createMongoHeartBeat(heartbeatData),
    ]);

    if (!this.noSuccessAlert) {
      this.errorCount = 0;
      this.noSuccessAlert = true;
    }
    logger.info(
      `MongoDB heartbeat success assertion: Monitor ID ${monitorData.id}`
    );
  }

  async mongoDBError(
    monitorData: IMonitorDocument,
    error: IMonitorResponse
  ): Promise<void> {
    logger.info(`MongoDB heartbeat failed: Monitor ID ${monitorData.id}`);
    this.errorCount += 1;
    const timestamp = dayjs.utc().valueOf();
    const heartbeatData: IHeartbeat = {
      monitorId: monitorData.id!,
      status: 1,
      code: error.code || 500,
      message: error.message ?? "MongoDB connection failed",
      timestamp,
      responseTime: error.responseTime,
      connection: error.status,
    };

    await Promise.all([
      updateMonitorStatus(monitorData, timestamp, "failure"),
      createMongoHeartBeat(heartbeatData),
    ]);
    if (
      monitorData.alertThreshold > 0 &&
      this.errorCount > monitorData.alertThreshold
    ) {
      this.errorCount = 0;
      this.noSuccessAlert = false;
    }
    logger.info(`MongoDB monitor failed: Monitor ID ${monitorData.id}`);
  }
}

export const mongoMonitor: MongoMonitor = new MongoMonitor();
