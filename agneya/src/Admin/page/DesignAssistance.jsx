import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderListTable from '../router/Orders/OrderListTable.jsx';
import OrderDetailsCard from '../router/Orders/OrderDetailsCard.jsx';
import DesignInquiryTable from '../router/Orders/DesignInquiryTable.jsx';
import PageSubNav from '../components/PageSubNav.jsx';

function DesignAssistance() {
  const location = useLocation();

  const links = [
    { to: '/admin/design-assistance/inquiries', label: 'Inquiry Pipeline' },
    { to: '/admin/design-assistance/orders', label: 'Manual Brief Orders' },
  ];

  return (
    <>
      <PageSubNav title="Inquiry Response Hub" links={links} />
      
      <div className="px-8 pb-12">
        <div className="displayPage">
          <Routes>
            <Route path="inquiries" element={<DesignInquiryTable />} />
            <Route path="orders" element={<OrderListTable forcedType="Manual" />} />
            <Route path="details/:id" element={<OrderDetailsCard />} />
            <Route index element={<DesignInquiryTable />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default DesignAssistance;
