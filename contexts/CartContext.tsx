'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'

export type CartState = Record<string, number>

type CartAction =
  | { type: 'ADD'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'SET'; id: string; qty: number }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; cart: CartState }

const STORAGE_KEY = 'dorst-b2c-cart'

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD':
      return { ...state, [action.id]: (state[action.id] ?? 0) + 1 }
    case 'REMOVE': {
      const next = Math.max(0, (state[action.id] ?? 0) - 1)
      if (next === 0) {
        const { [action.id]: _, ...rest } = state
        return rest
      }
      return { ...state, [action.id]: next }
    }
    case 'SET': {
      const qty = Math.max(0, Math.floor(action.qty) || 0)
      if (qty === 0) {
        const { [action.id]: _, ...rest } = state
        return rest
      }
      return { ...state, [action.id]: qty }
    }
    case 'CLEAR':
      return {}
    case 'HYDRATE':
      return action.cart
    default:
      return state
  }
}

function readStoredCart(): CartState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const cart: CartState = {}
    for (const [id, qty] of Object.entries(parsed as Record<string, unknown>)) {
      const n = typeof qty === 'number' ? qty : Number(qty)
      if (Number.isFinite(n) && n > 0) cart[id] = Math.floor(n)
    }
    return cart
  } catch {
    return {}
  }
}

interface CartCtx {
  cart: CartState
  hydrated: boolean
  addToCart: (id: string) => void
  removeFromCart: (id: string) => void
  setQuantity: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
}

const CartContext = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, {})
  const hydratedRef = useRef(false)
  const [hydrated, setHydrated] = useReducer(() => true, false)

  useEffect(() => {
    dispatch({ type: 'HYDRATE', cart: readStoredCart() })
    hydratedRef.current = true
    setHydrated()
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      /* ignore quota / private mode */
    }
  }, [cart])

  const totalItems = useMemo(
    () => Object.values(cart).reduce((a, b) => a + b, 0),
    [cart],
  )

  const value = useMemo<CartCtx>(
    () => ({
      cart,
      hydrated,
      addToCart: (id) => dispatch({ type: 'ADD', id }),
      removeFromCart: (id) => dispatch({ type: 'REMOVE', id }),
      setQuantity: (id, qty) => dispatch({ type: 'SET', id, qty }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
      totalItems,
    }),
    [cart, hydrated, totalItems],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
