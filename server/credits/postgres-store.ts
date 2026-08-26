import type { CreditStore, CreditStoreTransaction, LedgerMutation } from './store.ts';
import type {
  CopilotDelivery,
  CreditAccount,
  CreditLedgerEntry,
  CreditLedgerEntryType,
  CreditReservation,
  CreditReservationStatus,
  CreditScope,
  PersistedCreditQuote,
  ReceiptAnchorOutboxEvent,
  TokenizedReceipt,
  TopUpIntent,
  TopUpIntentStatus,
  VerifiedPaymentCredit,
} from './types.ts';

export type SqlResult<Row> = { rows: Row[] };
export type SqlExecutor = { query<Row = Record<string, unknown>>(text: string, values?: unknown[]): Promise<SqlResult<Row>> };
export type TransactionalSqlClient = SqlExecutor & { transaction<T>(fn: (tx: SqlExecutor) => Promise<T>): Promise<T> };

type ScopeRow = { user_id: string; organization_id: string; account_id: string };
type AccountRow = ScopeRow & {
  available_base_units: string; reserved_base_units: string; spent_base_units: string; funded_base_units: string;
  version: string; created_at: Date | string; updated_at: Date | string;
};
type QuoteRow = ScopeRow & {
  id: string; hash: string; idempotency_key: string; price_version: string; product: 'copilot.response'; quantity: number;
  unit_cost_base_units: string; total_base_units: string; canonical_payload: string;
  issued_at: Date | string; expires_at: Date | string; persisted_at: Date | string;
};
type ReservationRow = ScopeRow & {
  id: string; quote_id: string; quote_hash: string; idempotency_key: string; amount_base_units: string; status: CreditReservationStatus;
  created_at: Date | string; expires_at: Date | string; settled_at: Date | string | null; released_at: Date | string | null;
};
type DeliveryRow = ScopeRow & {
  id: string; response_id: string; reservation_id: string; quote_id: string; quote_hash: string; response_hash: string; status: 'completed';
  conversation_id: string | null; provider: string | null; model: string | null; provider_response_id: string | null; completed_at: Date | string;
};
type ReceiptRow = {
  version: '1'; receipt_id: string; quote_id: string; quote_hash: string; reservation_id: string; response_id: string;
  organization_id: string; account_id: string; mint: string; amount_base_units: string; amount_display: '10000'; status: 'SETTLED';
  settled_at: Date | string; ledger_entry_id: string; previous_receipt_hash: string | null; receipt_hash: string; signature: string;
};
type LedgerRow = ScopeRow & {
  id: string; sequence: string; entry_type: CreditLedgerEntryType;
  available_delta_base_units: string; reserved_delta_base_units: string; spent_delta_base_units: string; funded_delta_base_units: string;
  available_after_base_units: string; reserved_after_base_units: string; spent_after_base_units: string; funded_after_base_units: string;
  reservation_id: string | null; payment_id: string | null; quote_hash: string | null; metadata: Record<string, unknown> | string; created_at: Date | string;
};
type TopUpRow = ScopeRow & {
  id: string; requested_base_units: string; idempotency_key: string | null; recipient: string; reference: string; solana_pay_uri: string;
  status: TopUpIntentStatus; created_at: Date | string; expires_at: Date | string; payment_id: string | null; settled_at: Date | string | null;
};
type OutboxRow = {
  id: string; organization_id: string; account_id: string; receipt_id: string; receipt_hash: string; event_type: 'pwrc.receipt.anchor.requested';
  status: 'pending' | 'processing' | 'published' | 'failed'; attempts: number; created_at: Date | string; available_at: Date | string;
  published_at: Date | string | null; solana_signature: string | null; merkle_root: string | null;
};

const asDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));
const maybeDate = (value: Date | string | null) => (value ? asDate(value) : undefined);
const metadata = (value: Record<string, unknown> | string) => typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
const scopeFromRow = (row: ScopeRow): CreditScope => ({ userId: row.user_id, organizationId: row.organization_id, accountId: row.account_id });

