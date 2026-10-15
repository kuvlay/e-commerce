import { useContext, useRef, useEffect, useMemo } from "react";
import { ShopContext } from "../../../core/context/ShopContext";
import Title from "../../../shared/ui/Title";
import { useCartAnimations } from "../hooks/useCartAnimations.js";

const CartTotal = () => {
  const { cartAmount, currency, delivery_fee, cartCount } = useContext(ShopContext);
  const { animateTotalChange, animatePriceChange } = useCartAnimations();
  const totalRef = useRef(null);
  const subtotalRef = useRef(null);
  const prevSubtotal = useRef(null);
  const prevTotal = useRef(null);

  // Calculate subtotal and total with proper error handling
  const { subtotal, total, hasItems } = useMemo(() => {
    // Warn if cart has items but amount is 0 (timing issue)
    if (cartAmount === 0 && cartCount > 0 && import.meta.env.DEV) {
      console.warn('🚨 CartTotal: Cart has items but amount is 0 - products may not be loaded yet');
    }
    
    const sub = cartAmount || 0;
    const finalTotal = sub === 0 ? 0 : sub + delivery_fee;
    
    return {
      subtotal: sub,
      total: finalTotal,
      hasItems: cartCount > 0
    };
  }, [cartAmount, delivery_fee, cartCount]);

  // Format price with proper decimal handling
  const formatPrice = (price) => {
    return Number(price).toFixed(2);
  };

  // Animate when cart amount changes
  useEffect(() => {
    // Only animate if we have previous values (not on initial render)
    if (prevSubtotal.current !== null && subtotal !== prevSubtotal.current) {
      if (subtotalRef.current) {
        animatePriceChange(subtotalRef.current, prevSubtotal.current, subtotal, `${currency} `);
      }
    }
    
    // Animate total changes with color coding
    if (prevTotal.current !== null && total !== prevTotal.current) {
      if (totalRef.current) {
        animatePriceChange(totalRef.current, prevTotal.current, total, `${currency} `);
      }
    }
    
    // Update previous values
    prevSubtotal.current = subtotal;
    prevTotal.current = total;
  }, [subtotal, total, currency, animatePriceChange]);

  // Handle empty cart state
  if (!hasItems) {
    
    return (
      <div className="w-full">
        <div className="text-2xl">
          <Title text1={"CART"} text2={"TOTAL"} />
        </div>
        <div className="flex flex-col gap-2 mt-2 text-sm">
          <div className="text-center py-4 text-gray-500">
            <p>Your cart is empty</p>
            <p className="text-xs mt-1">Add items to see total calculation</p>
          </div>
          <hr />
          <div className="flex justify-between text-gray-400">
            <b>Total</b>
            <b>{currency} 0.00</b>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if cart has items but amount is 0 (timing issue)
  const showTimingWarning = cartCount > 0 && cartAmount === 0;
  
  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>

      {showTimingWarning && import.meta.env.DEV && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded mb-2 text-xs">
          ⚠️ Cart has {cartCount} items but amount is Rs.0 - products may not be loaded yet
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'items'})</p>
          <p ref={subtotalRef} className="transition-all duration-300 font-medium">
            {currency} {formatPrice(subtotal)}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <p>Shipping Fee</p>
          <p className="font-medium">
            {currency} {formatPrice(delivery_fee)}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <b className="text-lg">Total</b>
          <b ref={totalRef} className="transition-all duration-300 text-lg text-orange-600">
            {currency} {formatPrice(total)}
          </b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
