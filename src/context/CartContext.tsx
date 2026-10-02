import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CartItem, Product, ProductVariant } from '../types';
import { useLanguage } from './LanguageContext';

export interface AddItemResult {
  /** True only when the variant is really present in the cart after the call. */
  ok: boolean;
  /** Quantity of this variant in the cart after the call (0 when ok is false). */
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => AddItemResult;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  notification: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'outfit_zone_guest_cart_v1';

/**
 * Drops malformed entries that could crash Cart/Checkout pages (white screen),
 * e.g. items saved by an older version of the app that have no `product` object.
 */
function sanitizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const clean: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Partial<CartItem>;
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (
      !item.product ||
      typeof item.product !== 'object' ||
      !item.variantId ||
      !item.productId ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(unitPrice)
    ) {
      continue;
    }
    clean.push({
      productId: String(item.productId),
      product: item.product as Product,
      variantId: String(item.variantId),
      color: item.color || '',
      size: item.size || '',
      quantity: Math.floor(quantity),
      unitPrice,
    });
  }
  return clean;
}

function loadStoredCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? sanitizeCart(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();

  const [items, setItems] = useState<CartItem[]>(loadStoredCart);
  // Always holds the latest committed cart so addItem can compute its result
  // synchronously (callers like "Order Now" must know the item was really added).
  const itemsRef = useRef<CartItem[]>(items);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  useEffect(() => {
    return () => {
      if (notificationTimer.current) clearTimeout(notificationTimer.current);
    };
  }, []);

  const addItem = (
    product: Product,
    variant: ProductVariant,
    quantity = 1
  ): AddItemResult => {
    const stock = Number(variant?.stock_quantity) || 0;
    const requested = Math.max(1, Math.floor(Number(quantity) || 1));

    if (!product?.id || !variant?.id || stock <= 0) {
      return { ok: false, quantity: 0 };
    }

    const prev = itemsRef.current;
    const existingIdx = prev.findIndex((i) => i.variantId === variant.id);
    let next: CartItem[];
    let finalQty: number;

    if (existingIdx > -1) {
      // Never mutate the existing object: React StrictMode runs updaters twice
      // and a mutation would double-count the quantity.
      finalQty = Math.min(prev[existingIdx].quantity + requested, stock);
      next = prev.map((item, idx) =>
        idx === existingIdx
          ? { ...item, product, quantity: finalQty, unitPrice: product.price }
          : item
      );
    } else {
      finalQty = Math.min(requested, stock);
      next = [
        ...prev,
        {
          productId: product.id,
          product,
          variantId: variant.id,
          color: variant.color,
          size: variant.size,
          quantity: finalQty,
          unitPrice: product.price,
        },
      ];
    }

    commit(next);

    setNotification(
      t('cart.added_notification', '"{name}" ({size}) was added to your bag')
        .replace('{name}', product.name)
        .replace('{size}', variant.size)
    );
    if (notificationTimer.current) clearTimeout(notificationTimer.current);
    notificationTimer.current = setTimeout(() => {
      setNotification(null);
    }, 3000);

    return { ok: true, quantity: finalQty };
  };

  const removeItem = (variantId: string) => {
    commit(itemsRef.current.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    commit(
      itemsRef.current.map((i) => {
        if (i.variantId !== variantId) return i;
        // Never let the cart exceed the stock known for this variant.
        const stock = i.product?.variants?.find((v) => v.id === variantId)?.stock_quantity;
        const max = typeof stock === 'number' && stock > 0 ? stock : Infinity;
        return { ...i, quantity: Math.min(Math.floor(quantity), max) };
      })
    );
  };

  const clearCart = () => {
    commit([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        notification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
