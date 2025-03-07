import http from "http";
import {
  Express,
  json,
  NextFunction,
  Request,
  Response,
  urlencoded,
} from "express";
import cors from "cors";

import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";

import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from "@apollo/server/express4";

import cookieSession from "cookie-session";
import { GraphQLSchema } from "graphql";
import { BaseContext } from "@apollo/server";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import customFormat from "dayjs/plugin/customParseFormat";
import { WebSocketServer, Server as WSServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import {
  CLIENT_URL,
  NODE_ENV,
  PORT,
  SECRET_KEY_ONE,
  SECRET_KEY_TWO,
} from "./config";
import logger from "./logger";
import { mergedGQLSchema } from "@app/graphql/schema";

import { resolvers } from "@app/graphql/resolvers";
import { AppContext } from "@app/interfaces/monitor.interface";
import {
  enableAutoRefreshJob,
  startMonitors,
  startSSLMonitors,
} from "@app/utils/utils";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customFormat);

export default class MonitorServer {
  private app: Express;
  private httpServer: http.Server;
  private server: ApolloServer;
  private wsServer: WSServer;

  constructor(app: Express) {
    this.app = app;
    this.httpServer = new http.Server(app);

    // Init websocket server for GraphQL's endpoint
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: "/graphql",
    });

    const schema: GraphQLSchema = makeExecutableSchema({
      typeDefs: mergedGQLSchema,
      resolvers,
    });

    // Allow the server to be shut down gracefully
    const serverCleanup = useServer(
      {
        schema,
      },
      this.wsServer
    );
    this.server = new ApolloServer<AppContext | BaseContext>({
      schema,
      introspection: NODE_ENV !== "production",
      plugins: [
        // Allow GraphQL server to shutdown gracefully
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),

        // Properly shut down the websocket server
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
        // Display devtool only on development env
        NODE_ENV === "production"
          ? ApolloServerPluginLandingPageDisabled()
          : ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    });
  }

  async start(): Promise<void> {
    /**
     * Must call the start() method on the ApolloServer instance
     * before passing the instance to expressMiddleware
     */
    await this.server.start();
    this.standardMiddleware(this.app);
    this.webSocketConnection();
    this.startServer();
  }

  private standardMiddleware(app: Express): void {
    app.set("trust proxy", 1);

    app.use((_req: Request, res: Response, next: NextFunction) => {
      // Set no cache control to make sure that the browser always return 200
      // for health route since we don't want it to return 304
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      next();
    });

    /**
     * Allow JWT token being stored in request's session
     * by configuring cookieSession middleware.
     * The validity of the session is 7 days
     */
    app.use(
      cookieSession({
        name: "session",
        keys: [SECRET_KEY_ONE, SECRET_KEY_TWO],
        maxAge: 24 * 7 * 3600000,
        secure: NODE_ENV !== "development",
        ...(NODE_ENV !== "development" && {
          sameSite: "none",
        }),
      })
    );
    this.graphqlRoute(app);
    this.healthRoute(app);
  }

  private graphqlRoute(app: Express): void {
    app.use(
      "/graphql",
      cors({
        origin: CLIENT_URL,
        credentials: true,
      }),
      json({ limit: "200mb" }), // Set request's body to limit of 200mb if uses from the client side
      urlencoded({ extended: true, limit: "200mb" }),
      expressMiddleware(this.server, {
        /**
         * Allow access to req, res of express from context of graphql
         */
        context: async ({ req, res }: { req: Request; res: Response }) => {
          return { req, res };
        },
      })
    );
  }

  private healthRoute(app: Express): void {
    app.get("/health", (_req: Request, res: Response) => {
      res.status(200).send("Uptimer monitor service is healthy and OK.");
    });
  }

  private webSocketConnection() {
    this.wsServer.on(
      "connection",
      (_ws: WebSocket, req: http.IncomingMessage) => {
        logger.info("Websocket connect");
        if (req.headers && req.headers.cookie) {
          enableAutoRefreshJob(req.headers.cookie);
        }
      }
    );
  }

  private async startServer(): Promise<void> {
    try {
      const SERVER_PORT: number = parseInt(PORT, 10) || 5000;
      logger.info(`Server has started with process id ${process.pid}`);
      this.httpServer.listen(SERVER_PORT, () => {
        logger.info(`Server running on port ${SERVER_PORT}`);
        startMonitors();
        startSSLMonitors();
      });
    } catch (error) {
      logger.error("error", "startServer() method:", error);
    }
  }
}
