/**
 * Incremental Wholesale Pricing Utility
 * 
 * Logic:
 * Units up to Min Qty (inclusive) are charged at Base Price.
 * Units above Min Qty receive the specified Unit Discount.
 */

export const calculateWholesalePriceTotal = (qty, basePrice, bulkRules, isBulkEnabled, aggregatedQty = null) => {
    const numQty = Number(qty) || 0;
    const numBasePrice = Number(basePrice) || 0;
    const totalQtyToEvaluate = aggregatedQty !== null ? Number(aggregatedQty) : numQty;

    if (!isBulkEnabled || !bulkRules || !Array.isArray(bulkRules) || bulkRules.length === 0) {
        return numQty * numBasePrice;
    }

    // Sort rules by minQty descending to find the highest applicable tier first
    const sortedRules = [...bulkRules].sort((a, b) => Number(b.minQty) - Number(a.minQty));
    const activeRule = sortedRules.find(r => totalQtyToEvaluate >= Number(r.minQty));
    
    if (activeRule) {
        const discountAmount = Number(activeRule.pricePerUnit || 0); // Discount value per unit
        const finalUnitPrice = Math.max(0, numBasePrice - discountAmount);
        
        const minQty = Number(activeRule.minQty);
        
        // Calculate the aggregate total cost for this product's pool
        const baseUnits = Math.min(totalQtyToEvaluate, minQty);
        const discountedUnits = Math.max(0, totalQtyToEvaluate - minQty);
        
        const totalPoolCost = (baseUnits * numBasePrice) + (discountedUnits * finalUnitPrice);
        
        // Prevent division by zero
        if (totalQtyToEvaluate === 0) return 0;
        
        // Distribute proportionally to this line item
        const proportion = numQty / totalQtyToEvaluate;
        return totalPoolCost * proportion;
    }

    return numQty * numBasePrice;
};

/**
 * Calculates a detailed financial breakdown for an item
 * @param {number} qty 
 * @param {number} basePrice 
 * @param {Array} bulkRules 
 * @param {boolean} isBulkEnabled 
 * @param {number} gstRate 
 */
export const calculateDetailedFinancials = (qty, basePrice, bulkRules, isBulkEnabled, gstRate = 0, aggregatedQty = null) => {
    const numQty = Number(qty) || 0;
    const numBasePrice = Number(basePrice) || 0;
    const rate = Number(gstRate) || 0;

    // 1. Calculate the raw discounted total (Taxable Amount)
    const netTaxableTotal = calculateWholesalePriceTotal(numQty, numBasePrice, bulkRules, isBulkEnabled, aggregatedQty);
    
    // 2. Calculate Savings based on original price vs taxable total
    const savings = calculateSavings(numQty, numBasePrice, netTaxableTotal);
    
    // 3. Calculate GST
    const taxAmount = (netTaxableTotal * rate) / 100;
    
    // 4. Final Payable
    const finalTotal = netTaxableTotal + taxAmount;

    return {
        itemBaseTotal: Number((numQty * numBasePrice).toFixed(2)),
        taxableAmount: Number(netTaxableTotal.toFixed(2)),
        savings: Number(savings.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        finalTotal: Number(finalTotal.toFixed(2))
    };
};

export const calculateSavings = (qty, basePrice, totalFinancial) => {
    const baseTotal = (Number(qty) || 0) * (Number(basePrice) || 0);
    return Math.max(0, baseTotal - (Number(totalFinancial) || 0));
};

