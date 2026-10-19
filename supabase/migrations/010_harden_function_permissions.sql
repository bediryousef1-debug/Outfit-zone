-- Security hardening for existing Outfit Zone database.
-- This migration intentionally preserves guest checkout and token-based receipts.
BEGIN;

-- Admin-only RPCs must not be callable by anonymous visitors.
-- Their bodies still perform the authoritative public.is_admin() check.
REVOKE ALL ON FUNCTION public.admin_save_product(jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_product(jsonb, jsonb, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_set_order_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, text) TO authenticated;

-- Order-number generation is an internal helper, not a public RPC.
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO service_role;

-- This event-trigger helper must not be exposed as a callable RPC.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- Trigger functions are invoked by their triggers; direct API execution is unnecessary.
ALTER FUNCTION public.set_shipping_rate_updated_at()
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.set_shipping_rate_updated_at() FROM PUBLIC, anon, authenticated;

-- Do not revoke anon access from create_guest_order or get_guest_order_receipt:
-- guest checkout and token-based receipt lookup depend on those public RPCs.

COMMIT;
