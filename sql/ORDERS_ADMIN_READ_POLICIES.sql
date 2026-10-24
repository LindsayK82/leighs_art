-- ===== LEIGH'S ART: ADMIN-ONLY ORDER READING =====
-- Run after confirming site_admins authorizes Leigh's account.
-- No public order access; no client-side write policies.
CREATE POLICY "Studio admins can read orders"
ON public.art_orders FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.site_admins AS admin
  WHERE admin.user_id = (SELECT auth.uid())
));

CREATE POLICY "Studio admins can read order items"
ON public.art_order_items FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.site_admins AS admin
  WHERE admin.user_id = (SELECT auth.uid())
));
