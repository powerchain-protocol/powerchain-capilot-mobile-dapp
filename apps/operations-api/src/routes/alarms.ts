import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { prisma } from "../db/prisma.js";
import { alarmView } from "../services/alarms.js";
import { decodeCursor, encodeCursor, pageLimit } from "../lib/pagination.js";

export const alarmsRouter=Router();
alarmsRouter.use(requireActor);

alarmsRouter.get("/",async(request,response)=>{
  const q=z.object({siteId:z.string().min(1),status:z.enum(["open","acknowledged","resolved"]).optional(),severity:z.enum(["info","warning","critical"]).optional(),cursor:z.string().optional(),limit:z.coerce.number().optional()}).parse(request.query);
  await requireSiteAccess(request.actor!,q.siteId,"alarms.read");
  const limit=pageLimit(q.limit), cursor=decodeCursor(q.cursor);
  const rows=await prisma.operationalAlarm.findMany({
    where:{organizationId:request.actor!.organizationId,siteId:q.siteId,...(q.status?{status:q.status}:{}),...(q.severity?{severity:q.severity}:{}),...(cursor?{OR:[{createdAt:{lt:cursor.createdAt}},{createdAt:cursor.createdAt,id:{lt:cursor.id}}]}:{})},
    orderBy:[{createdAt:"desc"},{id:"desc"}],take:limit+1,
  });
  const hasMore=rows.length>limit, page=hasMore?rows.slice(0,limit):rows, last=page.at(-1);
  response.json({data:page.map(alarmView),meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0",page:{nextCursor:hasMore&&last?encodeCursor({createdAt:last.createdAt,id:last.id}):undefined}}});
});
