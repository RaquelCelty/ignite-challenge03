import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const hasProductInStorage = cart.some(item => item.id === productId);

      if (hasProductInStorage) {
        const productInCart = cart.find(item => item.id === productId);

        const productInput = {
          productId: productId,
          amount: productInCart!.amount + 1
        }

        updateProductAmount(productInput);
      } else {
        const productSelected = await api.get(`/products/${productId}`);
        const data = { ...productSelected.data, amount: 1 }
        setCart([...cart, data]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, data]));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const hasProductInStorage = cart.some(item => item.id === productId);

      if (hasProductInStorage) {
        var cartSlicedArray = cart.filter(product => {
          return product.id !== productId;
        });

        setCart(cartSlicedArray);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartSlicedArray));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;

      const response = await api.get(`/stock/${productId}`);
      const data = { ...response.data };

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCartArray = cart.map(item => (item.id === productId ? { ...item, amount } : item));
      setCart(newCartArray);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartArray));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
