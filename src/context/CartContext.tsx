import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Product, ProductVariant } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable
    }
  }, [items]);

  const addItem = (product: Product, variant: ProductVariant, quantity = 1) => {
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.variantId === variant.id);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + quantity;
        // ensure not exceeding available stock
        next[existingIdx].quantity = Math.min(newQty, variant.stock_quantity);
        return next;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            product,
            variantId: variant.id,
            color: variant.color,
            size: variant.size,
            quantity: Math.min(quantity, variant.stock_quantity),
            unitPrice: product.price,
          },
        ];
      }
    });

    setNotification(`تمت إضافة "${product.name}" (${variant.size}) إلى السلة`);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
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
