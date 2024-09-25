import { Socket } from "net";
import { MongoClient } from "mongodb";
import { createClient } from "redis";

import { Agent, request, RequestOptions } from "https";
import { ClientRequest, IncomingMessage } from "http";

import { IMonitorResponse } from "@app/interfaces/monitor.interface";
import { ISSLInfo } from "@app/interfaces/ssl.interface";
import { PeerCertificate, TLSSocket } from "tls";
import { getDaysRemaining } from "@app/utils/utils";

const STATUS_REFUSED = "refused";
const STATUS_ESTABLISHED = "established";

/**
 * Connect to and ping a MongoDB database
 * @param {string} connectionString The database connection string
 * @returns {Promise<IMonitorResponse>}
 */
export const mongodbPing = async (
  connectionString: string
): Promise<IMonitorResponse> => {
  const startTime: number = Date.now();

  return new Promise((resolve, reject) => {
    MongoClient.connect(connectionString)
      .then(async (client: MongoClient) => {
        await client.db().command({ ping: 1 });
        await client.close();

        const responseTime: number = Date.now() - startTime;
        resolve({
          status: STATUS_ESTABLISHED,
          responseTime,
          message: "MongoDB server running",
          code: 200,
        });
      })
      .catch((error) => {
        if (error?.errorResponse) {
          reject({
            status: STATUS_REFUSED,
            responseTime: Date.now() - startTime,
            message:
              error?.errorResponse.errmsg ?? "MongoDB server connection issue",
            code: error?.errorResponse?.code ?? 500,
          });
        } else {
          reject({
            status: STATUS_REFUSED,
            responseTime: Date.now() - startTime,
            message: "MongoDB server down",
            code: 500,
          });
        }
      });
  });
};

/**
 * Redis server ping
 * @param connectionString
 * @returns {Promise<IMonitorResponse>}
 */
export const redisPing = (
  connectionString: string
): Promise<IMonitorResponse> => {
  const startTime: number = Date.now();
  return new Promise((resolve, reject) => {
    const client = createClient({
      url: connectionString,
    });

    client.on("error", (error) => {
      if (client.isOpen) {
        client.disconnect();
      }
      reject({
        status: STATUS_REFUSED,
        responseTime: Date.now() - startTime,
        message: error.message ?? "Redis connection refused",
        code: 500,
      });
    });
    client.connect().then(() => {
      if (!client.isOpen) {
        reject({
          status: STATUS_REFUSED,
          responseTime: Date.now() - startTime,
          message: "Redis connections isn't open",
          code: 500,
        });
      }
      client
        .ping()
        .then(() => {
          if (client.isOpen) {
            client.disconnect();
          }
          resolve({
            status: STATUS_ESTABLISHED,
            responseTime: Date.now() - startTime,
            message: "Redis server running",
            code: 200,
          });
        })
        .catch((err) => {
          reject({
            status: STATUS_REFUSED,
            responseTime: Date.now() - startTime,
            message: err.message ?? "Redis server down",
            code: 500,
          });
        });
    });
  });
};

export const tcpPing = async (
  hostname: string,
  port: number,
  timeout: number
): Promise<IMonitorResponse> => {
  return new Promise((resolve, reject) => {
    const socket: Socket = new Socket();
    const startTime: number = Date.now();

    const options = {
      address: hostname || "127.0.0.1",
      port: port || 80,
      timeout: timeout || 1000,
    };

    socket.setTimeout(options.timeout, () => {
      socket.destroy();
      reject({
        status: STATUS_REFUSED,
        responseTime: Date.now() - startTime,
        message: "TCP socket timed out",
        code: 500,
      });
    });

    socket.connect(options.port, options.address, () => {
      socket.destroy();
      resolve({
        status: STATUS_ESTABLISHED,
        responseTime: Date.now() - startTime,
        message: "Host is up and running",
        code: 200,
      });
    });

    socket.on("error", (error) => {
      socket.destroy();
      reject({
        status: STATUS_REFUSED,
        responseTime: Date.now() - startTime,
        message:
          error && error.message.length > 0
            ? error.message
            : "TCP connection failed",
        code: 500,
      });
    });
  });
};

export const getCertificateInfo = async (url: string): Promise<ISSLInfo> => {
  return new Promise((resolve, reject) => {
    if (!url.startsWith("https://")) {
      reject(new Error(`Host ${url} is not secure and invalid`));
    } else {
      const list: string[] = url.split("//");
      const host: string = list[1];
      const options: Partial<RequestOptions> = {
        agent: new Agent({
          maxCachedSessions: 0,
          rejectUnauthorized: false,
        }),
        method: "GET",
        port: 443, // port for https
        path: "/",
      };
      const req: ClientRequest = request(
        { host, ...options },
        (res: IncomingMessage) => {
          const authorized: boolean = (res.socket as TLSSocket).authorized;
          const authorizationError: Error = (res.socket as TLSSocket)
            .authorizationError;
          const cert: PeerCertificate = (
            res.socket as TLSSocket
          ).getPeerCertificate();
          const validFor: string[] | undefined = cert.subjectaltname
            ?.replace(/DNS:|IP Address:/g, "")
            .split(", ");
          const validTo: Date = new Date(cert.valid_to);
          const daysRemaining: number = getDaysRemaining(new Date(), validTo);
          const parsed: ISSLInfo = {
            host,
            type: authorized ? "success" : "error",
            reason: authorizationError,
            validFor: validFor!,
            subject: {
              org: cert.subject.O,
              common_name: cert.subject.CN,
              sans: cert.subjectaltname,
            },
            issuer: {
              org: cert.issuer.O,
              common_name: cert.issuer.CN,
              country: cert.issuer.C,
            },
            info: {
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysLeft: `${daysRemaining}`,
              backgroundClass: ``,
            },
          };
          if (authorized) {
            if (daysRemaining <= 30) {
              parsed.type = "danger";
              parsed.info.backgroundClass = "danger";
            } else if (daysRemaining > 30 && daysRemaining <= 59) {
              parsed.type = "expiring soon";
              parsed.info.backgroundClass = "warning";
            } else {
              parsed.info.backgroundClass = "success";
            }
          } else {
            parsed.info.backgroundClass = "danger";
          }

          if (authorized) {
            resolve(parsed);
          } else {
            reject(parsed);
          }
        }
      );

      // If the request timed out throw error
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      // Set default timeout for the request to 5s
      req.setTimeout(5000);
      req.end();
    }
  });
};
