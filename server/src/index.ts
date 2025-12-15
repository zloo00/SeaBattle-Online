import http from "http";
import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { env } from "./config/env";
import { connectToDatabase } from "./config/db";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";
import { buildContext } from "./graphql/context";

const bootstrap = async () => {
  await connectToDatabase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: buildContext
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  const httpServer = http.createServer(app);
  httpServer.listen(env.port, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${env.port}${server.graphqlPath}`);
  });
};

bootstrap().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
