import type { FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises";

const openApiUrl = new URL("../../../powerchain-capilot.yaml", import.meta.url);
const swaggerHtmlUrl = new URL("../../../swagger/index.html", import.meta.url);
const postmanUrl = new URL("../../../api/postman/powerchain-capilot.postman_collection.json", import.meta.url);

export async function registerApiV1DocsRoutes(app: FastifyInstance) {
  app.get("/api/v1/openapi.yaml", async (_request, reply) => {
    const contract = await readFile(openApiUrl, "utf8");
    return reply.type("application/yaml; charset=utf-8").send(contract);
  });

  app.get("/api/v1/postman/collection", async (_request, reply) => {
    const collection = await readFile(postmanUrl, "utf8");
    return reply.type("application/json; charset=utf-8").send(collection);
  });

  app.get("/swagger", async (_request, reply) => {
    const html = await readFile(swaggerHtmlUrl, "utf8");
    return reply.type("text/html; charset=utf-8").send(html);
  });
  app.get("/swagger/", async (_request, reply) => {
    const html = await readFile(swaggerHtmlUrl, "utf8");
    return reply.type("text/html; charset=utf-8").send(html);
  });
}