function accountFromRow(row: AccountRow): CreditAccount { return { ...scopeFromRow(row), availableBaseUnits: BigInt(row.available_base_units), reservedBaseUnits: BigInt(row.reserved_base_units), spentBaseUnits: BigInt(row.spent_base_units), fundedBaseUnits: BigInt(row.funded_base_units), version: BigInt(row.version), createdAt: asDate(row.created_at), updatedAt: asDate(row.updated_at) }; }
function quoteFromRow(row: QuoteRow): PersistedCreditQuote { return { ...scopeFromRow(row), id: row.id, hash: row.hash, idempotencyKey: row.idempotency_key, priceVersion: row.price_version, product: row.product, quantity: row.quantity, unitCostBaseUnits: BigInt(row.unit_cost_base_units), totalBaseUnits: BigInt(row.total_base_units), canonicalPayload: row.canonical_payload, issuedAt: asDate(row.issued_at), expiresAt: asDate(row.expires_at), persistedAt: asDate(row.persisted_at) }; }
function reservationFromRow(row: ReservationRow): CreditReservation { return { ...scopeFromRow(row), id: row.id, quoteId: row.quote_id, quoteHash: row.quote_hash, idempotencyKey: row.idempotency_key, amountBaseUnits: BigInt(row.amount_base_units), status: row.status, createdAt: asDate(row.created_at), expiresAt: asDate(row.expires_at), settledAt: maybeDate(row.settled_at), releasedAt: maybeDate(row.released_at) }; }
function deliveryFromRow(row: DeliveryRow): CopilotDelivery { return { ...scopeFromRow(row), id: row.id, responseId: row.response_id, reservationId: row.reservation_id, quoteId: row.quote_id, quoteHash: row.quote_hash, responseHash: row.response_hash, status: row.status, conversationId: row.conversation_id ?? undefined, provider: row.provider ?? undefined, model: row.model ?? undefined, providerResponseId: row.provider_response_id ?? undefined, completedAt: asDate(row.completed_at) }; }
function receiptFromRow(row: ReceiptRow): TokenizedReceipt { return { version: '1', receiptId: row.receipt_id, quoteId: row.quote_id, quoteHash: row.quote_hash, reservationId: row.reservation_id, responseId: row.response_id, organizationId: row.organization_id, accountId: row.account_id, mint: row.mint, amountBaseUnits: row.amount_base_units as '10000000000000', amountDisplay: '10000', status: 'SETTLED', settledAt: asDate(row.settled_at).toISOString(), ledgerEntryId: row.ledger_entry_id, previousReceiptHash: row.previous_receipt_hash, receiptHash: row.receipt_hash, signature: row.signature }; }
function ledgerFromRow(row: LedgerRow): CreditLedgerEntry { return { ...scopeFromRow(row), id: row.id, sequence: BigInt(row.sequence), type: row.entry_type, availableDeltaBaseUnits: BigInt(row.available_delta_base_units), reservedDeltaBaseUnits: BigInt(row.reserved_delta_base_units), spentDeltaBaseUnits: BigInt(row.spent_delta_base_units), fundedDeltaBaseUnits: BigInt(row.funded_delta_base_units), availableAfterBaseUnits: BigInt(row.available_after_base_units), reservedAfterBaseUnits: BigInt(row.reserved_after_base_units), spentAfterBaseUnits: BigInt(row.spent_after_base_units), fundedAfterBaseUnits: BigInt(row.funded_after_base_units), reservationId: row.reservation_id ?? undefined, paymentId: row.payment_id ?? undefined, quoteHash: row.quote_hash ?? undefined, metadata: metadata(row.metadata), createdAt: asDate(row.created_at) }; }
function topUpFromRow(row: TopUpRow): TopUpIntent { return { ...scopeFromRow(row), id: row.id, requestedBaseUnits: BigInt(row.requested_base_units), idempotencyKey: row.idempotency_key ?? undefined, recipient: row.recipient, reference: row.reference, solanaPayUri: row.solana_pay_uri, status: row.status, createdAt: asDate(row.created_at), expiresAt: asDate(row.expires_at), paymentId: row.payment_id ?? undefined, settledAt: maybeDate(row.settled_at) }; }
function outboxFromRow(row: OutboxRow): ReceiptAnchorOutboxEvent { return { id: row.id, organizationId: row.organization_id, accountId: row.account_id, receiptId: row.receipt_id, receiptHash: row.receipt_hash, eventType: row.event_type, status: row.status, attempts: row.attempts, createdAt: asDate(row.created_at), availableAt: asDate(row.available_at), publishedAt: maybeDate(row.published_at), solanaSignature: row.solana_signature ?? undefined, merkleRoot: row.merkle_root ?? undefined }; }

