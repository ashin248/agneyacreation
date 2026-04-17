import React from 'react';
import { Routes, Route } from 'react-router-dom';

import OrderListTable from '../router/Orders/OrderListTable.jsx';
import OrderDetailsCard from '../router/Orders/OrderDetailsCard.jsx';
import OrderFulfillmentTracker from '../router/Orders/OrderFulfillmentTracker.jsx';
import OrderActionsPanel from '../router/Orders/OrderActionsPanel.jsx';

import PageSubNav from '../components/PageSubNav.jsx';

function Orders() {
  const links = [
    { to: '/admin/orders/list', label: 'All Orders' },
  ];

  return (
    <>
      <PageSubNav title="Orders" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route path="list" element={<OrderListTable />} />
            <Route path="details/:id" element={<OrderDetailsCard />} />
            <Route path="actions" element={<OrderActionsPanel />} />
            <Route path="tracker" element={<OrderFulfillmentTracker />} />
            <Route index element={<OrderListTable />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default Orders;

