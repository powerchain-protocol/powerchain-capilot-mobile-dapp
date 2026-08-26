import { Callout } from '../../../../shared/components/ui/docs/Callout';
import { SectionHeading } from '../../../../shared/components/ui/docs/SectionHeading';

export const metadata = { title: 'Operations' };

export default function OperationsPage() {
  return <article className="docs-page">
    <SectionHeading eyebrow="EMS · IoT · DePIN" title="Operational data with explicit trust and freshness">PowerChain Copilot Mobile keeps live infrastructure evidence distinct from AI reasoning, cached UI state and execution intent.</SectionHeading>
    <div className="prose">
      <h2>Canonical path</h2>
      <pre><code>{`Mobile app
  → Fastify public API
  → authenticated user + site policy
  → internal Operations Gateway
  → Express / Prisma operations API
      ├─ EMS telemetry
      ├─ IoT devices
      ├─ DePIN nodes
      ├─ alarms + append-only events
      ├─ digital-twin projection
      ├─ Solana/Sui read clients
      └─ market data
`}</code></pre>
      <h2>Operational controls</h2>
      <ul>
        <li>Every site-scoped read is authorized against <code>site_access</code>.</li>
        <li>Telemetry carries source, mode, observed time, receive time, freshness and optional provider sequence.</li>
        <li>Provider ingestion is bounded, idempotent and available only on the private operations service.</li>
        <li>Device, DePIN, alarm and event lists use bounded cursor pagination.</li>
        <li>External provider responses are timeout- and size-bounded.</li>
        <li>Safe-action idempotency keys are SHA-256-bound to the full canonical request.</li>
      </ul>
      <Callout title="No direct execution surface">The operations API prepares reviewable intents. It does not expose a physical dispatch endpoint, hold wallet private keys or sign financial settlement transactions.</Callout>
      <h2>Public mobile routes</h2>
      <pre><code>{`GET /api/v1/health
GET /api/v1/config
GET /api/v1/sites
GET /api/v1/ems/overview?siteId=...
GET /api/v1/iot/devices?siteId=...&limit=...&cursor=...
GET /api/v1/depin/nodes?siteId=...&limit=...&cursor=...
GET /api/v1/alarms?siteId=...&state=open
GET /api/v1/events?siteId=...
GET /api/v1/twin?siteId=...
GET /api/v1/market-data/prices?symbols=SOL,PWRC
POST /api/v1/actions/prepare`}</code></pre>
      <h2>Private provider ingestion</h2>
      <pre><code>{`POST /v1/ingest/ems
POST /v1/ingest/iot-heartbeats
POST /v1/ingest/depin-heartbeats
POST /v1/ingest/alarms`}</code></pre>
      <p>Ingestion routes require the internal bearer secret and an <code>Idempotency-Key</code> matching the envelope. The same key with a different canonical payload is rejected.</p>
      <h2>Mobile reliability</h2>
      <p>Operational hooks use a small stale-while-revalidate memory cache. Previously verified data may remain visible during a transient connectivity failure, but the UI marks stale state rather than presenting it as fresh telemetry.</p>
    </div>
  </article>;
}
