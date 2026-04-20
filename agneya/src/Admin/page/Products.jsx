import React from 'react';
import { Routes, Route } from 'react-router-dom';

import CreateProduct from '../router/Products/CreateProduct.jsx';
import EditProduct from '../router/Products/EditProduct.jsx';
import ProductListTable from '../router/Products/ProductListTable.jsx';
import TwoDModelLibrary from '../router/Products/TwoDModelLibrary.jsx';

import PageSubNav from '../components/PageSubNav.jsx';

function Products() {
  const links = [
    { to: '/admin/products/list', label: 'Product List' },
    { to: '/admin/products/create', label: 'Add New Product' },
    { to: '/admin/products/models', label: 'Model Library' },
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
            <Route path="models" element={<TwoDModelLibrary />} />
            <Route index element={<ProductListTable />} />  
          </Routes>
        </div>
      </div>
    </>
  );
}

export default Products;

