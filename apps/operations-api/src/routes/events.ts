import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { prisma } from "../db/prisma.js";
import { eventView } from "../services/events.js";
import { decodeCursor, encodeCursor, pageLimit } from "../lib/pagination.js";

export const eventsRouter=Router();
eventsRouter.use(requireActor);
eventsRouter.get("/",async(request,response)=>{
  const q=z.object({siteId:z.string().min(1),cursor:z.string().optional(),limit:z.coerce.number().optional(),eventType:z.string().max(100).optional()}).parse(request.query);
  await requireSiteAccess(request.actor!,q.siteId,"events.read");
  const limit=pageLimit(q.limit), cursor=decodeCursor(q.cursor);
  const rows=await prisma.operationalEventJournal.findMany({where:{organizationId:request.actor!.organizationId,siteId:q.siteId,...(q.eventType?{eventType:q.eventType}:{}),...(cursor?{OR:[{createdAt:{lt:cursor.createdAt}},{createdAt:cursor.createdAt,id:{lt:cursor.id}}]}:{})},orderBy:[{createdAt:"desc"},{id:"desc"}],take:limit+1});
  const hasMore=rows.length>limit,page=hasMore?rows.slice(0,limit):rows,last=page.at(-1);
  response.json({data:page.map(eventView),meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0",page:{nextCursor:hasMore&&last?encodeCursor({createdAt:last.createdAt,id:last.id}):undefined}}});
});
