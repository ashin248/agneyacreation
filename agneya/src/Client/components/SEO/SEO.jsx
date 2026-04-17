import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  productPrice,
  productCurrency = 'INR'
}) => {
  const siteName = 'Agneya Creations';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonicalUrl = `https://agneyacreations.com${url || ''}`;
  const metaImage = image || 'https://agneyacreations.com/logo.png';

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'Premium custom design and high-fidelity manufacturing for unique assets.'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />

      {/* Product Specific (if applicable) */}
      {type === 'product' && productPrice && (
        <>
          <meta property="product:price:amount" content={productPrice} />
          <meta property="product:price:currency" content={productCurrency} />
        </>
      )}
    </Helmet>
  );
};

export default SEO;
