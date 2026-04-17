import React from 'react';

const ProductSchema = ({ product }) => {
  if (!product) return null;

  const currentPrice = product.discountPrice || product.basePrice || 0;
  const originalPrice = product.originalPrice || product.basePrice || 0;
  
  // B2B Tiered Pricing Mapping
  const priceSpecification = product.bulkRules?.map(rule => ({
    "@type": "UnitPriceSpecification",
    "price": Math.max(0, currentPrice - (rule.pricePerUnit || 0)),
    "priceCurrency": "INR",
    "referenceQuantity": {
      "@type": "QuantitativeValue",
      "value": rule.minQty,
      "unitCode": "C62" // UnitCode for "Units" or "Pieces"
    }
  })) || [];

  const schemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [product.image],
    "description": product.description,
    "sku": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": "Agneya"
    },
    "offers": {
      "@type": "AggregateOffer",
      "url": `https://agneyacreations.com/product/${product._id}`,
      "priceCurrency": "INR",
      "lowPrice": priceSpecification.length > 0 
        ? Math.min(...priceSpecification.map(p => p.price)) 
        : currentPrice,
      "highPrice": originalPrice,
      "offerCount": product.bulkRules?.length || 1,
      "availability": "https://schema.org/InStock",
      "priceSpecification": priceSpecification
    }
  };

  return (
    <script type="application/ld+json">
      {JSON.stringify(schemaData)}
    </script>
  );
};

export default ProductSchema;
