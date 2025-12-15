import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { env } from "./config/env";
import { connectToDatabase } from "./config/db";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { buildContext, buildWsContext } from "./graphql/context";
import { makeExecutableSchema } from "@graphql-tools/schema";

const bootstrap = async () => {
  await connectToDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const httpServer = http.createServer(app);

  let serverCleanup: (() => Promise<void> | void) | undefined;

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  const server = new ApolloServer({
    schema,
    context: buildContext,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              if (serverCleanup) {
                await serverCleanup();
              }
            }
          };
        }
      }
    ]
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: "/graphql" });

  const wsServer = new WebSocketServer({ server: httpServer, path: "/graphql" });
  const cleanup = useServer(
    {
      schema,
      context: buildWsContext
    },
    wsServer
  );
  serverCleanup = () => cleanup.dispose();

  httpServer.listen(env.port, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${env.port}${server.graphqlPath}`);
  });
};

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
