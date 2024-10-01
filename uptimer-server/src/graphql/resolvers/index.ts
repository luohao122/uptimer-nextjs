import { MonitorResolver } from "./monitor";
import { NotificationResolver } from "./notification";
import { SSLMonitorResolver } from "./ssl";
import { UserResolver } from "./user";
import { HeartbeatResolver } from "./heartbeats";

export const resolvers = [
  UserResolver,
  NotificationResolver,
  MonitorResolver,
  HeartbeatResolver,
  SSLMonitorResolver,
];
