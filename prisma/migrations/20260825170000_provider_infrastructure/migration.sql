CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_expires_at_idx ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS user_settings (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key text NOT NULL,
  encrypted_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

CREATE TABLE IF NOT EXISTS mcp_tool_invocations (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id text,
  pwrc_reservation_id text,
  request_id text,
  server_id text NOT NULL,
  tool_name text NOT NULL,
  function_name text NOT NULL,
  read_only boolean NOT NULL DEFAULT true,
  redacted_arguments jsonb NOT NULL,
  argument_hash text NOT NULL,
  result_hash text,
  status text NOT NULL,
  error text,
  latency_ms integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS mcp_tool_invocations_user_started_idx ON mcp_tool_invocations(user_id, started_at);
CREATE INDEX IF NOT EXISTS mcp_tool_invocations_conversation_started_idx ON mcp_tool_invocations(conversation_id, started_at);
CREATE INDEX IF NOT EXISTS mcp_tool_invocations_reservation_idx ON mcp_tool_invocations(pwrc_reservation_id);
CREATE INDEX IF NOT EXISTS mcp_tool_invocations_tool_started_idx ON mcp_tool_invocations(server_id, tool_name, started_at);

CREATE OR REPLACE FUNCTION powerchain_reject_mcp_audit_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- Completion updates are required by the application, so DELETE is always rejected;
    -- UPDATE is constrained below to immutable identity/input fields.
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'mcp_tool_invocations is append-retain audit evidence and cannot be deleted';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
       OR NEW.pwrc_reservation_id IS DISTINCT FROM OLD.pwrc_reservation_id
       OR NEW.request_id IS DISTINCT FROM OLD.request_id
       OR NEW.server_id IS DISTINCT FROM OLD.server_id
       OR NEW.tool_name IS DISTINCT FROM OLD.tool_name
       OR NEW.function_name IS DISTINCT FROM OLD.function_name
       OR NEW.read_only IS DISTINCT FROM OLD.read_only
       OR NEW.redacted_arguments IS DISTINCT FROM OLD.redacted_arguments
       OR NEW.argument_hash IS DISTINCT FROM OLD.argument_hash
       OR NEW.started_at IS DISTINCT FROM OLD.started_at THEN
      RAISE EXCEPTION 'immutable MCP audit identity/input fields cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mcp_audit_immutable ON mcp_tool_invocations;
CREATE TRIGGER trg_mcp_audit_immutable
BEFORE UPDATE OR DELETE ON mcp_tool_invocations
FOR EACH ROW EXECUTE FUNCTION powerchain_reject_mcp_audit_mutation();
