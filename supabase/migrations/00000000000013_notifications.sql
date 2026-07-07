-- ============================================================
-- Notifications Table
-- ============================================================

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    influencer_id uuid REFERENCES public.influencers(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN (
        'deliverable_completed',
        'deliverable_approved',
        'invoice_submitted',
        'invoice_approved',
        'invoice_rejected',
        'payment_requested',
        'payment_paid',
        'payment_rejected',
        'collaboration_created',
        'influencer_registered'
    )),
    title text NOT NULL,
    message text,
    link text,
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now(),
    -- Ensure either user_id or influencer_id is set
    CONSTRAINT notification_target CHECK (user_id IS NOT NULL OR influencer_id IS NOT NULL)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Index for fast unread count queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_influencer_unread ON public.notifications(influencer_id, is_read) WHERE is_read = false;

-- RLS: Users see their own notifications
CREATE POLICY notifications_select_own ON public.notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.influencers
            WHERE id = influencer_id AND email = auth.email()
        )
    );

CREATE POLICY notifications_update_own ON public.notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.influencers
            WHERE id = influencer_id AND email = auth.email()
        )
    );

-- Internal users can create notifications (for system use via service role)
CREATE POLICY notifications_insert_internal ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
    );

-- Updated_at trigger
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