class PostgresCreditTransaction implements CreditStoreTransaction {
  constructor(private readonly sql: SqlExecutor) {}

  async getOrCreateAccount(scope: CreditScope, now: Date) {
    await this.sql.query(`INSERT INTO pwrc_credit_accounts (user_id, organization_id, account_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$4) ON CONFLICT (organization_id, account_id) DO NOTHING`, [scope.userId, scope.organizationId, scope.accountId, now]);
    const result = await this.sql.query<AccountRow>(`SELECT * FROM pwrc_credit_accounts WHERE user_id=$1 AND organization_id=$2 AND account_id=$3 FOR UPDATE`, [scope.userId, scope.organizationId, scope.accountId]);
    const row = result.rows[0];
    if (!row) throw new Error('PWRC credit account scope mismatch or account creation failed.');
    return accountFromRow(row);
  }

  async saveAccount(account: CreditAccount) {
    const result = await this.sql.query(`UPDATE pwrc_credit_accounts SET available_base_units=$4,reserved_base_units=$5,spent_base_units=$6,funded_base_units=$7,version=$8,updated_at=$9 WHERE user_id=$1 AND organization_id=$2 AND account_id=$3`, [account.userId, account.organizationId, account.accountId, account.availableBaseUnits.toString(), account.reservedBaseUnits.toString(), account.spentBaseUnits.toString(), account.fundedBaseUnits.toString(), account.version.toString(), account.updatedAt]);
    void result;
  }

  async saveQuote(quote: PersistedCreditQuote) {
    await this.sql.query(`INSERT INTO pwrc_credit_quotes (id,hash,idempotency_key,price_version,user_id,organization_id,account_id,product,quantity,unit_cost_base_units,total_base_units,canonical_payload,issued_at,expires_at,persisted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (hash) DO NOTHING`, [quote.id,quote.hash,quote.idempotencyKey,quote.priceVersion,quote.userId,quote.organizationId,quote.accountId,quote.product,quote.quantity,quote.unitCostBaseUnits.toString(),quote.totalBaseUnits.toString(),quote.canonicalPayload,quote.issuedAt,quote.expiresAt,quote.persistedAt]);
    const stored = await this.getQuote(quote.hash);
    if (!stored || stored.canonicalPayload !== quote.canonicalPayload || stored.organizationId !== quote.organizationId || stored.accountId !== quote.accountId) throw new Error('Persisted PWRC quote hash collision/integrity violation.');
  }
  async getQuote(hash: string) { const result = await this.sql.query<QuoteRow>(`SELECT * FROM pwrc_credit_quotes WHERE hash=$1 FOR KEY SHARE`, [hash]); return result.rows[0] ? quoteFromRow(result.rows[0]) : null; }
  async getQuoteByIdempotency(scope: CreditScope, key: string) { const result = await this.sql.query<QuoteRow>(`SELECT * FROM pwrc_credit_quotes WHERE organization_id=$1 AND account_id=$2 AND idempotency_key=$3 FOR KEY SHARE`, [scope.organizationId, scope.accountId, key]); return result.rows[0] ? quoteFromRow(result.rows[0]) : null; }

