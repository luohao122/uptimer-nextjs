import { IEmailLocals } from "@app/interfaces/notification.interface";
import { ISSLInfo, ISSLMonitorDocument } from "@app/interfaces/ssl.interface";
import {
  getSSLMonitorById,
  updateSSLMonitorInfo,
} from "@app/services/ssl.service";
import { emailSender, locals } from "@app/utils/utils";
import { getCertificateInfo } from "./monitors";
import logger from "@app/server/logger";

class SSLMonitor {
  private _emailLocals?: IEmailLocals;

  errorCount: number;

  constructor() {
    this.errorCount = 0;
  }

  get emailLocals(): IEmailLocals {
    if (!this._emailLocals) {
      this._emailLocals = locals();
    }
    return this._emailLocals;
  }

  async start(data: ISSLMonitorDocument): Promise<void> {
    const { monitorId, url } = data;
    // const emailLocals: IEmailLocals = locals();
    try {
      const monitorData: ISSLMonitorDocument = await getSSLMonitorById(
        monitorId!
      );
      this.emailLocals.appName = monitorData.name;
      // emailLocals.appName = monitorData.name;
      const response: ISSLInfo = await getCertificateInfo(url!);
      await updateSSLMonitorInfo(
        parseInt(`${monitorId}`),
        JSON.stringify(response)
      );
      logger.info(`SSL certificate for "${url}" is valid`);
    } catch (error) {
      logger.error(`SSL certificate for "${url}" is invalid`);
      const monitorData: ISSLMonitorDocument = await getSSLMonitorById(
        monitorId!
      );
      this.errorCount += 1;
      await updateSSLMonitorInfo(
        parseInt(`${monitorId}`),
        JSON.stringify(error)
      );
      if (
        monitorData.alertThreshold > 0 &&
        this.errorCount > monitorData.alertThreshold
      ) {
        emailSender(
          monitorData.notifications!.emails,
          "errorStatus",
          this.emailLocals
          // emailLocals
        );
      }
    }
  }
}

export const sslMonitor: SSLMonitor = new SSLMonitor();
