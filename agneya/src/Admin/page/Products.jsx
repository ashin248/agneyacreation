import React from 'react';
import { Routes, Route } from 'react-router-dom';

import CreateProduct from '../router/Products/CreateProduct.jsx';
import EditProduct from '../router/Products/EditProduct.jsx';
import ProductListTable from '../router/Products/ProductListTable.jsx';

import PageSubNav from '../components/PageSubNav.jsx';

function Products() {
  const links = [
    { to: '/admin/products/list', label: 'Product List' },
    { to: '/admin/products/create', label: 'Add New Product' },
  ];

  return (
    <>
      <PageSubNav title="Products" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route path="list" element={<ProductListTable />} />
            <Route path="create" element={<CreateProduct />} />
            <Route path="edit/:id" element={<EditProduct />} />
            <Route index element={<ProductListTable />} />  
          </Routes>
        </div>
      </div>
    </>
  );
}

export default Products;

