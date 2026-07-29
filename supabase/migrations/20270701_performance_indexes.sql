-- Performance: Add missing FK indexes for query performance
-- These indexes accelerate JOINs and foreign key lookups

-- transactions.user_id → company_profiles.user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
  ON public.transactions (user_id);

-- products.user_id → company_profiles.user_id
CREATE INDEX IF NOT EXISTS idx_products_user_id
  ON public.products (user_id);

-- losses.user_id → company_profiles.user_id
CREATE INDEX IF NOT EXISTS idx_losses_user_id
  ON public.losses (user_id);

-- campaign_fields.campaign_id → campaigns.id
CREATE INDEX IF NOT EXISTS idx_campaign_fields_campaign_id
  ON public.campaign_fields (campaign_id);

-- campaign_views.campaign_id → campaigns.id
CREATE INDEX IF NOT EXISTS idx_campaign_views_campaign_id
  ON public.campaign_views (campaign_id);

-- responses.campaign_id → campaigns.id
CREATE INDEX IF NOT EXISTS idx_responses_campaign_id
  ON public.responses (campaign_id);

-- stripe_webhook_dlq.user_id → company_profiles.user_id
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_dlq_user_id
  ON public.stripe_webhook_dlq (user_id);