  async appendLedger(account: CreditAccount, mutation: LedgerMutation) {
    const result = await this.sql.query<LedgerRow>(`INSERT INTO pwrc_credit_ledger (user_id,organization_id,account_id,entry_type,available_delta_base_units,reserved_delta_base_units,spent_delta_base_units,funded_delta_base_units,available_after_base_units,reserved_after_base_units,spent_after_base_units,funded_after_base_units,reservation_id,payment_id,quote_hash,metadata,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17) RETURNING *`, [account.userId,account.organizationId,account.accountId,mutation.type,(mutation.availableDeltaBaseUnits??0n).toString(),(mutation.reservedDeltaBaseUnits??0n).toString(),(mutation.spentDeltaBaseUnits??0n).toString(),(mutation.fundedDeltaBaseUnits??0n).toString(),account.availableBaseUnits.toString(),account.reservedBaseUnits.toString(),account.spentBaseUnits.toString(),account.fundedBaseUnits.toString(),mutation.reservationId??null,mutation.paymentId??null,mutation.quoteHash??null,JSON.stringify(mutation.metadata??{}),mutation.createdAt??account.updatedAt]);
    if (!result.rows[0]) throw new Error('Failed to append PWRC ledger entry.');
    return ledgerFromRow(result.rows[0]);
  }
  async listLedger(scope: CreditScope, limit: number, before?: bigint) { const result=await this.sql.query<LedgerRow>(`SELECT * FROM pwrc_credit_ledger WHERE user_id=$1 AND organization_id=$2 AND account_id=$3 AND ($4::bigint IS NULL OR sequence<$4) ORDER BY sequence DESC LIMIT $5`,[scope.userId,scope.organizationId,scope.accountId,before?.toString()??null,limit]); return result.rows.map(ledgerFromRow); }

  async getReservation(id: string) { const result=await this.sql.query<ReservationRow>(`SELECT * FROM pwrc_credit_reservations WHERE id=$1 FOR UPDATE`,[id]); return result.rows[0]?reservationFromRow(result.rows[0]):null; }
  async findReservationByQuote(scope: CreditScope, quoteHash: string) { const result=await this.sql.query<ReservationRow>(`SELECT * FROM pwrc_credit_reservations WHERE user_id=$1 AND organization_id=$2 AND account_id=$3 AND quote_hash=$4 FOR UPDATE`,[scope.userId,scope.organizationId,scope.accountId,quoteHash]); return result.rows[0]?reservationFromRow(result.rows[0]):null; }
  async saveReservation(r: CreditReservation) { await this.sql.query(`INSERT INTO pwrc_credit_reservations (id,user_id,organization_id,account_id,quote_id,quote_hash,idempotency_key,amount_base_units,status,created_at,expires_at,settled_at,released_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,expires_at=EXCLUDED.expires_at,settled_at=EXCLUDED.settled_at,released_at=EXCLUDED.released_at`,[r.id,r.userId,r.organizationId,r.accountId,r.quoteId,r.quoteHash,r.idempotencyKey,r.amountBaseUnits.toString(),r.status,r.createdAt,r.expiresAt,r.settledAt??null,r.releasedAt??null]); }
  async listExpiredActiveReservations(now: Date, limit: number) { const result=await this.sql.query<ReservationRow>(`SELECT * FROM pwrc_credit_reservations WHERE status='active' AND expires_at<=$1 ORDER BY expires_at ASC LIMIT $2 FOR UPDATE SKIP LOCKED`,[now,limit]); return result.rows.map(reservationFromRow); }
  async listExpiredActiveReservationsForScope(scope: CreditScope, now: Date, limit: number) { const result=await this.sql.query<ReservationRow>(`SELECT * FROM pwrc_credit_reservations WHERE user_id=$1 AND organization_id=$2 AND account_id=$3 AND status='active' AND expires_at<=$4 ORDER BY expires_at ASC LIMIT $5 FOR UPDATE SKIP LOCKED`,[scope.userId,scope.organizationId,scope.accountId,now,limit]); return result.rows.map(reservationFromRow); }

