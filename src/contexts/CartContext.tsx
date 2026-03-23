import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItemAddon {
  name: string;
  price: number;
}

export interface CartItemCustomization {
  removed: string[];
  addons: CartItemAddon[];
  meatPoint?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  customization?: CartItemCustomization;
  notes?: string;
}

const SERVICE_FEE = 0.90;

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string, customizationKey?: string) => void;
  updateQuantity: (id: string, quantity: number, customizationKey?: string) => void;
  clearCart: () => void;
  subtotal: number;
  serviceFee: number;
  deliveryFee: number;
  deliveryDistance: number | null;
  setDeliveryFee: (fee: number, distance: number) => void;
  clearDeliveryFee: () => void;
  total: number;
  itemCount: number;
  deliveryMode: "delivery" | "pickup";
  setDeliveryMode: (mode: "delivery" | "pickup") => void;
  address: string;
  setAddress: (address: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getCustomizationKey = (c?: CartItemCustomization) =>
  c ? JSON.stringify(c) : "default";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryFee, setDeliveryFeeState] = useState(0);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);

  const setDeliveryFee = (fee: number, distance: number) => {
    setDeliveryFeeState(fee);
    setDeliveryDistance(distance);
  };

  const clearDeliveryFee = () => {
    setDeliveryFeeState(0);
    setDeliveryDistance(null);
  };

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const key = getCustomizationKey(item.customization);
      const existingIndex = prev.findIndex(
        (i) => i.id === item.id && getCustomizationKey(i.customization) === key
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity || 1;
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeItem = (id: string, customizationKey?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        if (i.id !== id) return true;
        if (customizationKey) return getCustomizationKey(i.customization) !== customizationKey;
        return false;
      })
    );
  };

  const updateQuantity = (id: string, quantity: number, customizationKey?: string) => {
    if (quantity <= 0) {
      removeItem(id, customizationKey);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        if (customizationKey && getCustomizationKey(i.customization) !== customizationKey) return i;
        return { ...i, quantity };
      })
    );
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => {
    const addonsTotal = i.customization?.addons?.reduce((a, addon) => a + addon.price, 0) || 0;
    return sum + (i.price + addonsTotal) * i.quantity;
  }, 0);
  const serviceFee = items.length > 0 ? SERVICE_FEE : 0;
  const actualDeliveryFee = deliveryMode === "delivery" ? deliveryFee : 0;
  const total = subtotal + serviceFee + actualDeliveryFee;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        serviceFee,
        deliveryFee: actualDeliveryFee,
        deliveryDistance,
        setDeliveryFee,
        clearDeliveryFee,
        total,
        itemCount,
        deliveryMode,
        setDeliveryMode,
        address,
        setAddress,
        orderNotes,
        setOrderNotes,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
