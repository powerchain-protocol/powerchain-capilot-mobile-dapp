import express from "express";
import { ZodError } from "zod";
import { allowedOrigins, config } from "./config.js";
import { OperationalError } from "./lib/operational-error.js";
import { healthRouter } from "./routes/health.js";
import { configRouter } from "./routes/config.js";
import { emsRouter } from "./routes/ems.js";
import { iotRouter } from "./routes/iot.js";
import { depinRouter } from "./routes/depin.js";
import { marketDataRouter } from "./routes/market-data.js";
import { actionsRouter } from "./routes/actions.js";
import { walletsRouter } from "./routes/wallets.js";
import { sitesRouter } from "./routes/sites.js";
import { alarmsRouter } from "./routes/alarms.js";
import { eventsRouter } from "./routes/events.js";
import { twinRouter } from "./routes/twin.js";
import { exportsRouter } from "./routes/exports.js";
import { flowValidationRouter } from "./routes/flow-validation.js";
import { internalIngestionRouter } from "./routes/internal-ingestion.js";

export function buildOperationsApp() {
  const app=express();
  app.disable("x-powered-by");
  app.use(express.json({limit:"128kb"}));
  app.use((req,res,next)=>{res.setHeader("cache-control","no-store");res.setHeader("pragma","no-cache");next();});
  app.use((req,res,next)=>{
    const origin=req.headers.origin;
    if(origin&&allowedOrigins.has(origin)){
      res.setHeader("access-control-allow-origin",origin);
      res.setHeader("vary","Origin");
      res.setHeader("access-control-allow-methods","GET,POST,OPTIONS");
      res.setHeader("access-control-allow-headers","Authorization,Content-Type,Idempotency-Key,If-Match,X-Request-Id,X-Trace-Id,X-User-Id,X-Organization-Id");
    }
    if(req.method==="OPTIONS"){
      if(origin&&!allowedOrigins.has(origin))return res.status(403).end();
      return res.status(204).end();
    }
    next();
  });
  app.use((req,res,next)=>{
    req.requestId=String(req.headers["x-request-id"]??crypto.randomUUID());
    req.traceId=String(req.headers["x-trace-id"]??req.requestId);
    res.setHeader("x-request-id",req.requestId);
    res.setHeader("x-trace-id",req.traceId);
    next();
  });
  const p=config.OPERATIONS_API_PREFIX;
  app.use(`${p}/health`,healthRouter);
  app.use(`${p}/sites`,sitesRouter);
  app.use(`${p}/config`,configRouter);
  app.use(`${p}/ems`,emsRouter);
  app.use(`${p}/iot`,iotRouter);
  app.use(`${p}/depin`,depinRouter);
  app.use(`${p}/market-data`,marketDataRouter);
  app.use(`${p}/actions`,actionsRouter);
  app.use(`${p}/wallets`,walletsRouter);
  app.use(`${p}/alarms`,alarmsRouter);
  app.use(`${p}/events`,eventsRouter);
  app.use(`${p}/twin`,twinRouter);
  app.use(`${p}/exports`,exportsRouter);
  app.use(`${p}/flow`,flowValidationRouter);

  // Private ingestion is deliberately outside /api/v1 and is never proxied by the public Fastify API.
  app.use(`/internal/v1/ingestion`,internalIngestionRouter);

  app.use((error:unknown,req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    if(error instanceof ZodError)return res.status(400).json({error:"VALIDATION_ERROR",details:error.flatten(),requestId:req.requestId});
    if(error instanceof OperationalError)return res.status(error.statusCode).json({error:error.code,message:error.message,details:error.details,requestId:req.requestId});
    const e=error as Error&{statusCode?:number;code?:string};
    const status=e.statusCode??500;
    if(status>=500)console.error("operations-api error",{method:req.method,path:req.path,message:e.message,requestId:req.requestId});
    res.status(status).json({error:e.code??e.message??"INTERNAL_ERROR",requestId:req.requestId});
  });
  return app;
}