  async saveCompletedDelivery(d: CopilotDelivery) {
    await this.sql.query(`INSERT INTO pwrc_copilot_deliveries (id,response_id,user_id,organization_id,account_id,reservation_id,quote_id,quote_hash,response_hash,status,conversation_id,provider,model,provider_response_id,completed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (reservation_id) DO NOTHING`,[d.id,d.responseId,d.userId,d.organizationId,d.accountId,d.reservationId,d.quoteId,d.quoteHash,d.responseHash,d.status,d.conversationId??null,d.provider??null,d.model??null,d.providerResponseId??null,d.completedAt]);
    const stored=await this.getCompletedDeliveryByReservation(d.reservationId);
    if(!stored||stored.responseId!==d.responseId||stored.responseHash!==d.responseHash) throw new Error('Completed response proof is immutable for a PWRC reservation.');
  }
  async getCompletedDeliveryByReservation(id: string) { const result=await this.sql.query<DeliveryRow>(`SELECT * FROM pwrc_copilot_deliveries WHERE reservation_id=$1 FOR KEY SHARE`,[id]); return result.rows[0]?deliveryFromRow(result.rows[0]):null; }
  async getCompletedDeliveryByResponseId(responseId: string) { const result=await this.sql.query<DeliveryRow>(`SELECT * FROM pwrc_copilot_deliveries WHERE response_id=$1 FOR KEY SHARE`,[responseId]); return result.rows[0]?deliveryFromRow(result.rows[0]):null; }

  async saveReceipt(r: TokenizedReceipt) {
    await this.sql.query(`INSERT INTO pwrc_signed_receipts (version,receipt_id,quote_id,quote_hash,reservation_id,response_id,organization_id,account_id,mint,amount_base_units,amount_display,status,settled_at,ledger_entry_id,previous_receipt_hash,receipt_hash,signature) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ON CONFLICT (reservation_id) DO NOTHING`,[r.version,r.receiptId,r.quoteId,r.quoteHash,r.reservationId,r.responseId,r.organizationId,r.accountId,r.mint,r.amountBaseUnits,r.amountDisplay,r.status,r.settledAt,r.ledgerEntryId,r.previousReceiptHash,r.receiptHash,r.signature]);
    const stored=await this.getReceiptByReservation(r.reservationId);
    if(!stored||stored.receiptHash!==r.receiptHash) throw new Error('Signed PWRC receipt is immutable for a reservation.');
  }
  async getReceipt(receiptId: string) { const result=await this.sql.query<ReceiptRow>(`SELECT * FROM pwrc_signed_receipts WHERE receipt_id=$1`,[receiptId]); return result.rows[0]?receiptFromRow(result.rows[0]):null; }
  async getReceiptByReservation(reservationId: string) { const result=await this.sql.query<ReceiptRow>(`SELECT * FROM pwrc_signed_receipts WHERE reservation_id=$1`,[reservationId]); return result.rows[0]?receiptFromRow(result.rows[0]):null; }
  async getLatestReceipt(scope: Pick<CreditScope,'organizationId'|'accountId'>) { const result=await this.sql.query<ReceiptRow>(`SELECT * FROM pwrc_signed_receipts WHERE organization_id=$1 AND account_id=$2 ORDER BY settled_at DESC, receipt_id DESC LIMIT 1 FOR KEY SHARE`,[scope.organizationId,scope.accountId]); return result.rows[0]?receiptFromRow(result.rows[0]):null; }

  async enqueueReceiptAnchor(e: ReceiptAnchorOutboxEvent) { await this.sql.query(`INSERT INTO pwrc_receipt_anchor_outbox (id,organization_id,account_id,receipt_id,receipt_hash,event_type,status,attempts,created_at,available_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (receipt_id) DO NOTHING`,[e.id,e.organizationId,e.accountId,e.receiptId,e.receiptHash,e.eventType,e.status,e.attempts,e.createdAt,e.availableAt]); }
  async listPendingReceiptAnchors(limit:number, now:Date) { const result=await this.sql.query<OutboxRow>(`SELECT * FROM pwrc_receipt_anchor_outbox WHERE status IN ('pending','failed','processing') AND available_at<=$1 ORDER BY created_at ASC LIMIT $2 FOR UPDATE SKIP LOCKED`,[now,limit]); return result.rows.map(outboxFromRow); }
  async saveReceiptAnchor(e:ReceiptAnchorOutboxEvent) { await this.sql.query(`UPDATE pwrc_receipt_anchor_outbox SET status=$2,attempts=$3,available_at=$4,published_at=$5,solana_signature=$6,merkle_root=$7 WHERE id=$1`,[e.id,e.status,e.attempts,e.availableAt,e.publishedAt??null,e.solanaSignature??null,e.merkleRoot??null]); }

