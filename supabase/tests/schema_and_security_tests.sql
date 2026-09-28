-- ==============================================================================
-- Outfit Zone: Supabase Security & Integrity Test Suite
-- ==============================================================================

DO $$
DECLARE
  v_cat_id UUID;
  v_prod_id UUID;
  v_var_id UUID;
  v_order_res JSONB;
  v_receipt_res JSONB;
  v_restricted_res JSONB;
  v_order_num TEXT;
  v_token TEXT;
  v_caught_non_existent BOOLEAN := false;
  v_caught_overstock BOOLEAN := false;
BEGIN
  RAISE NOTICE '--- STARTING OUTFIT ZONE SQL TEST SUITE ---';

  -- 1. Setup Mock Test Data
  INSERT INTO public.categories (name, slug)
  VALUES ('Test Category', 'test-cat-' || gen_random_uuid())
  RETURNING id INTO v_cat_id;

  INSERT INTO public.products (name, slug, price, category_id, is_active)
  VALUES ('Test Streetwear Tee', 'test-tee-' || gen_random_uuid(), 399.00, v_cat_id, true)
  RETURNING id INTO v_prod_id;

  INSERT INTO public.product_variants (product_id, color, size, stock_quantity)
  VALUES (v_prod_id, 'Black', 'L', 10)
  RETURNING id INTO v_var_id;

  RAISE NOTICE 'Test fixtures created: category=%, product=%, variant=%', v_cat_id, v_prod_id, v_var_id;

  -- 2. Test Success Case: create_guest_order returns order_number and receipt_token
  v_order_res := public.create_guest_order(
    'أحمد مصطفى التست',
    '01012345678',
    'القاهرة',
    'مدينة نصر',
    'شارع الطيران عمارة 12 شقة 4',
    'ملاحظة تجريبية',
    jsonb_build_array(
      jsonb_build_object(
        'variant_id', v_var_id::TEXT,
        'product_id', v_prod_id::TEXT,
        'quantity', 2
      )
    )
  );

  ASSERT (v_order_res->>'success')::BOOLEAN = true, 'Order creation did not succeed';
  ASSERT (v_order_res->>'receipt_token') IS NOT NULL, 'Receipt token was not returned';
  ASSERT length(v_order_res->>'receipt_token') >= 32, 'Receipt token format is invalid';
  
  v_order_num := v_order_res->>'order_number';
  v_token := v_order_res->>'receipt_token';
  RAISE NOTICE 'SUCCESS: create_guest_order generated % with secure receipt token', v_order_num;

  -- Verify inventory decrement: 10 - 2 = 8
  PERFORM 1 FROM public.product_variants WHERE id = v_var_id AND stock_quantity = 8;
  ASSERT FOUND, 'Stock quantity was not decremented correctly';
  RAISE NOTICE 'SUCCESS: Stock was decremented atomically to 8';

  -- 3. Test Receipt Lookup: WITH valid receipt token -> Full Access
  v_receipt_res := public.get_guest_order_receipt(v_order_num, v_token);
  ASSERT (v_receipt_res->>'has_full_access')::BOOLEAN = true, 'Full access not granted with valid token';
  ASSERT v_receipt_res->>'customer_name' = 'أحمد مصطفى التست', 'Customer name not visible with valid token';
  ASSERT v_receipt_res->>'phone' = '01012345678', 'Phone not visible with valid token';
  RAISE NOTICE 'SUCCESS: get_guest_order_receipt returned full receipt with valid token';

  -- 4. Test Receipt Lookup: WITHOUT valid receipt token -> Restricted Access (NO Personal Data)
  v_restricted_res := public.get_guest_order_receipt(v_order_num, 'invalid_or_missing_token');
  ASSERT (v_restricted_res->>'has_full_access')::BOOLEAN = false, 'Security breach: Full access granted without valid token';
  ASSERT v_restricted_res->>'customer_name' IS NULL, 'Security breach: Customer name leaked without token';
  ASSERT v_restricted_res->>'phone' IS NULL, 'Security breach: Phone number leaked without token';
  ASSERT v_restricted_res->>'address' IS NULL, 'Security breach: Address leaked without token';
  ASSERT v_restricted_res->>'order_number' = v_order_num, 'Order number should still be verified';
  RAISE NOTICE 'SUCCESS: get_guest_order_receipt properly obscured personal data when token was absent';

  -- 5. Test Strict Variant Integrity: Reject non-existent variant ID (NO fallback to first variant)
  BEGIN
    PERFORM public.create_guest_order(
      'عميل غير صالح',
      '01012345678',
      'الجيزة',
      'الدقي',
      'شارع مصدق',
      NULL,
      jsonb_build_array(
        jsonb_build_object(
          'variant_id', gen_random_uuid()::TEXT,
          'product_id', v_prod_id::TEXT,
          'quantity', 1
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    v_caught_non_existent := true;
    RAISE NOTICE 'SUCCESS: Successfully rejected non-existent variant (no fallback)';
  END;
  ASSERT v_caught_non_existent, 'Failed to reject non-existent variant';

  -- 6. Test Strict Inventory Integrity: Reject quantity exceeding available stock
  BEGIN
    PERFORM public.create_guest_order(
      'عميل شراء فائض',
      '01012345678',
      'الإسكندرية',
      'سموحة',
      'شارع فوزي معاذ',
      NULL,
      jsonb_build_array(
        jsonb_build_object(
          'variant_id', v_var_id::TEXT,
          'product_id', v_prod_id::TEXT,
          'quantity', 50 -- Available is 8
        )
      )
    );
  EXCEPTION WHEN OTHERS THEN
    v_caught_overstock := true;
    RAISE NOTICE 'SUCCESS: Successfully rejected quantity exceeding available stock';
  END;
  ASSERT v_caught_overstock, 'Failed to reject order exceeding available stock';

  -- Clean up test records
  DELETE FROM public.orders WHERE order_number = v_order_num;
  DELETE FROM public.products WHERE id = v_prod_id;
  DELETE FROM public.categories WHERE id = v_cat_id;

  RAISE NOTICE '--- ALL OUTFIT ZONE SQL TESTS PASSED SUCCESSFULLY (PASS) ---';
END $$;
