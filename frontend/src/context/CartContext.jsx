import { createContext, useContext, useState, useEffect } from 'react';
import { getCart } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();

  const refreshCart = async () => {
    if (user?.role === 'user') {
      try {
        const { data } = await getCart();
        setCartCount(data.items?.length || 0);
      } catch {
        setCartCount(0);
      }
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