  async hasDemoGrant(scope: CreditScope) { const result=await this.sql.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM pwrc_credit_demo_grants WHERE user_id=$1 AND organization_id=$2 AND account_id=$3) AS exists`,[scope.userId,scope.organizationId,scope.accountId]); return Boolean(result.rows[0]?.exists); }
  async markDemoGrant(scope: CreditScope, ledgerEntryId:string, now:Date) { await this.sql.query(`INSERT INTO pwrc_credit_demo_grants (user_id,organization_id,account_id,ledger_entry_id,created_at) VALUES ($1,$2,$3,$4,$5)`,[scope.userId,scope.organizationId,scope.accountId,ledgerEntryId,now]); }

  async saveTopUpIntent(i:TopUpIntent) { await this.sql.query(`INSERT INTO pwrc_credit_topup_intents (id,user_id,organization_id,account_id,requested_base_units,idempotency_key,recipient,reference,solana_pay_uri,status,created_at,expires_at,payment_id,settled_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,payment_id=EXCLUDED.payment_id,settled_at=EXCLUDED.settled_at`,[i.id,i.userId,i.organizationId,i.accountId,i.requestedBaseUnits.toString(),i.idempotencyKey??null,i.recipient,i.reference,i.solanaPayUri,i.status,i.createdAt,i.expiresAt,i.paymentId??null,i.settledAt??null]); }
  async getTopUpIntent(id:string) { const result=await this.sql.query<TopUpRow>(`SELECT * FROM pwrc_credit_topup_intents WHERE id=$1 FOR UPDATE`,[id]); return result.rows[0]?topUpFromRow(result.rows[0]):null; }
  async findTopUpIntentByIdempotency(scope:CreditScope,key:string) { const result=await this.sql.query<TopUpRow>(`SELECT * FROM pwrc_credit_topup_intents WHERE user_id=$1 AND organization_id=$2 AND account_id=$3 AND idempotency_key=$4 FOR UPDATE`,[scope.userId,scope.organizationId,scope.accountId,key]); return result.rows[0]?topUpFromRow(result.rows[0]):null; }

  async hasPaymentEvent(eventId:string) { const result=await this.sql.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM pwrc_credit_payment_events WHERE event_id=$1) AS exists`,[eventId]); return Boolean(result.rows[0]?.exists); }
  async hasPaymentId(paymentId:string) { const result=await this.sql.query<{exists:boolean}>(`SELECT EXISTS(SELECT 1 FROM pwrc_credit_payment_events WHERE payment_id=$1) AS exists`,[paymentId]); return Boolean(result.rows[0]?.exists); }
  async saveVerifiedPaymentCredit(p:VerifiedPaymentCredit) { await this.sql.query(`INSERT INTO pwrc_credit_payment_events (event_id,payment_id,topup_intent_id,user_id,amount_base_units,mint,network,transaction_signature,recipient,reference,settled_at,verification_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[p.eventId,p.paymentId,p.topUpIntentId,p.userId,p.amountBaseUnits.toString(),p.mint,p.network,p.transactionSignature,p.recipient,p.reference,p.settledAt,p.verificationId]); }
}

export class PostgresCreditStore implements CreditStore {
  constructor(private readonly client: TransactionalSqlClient) {}
  transaction<T>(fn:(tx:CreditStoreTransaction)=>Promise<T>):Promise<T> { return this.client.transaction((sql)=>fn(new PostgresCreditTransaction(sql))); }
}
