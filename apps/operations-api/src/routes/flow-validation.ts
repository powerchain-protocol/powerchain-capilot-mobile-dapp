import { Router } from "express";
import { z } from "zod";
import { requireActor } from "../auth/adapter.js";
import { requireSiteAccess } from "../auth/site-access.js";
import { validateLiveFlow } from "../services/live-flow-validation.js";
import { config } from "../config.js";
const decimal=z.string().regex(/^-?\d+(?:\.\d+)?$/);
const schema=z.object({siteId:z.string().min(1),generationMw:decimal,demandMw:decimal,gridImportMw:decimal.default("0"),gridExportMw:decimal.default("0"),storageChargeMw:decimal.default("0"),storageDischargeMw:decimal.default("0"),toleranceMw:decimal.optional()});
export const flowValidationRouter=Router();flowValidationRouter.use(requireActor);
flowValidationRouter.post("/validate",async(request,response)=>{
 const input=schema.parse(request.body);await requireSiteAccess(request.actor!,input.siteId,"ems.read");
 const label=config.OPERATIONS_DATA_MODE==="live"?"live":config.OPERATIONS_DATA_MODE==="demo"||config.OPERATIONS_DATA_MODE==="simulation"?"simulation":"non_authoritative";
 const data=validateLiveFlow({...input,toleranceMw:input.toleranceMw??config.LIVE_FLOW_TOLERANCE_MW},label);
 response.status(data.valid?200:422).json({data,meta:{requestId:request.requestId,traceId:request.traceId,schemaVersion:"1.0.0"}});
});
