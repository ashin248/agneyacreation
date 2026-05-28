import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import OrderListTable from '../router/Orders/OrderListTable.jsx';
import OrderDetailsCard from '../router/Orders/OrderDetailsCard.jsx';
import PageSubNav from '../components/PageSubNav.jsx';

function DesignAssistance() {
  const location = useLocation();

  const links = [
    { to: '/admin/design-assistance/orders', label: 'Manual Brief Orders' },
  ];

  return (
    <>
      <PageSubNav title="Design Assistance" links={links} />
      
      <div className="px-8 pb-12">
        <div className="displayPage">
          <Routes>
            <Route path="orders" element={<OrderListTable forcedType="DESIGN_ASSISTANCE" />} />
            <Route path="details/:id" element={<OrderDetailsCard />} />
            <Route index element={<Navigate to="orders" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default DesignAssistance;
