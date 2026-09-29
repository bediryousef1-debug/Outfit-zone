-- =============================================================================
-- Outfit Zone
-- Migration 006: Product Reviews & Product Comments
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. Product Reviews
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL
    REFERENCES public.products(id)
    ON DELETE CASCADE,

  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  review_text TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'hidden'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now()),

  CONSTRAINT product_reviews_customer_name_length
    CHECK (
      char_length(trim(customer_name)) >= 2
    ),

  CONSTRAINT product_reviews_rating_range
    CHECK (
      rating BETWEEN 1 AND 5
    ),

  CONSTRAINT product_reviews_text_length
    CHECK (
      char_length(trim(review_text)) >= 2
    )
);

-- =============================================================================
-- 2. Product Comments
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  product_id UUID NOT NULL
    REFERENCES public.products(id)
    ON DELETE CASCADE,

  customer_name TEXT NOT NULL,
  comment TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'hidden'
      )
    ),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now()),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now()),

  CONSTRAINT product_comments_customer_name_length
    CHECK (
      char_length(trim(customer_name)) >= 2
    ),

  CONSTRAINT product_comments_text_length
    CHECK (
      char_length(trim(comment)) >= 2
    )
);

-- =============================================================================
-- 3. Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id
  ON public.product_reviews(product_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_status
  ON public.product_reviews(status);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_status
  ON public.product_reviews(product_id, status);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_id
  ON public.product_comments(product_id);

CREATE INDEX IF NOT EXISTS idx_product_comments_status
  ON public.product_comments(status);

CREATE INDEX IF NOT EXISTS idx_product_comments_product_status
  ON public.product_comments(product_id, status);

-- =============================================================================
-- 4. Updated-at trigger function
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_reviews_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at :=
    timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  product_reviews_set_updated_at
ON public.product_reviews;

CREATE TRIGGER
  product_reviews_set_updated_at
BEFORE UPDATE ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.set_reviews_comments_updated_at();

DROP TRIGGER IF EXISTS
  product_comments_set_updated_at
ON public.product_comments;

CREATE TRIGGER
  product_comments_set_updated_at
BEFORE UPDATE ON public.product_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_reviews_comments_updated_at();

-- =============================================================================
-- 5. Enable RLS
-- =============================================================================

ALTER TABLE public.product_reviews
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.product_comments
  ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. Remove existing client grants
-- =============================================================================

REVOKE ALL
ON TABLE public.product_reviews
FROM anon, authenticated;

REVOKE ALL
ON TABLE public.product_comments
FROM anon, authenticated;

-- =============================================================================
-- 7. Public SELECT
--
-- Visitors can see approved reviews/comments only.
-- =============================================================================

GRANT SELECT
ON TABLE public.product_reviews
TO anon, authenticated;

GRANT SELECT
ON TABLE public.product_comments
TO anon, authenticated;

-- =============================================================================
-- 8. Customer INSERT
--
-- Customers can submit new reviews/comments.
-- They cannot choose approved/hidden status.
-- New content is always pending.
-- =============================================================================

GRANT INSERT
ON TABLE public.product_reviews
TO anon, authenticated;

GRANT INSERT
ON TABLE public.product_comments
TO anon, authenticated;

-- =============================================================================
-- 9. Admin permissions
-- =============================================================================

GRANT INSERT, UPDATE, DELETE
ON TABLE public.product_reviews
TO authenticated;

GRANT INSERT, UPDATE, DELETE
ON TABLE public.product_comments
TO authenticated;

-- =============================================================================
-- 10. Remove policies if migration is re-run
-- =============================================================================

DROP POLICY IF EXISTS
  "Public can view approved product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Customers can submit product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Admins can view all product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Admins can insert product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Admins can update product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Admins can delete product reviews"
ON public.product_reviews;

DROP POLICY IF EXISTS
  "Public can view approved product comments"
ON public.product_comments;

DROP POLICY IF EXISTS
  "Customers can submit product comments"
ON public.product_comments;

DROP POLICY IF EXISTS
  "Admins can view all product comments"
ON public.product_comments;

DROP POLICY IF EXISTS
  "Admins can insert product comments"
ON public.product_comments;

DROP POLICY IF EXISTS
  "Admins can update product comments"
ON public.product_comments;

DROP POLICY IF EXISTS
  "Admins can delete product comments"
ON public.product_comments;

-- =============================================================================
-- 11. REVIEW POLICIES
-- =============================================================================

-- Public:
-- Only approved reviews are visible.

CREATE POLICY
  "Public can view approved product reviews"
ON public.product_reviews
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved'
);

-- Customers:
-- Anyone can submit a review.
-- Status is forced to pending.

CREATE POLICY
  "Customers can submit product reviews"
ON public.product_reviews
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
);

-- Admin:
-- Can see every review.

CREATE POLICY
  "Admins can view all product reviews"
ON public.product_reviews
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_admin())
);

-- Admin:
-- Can create any review, including fake/manual reviews.
-- Can choose approved/pending/hidden.

CREATE POLICY
  "Admins can insert product reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
);

-- Admin:
-- Can edit any review.

CREATE POLICY
  "Admins can update product reviews"
ON public.product_reviews
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_admin())
)
WITH CHECK (
  (SELECT public.is_admin())
);

-- Admin:
-- Can delete any review.

CREATE POLICY
  "Admins can delete product reviews"
ON public.product_reviews
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_admin())
);

-- =============================================================================
-- 12. COMMENT POLICIES
-- =============================================================================

-- Public:
-- Only approved comments are visible.

CREATE POLICY
  "Public can view approved product comments"
ON public.product_comments
FOR SELECT
TO anon, authenticated
USING (
  status = 'approved'
);

-- Customers:
-- Anyone can submit a comment.
-- Status is forced to pending.

CREATE POLICY
  "Customers can submit product comments"
ON public.product_comments
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'pending'
);

-- Admin:
-- Can see every comment.

CREATE POLICY
  "Admins can view all product comments"
ON public.product_comments
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_admin())
);

-- Admin:
-- Can create any comment, including fake/manual comments.

CREATE POLICY
  "Admins can insert product comments"
ON public.product_comments
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT public.is_admin())
);

-- Admin:
-- Can edit any comment.

CREATE POLICY
  "Admins can update product comments"
ON public.product_comments
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_admin())
)
WITH CHECK (
  (SELECT public.is_admin())
);

-- Admin:
-- Can delete any comment.

CREATE POLICY
  "Admins can delete product comments"
ON public.product_comments
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_admin())
);

-- =============================================================================
-- 13. Timestamp function permissions
-- =============================================================================

REVOKE ALL
ON FUNCTION public.set_reviews_comments_updated_at()
FROM PUBLIC;

-- =============================================================================
-- 14. Comments
-- =============================================================================

COMMENT ON TABLE public.product_reviews IS
'Customer and admin-managed product reviews for Outfit Zone.';

COMMENT ON TABLE public.product_comments IS
'Customer and admin-managed product comments for Outfit Zone.';

COMMENT ON COLUMN public.product_reviews.status IS
'pending = awaiting moderation, approved = publicly visible, hidden = hidden from public.';

COMMENT ON COLUMN public.product_comments.status IS
'pending = awaiting moderation, approved = publicly visible, hidden = hidden from public.';

COMMIT;