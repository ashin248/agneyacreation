import React from 'react';

const BulkPricingManager = ({ isBulkEnabled, setIsBulkEnabled, bulkRules, setBulkRules, globalError }) => {

  // Toggle handling
  const handleToggle = () => {
    setIsBulkEnabled(!isBulkEnabled);
  };

  // Generic field handling
  const handleChange = (id, field, value) => {
    setBulkRules(bulkRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };

  // Add rule
  const handleAddRule = () => {
    setBulkRules([
      ...bulkRules,
      {
        id: Date.now().toString(),
        minQty: 2,
        maxQty: '',
        pricePerUnit: '',
      }
    ]);
  };

  // Remove rule
  const handleRemoveRule = (idToRemove) => {
    setBulkRules(bulkRules.filter(rule => rule.id !== idToRemove));
  };

  // Validation function for a single rule (visual only)
  const getRuleError = (rule) => {
    if (rule.minQty < 2) {
      return "Min Qty must be at least 2.";
    }
    if (rule.maxQty !== '' && Number(rule.maxQty) < Number(rule.minQty)) {
      return `Max Qty (${rule.maxQty}) cannot be less than Min Qty (${rule.minQty}).`;
    }
    if (rule.pricePerUnit !== '' && Number(rule.pricePerUnit) < 0) {
      return "Price cannot be negative.";
    }
    return null;
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full mt-6 transition-all duration-300">
      
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-5 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Bulk/Wholesale Pricing</h2>
          <p className="text-gray-500 text-sm mt-1">Set a discount amount for each unit ordered above the minimum quantity threshold.</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <span className={`text-sm font-medium ${isBulkEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
            {isBulkEnabled ? 'Enabled' : 'Disabled'}
          </span>
          {/* Custom Tailwind Toggle */}
          <button 
            type="button"
            role="switch"
            aria-checked={isBulkEnabled}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
              isBulkEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isBulkEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {globalError && (
        <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-md border border-red-200 flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {globalError}
        </div>
      )}

      {/* Conditional Form Rendering */}
      {!isBulkEnabled ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-gray-500 font-medium text-lg">Bulk pricing is currently disabled.</p>
          <p className="text-gray-400 text-sm mt-1">Enable it via the toggle above to configure wholesale tiers.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {bulkRules.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-3">No pricing rules configured.</p>
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              >
                + Add Rule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Min Qty
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Max Qty
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Unit Discount (₹)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bulkRules.map((rule, index) => {
                    const ruleError = getRuleError(rule);
                    
                    return (
                      <tr key={rule.id} className={ruleError ? 'bg-red-50' : 'hover:bg-gray-50 transition-colors'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="2"
                            value={rule.minQty}
                            onChange={(e) => handleChange(rule.id, 'minQty', e.target.value)}
                            className={`w-full max-w-[120px] px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${
                              rule.minQty < 2 ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap relative">
                          <input
                            type="number"
                            value={rule.maxQty}
                            onChange={(e) => handleChange(rule.id, 'maxQty', e.target.value)}
                            className={`w-full max-w-[120px] px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${
                              ruleError && ruleError.includes('Max Qty') ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {(ruleError && ruleError.includes('Max Qty')) && (
                             <span className="absolute -bottom-1 left-6 text-xs text-red-600 font-medium">Illogical Max</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={rule.pricePerUnit}
                            onChange={(e) => handleChange(rule.id, 'pricePerUnit', e.target.value)}
                            className={`w-full max-w-[150px] px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${
                              ruleError && ruleError.includes('Price') ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="Remove Rule"
                          >
                            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Pricing Rule
                </button>
              </div>
            </div>
          )}

          {/* Logic Explainer */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Incremental Wholesale Logic</p>
                   <p className="text-xs text-blue-700 leading-relaxed">
                      Pricing is calculated step-by-step. Units up to the <b>Min Qty</b> are charged at Sale Price. 
                      Units <b>above</b> that threshold receive the specified <b>Unit Discount</b> from the base price.
                   </p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkPricingManager;

