import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { calculateWholesalePriceTotal, calculateSavings, calculateDetailedFinancials } from '../utils/pricingUtils';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_CART': {
            const { productId, selectedVariation } = action.payload;
            // Uniqueness is defined by Product ID + Variation SKU (if variations exist)
            const variationKey = selectedVariation?.sku || 'standard';
            
            const existingItemIndex = state.findIndex(item => 
                item.productId === productId && 
                (item.selectedVariation?.sku || 'standard') === variationKey
            );

            if (existingItemIndex > -1) {
                const newState = [...state];
                newState[existingItemIndex].quantity += (action.payload.quantity || 1);
                return newState;
            }
            return [...state, { ...action.payload, quantity: action.payload.quantity || 1 }];
        }
        case 'REMOVE_FROM_CART':
            // Match variation SKU for removal as well
            return state.filter(item => 
                !(item.productId === action.payload.productId && 
                  (item.selectedVariation?.sku || 'standard') === (action.payload.sku || 'standard'))
            );
        case 'UPDATE_QUANTITY':
            return state.map(item =>
                (item.productId === action.payload.productId && 
                 (item.selectedVariation?.sku || 'standard') === (action.payload.sku || 'standard'))
                    ? { 
                        ...item, 
                        quantity: Math.max(1, action.payload.quantity),
                        unitPrice: action.payload.unitPrice !== undefined ? action.payload.unitPrice : item.unitPrice
                      }
                    : item
            );
        case 'CLEAR_CART':
            return [];
        case 'SET_CART':
            return action.payload;
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, [], () => {
        const localData = localStorage.getItem('agneya_cart');
        return localData ? JSON.parse(localData) : [];
    });

    useEffect(() => {
        localStorage.setItem('agneya_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
    };

    const removeFromCart = (productId, sku = 'standard') => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: { productId, sku } });
    };

    const updateQuantity = (productId, quantity, sku = 'standard', unitPrice = undefined) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, sku, unitPrice } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // INCREMENTAL PRICING ENGINE - Using shared utility
    const calculateItemFinancials = (item) => {
        const basePrice = Number(item.unitPrice || 0);
        const qty = Number(item.quantity || 1);
        const variantModifier = Number(item.selectedVariation?.priceModifier || 0);
        const effectiveBasePrice = basePrice + variantModifier;
        const gstRate = Number(item.gstRate || 0);

        const aggregatedProductQty = cart
             .filter(c => c.productId === item.productId && c.itemType === item.itemType)
             .reduce((sum, c) => sum + Number(c.quantity || 1), 0);

        return calculateDetailedFinancials(
            qty, 
            effectiveBasePrice, 
            item.bulkRules, 
            item.isBulkEnabled,
            gstRate,
            aggregatedProductQty
        );
    };

    const isBulkOrder = cart.some(item => item.isBulkEnabled && item.quantity >= (item.bulkRules?.[0]?.minQty || 0));
    
    const cartTotals = cart.reduce((acc, item) => {
        const financials = calculateItemFinancials(item);
        return {
            total: Number((acc.total + financials.finalTotal).toFixed(2)),
            taxableAmount: Number((acc.taxableAmount + financials.taxableAmount).toFixed(2)),
            savings: Number((acc.savings + financials.savings).toFixed(2)),
            tax: Number((acc.tax + financials.taxAmount).toFixed(2))
        };
    }, { total: 0, taxableAmount: 0, savings: 0, tax: 0 });

    const cartTotal = cartTotals.total;
    const totalSavings = cartTotals.savings;
    const totalTax = cartTotals.tax;
    const totalTaxable = cartTotals.taxableAmount;

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            cartCount, 
            cartTotal, 
            totalSavings,
            totalTax,
            totalTaxable,
            isBulkOrder,
            calculateItemFinancials // Exporting for line-item breakdown UI
        }}>
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

