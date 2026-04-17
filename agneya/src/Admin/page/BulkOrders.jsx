import React from "react";
import { Routes, Route } from "react-router-dom";
import B2BUserApprovals from "../router/BulkOrders/B2BUserApprovals.jsx";
import WholesaleInquiriesTable from "../router/BulkOrders/WholesaleInquiriesTable.jsx";
import CustomQuoteGenerator from "../router/BulkOrders/CustomQuoteGenerator.jsx";
import B2BOrdersTracker from "../router/BulkOrders/B2BOrdersTracker.jsx";

import PageSubNav from '../components/PageSubNav.jsx';

function BulkOrders() {
  const links = [
    { to: '/admin/bulk-orders/inquiries', label: 'Wholesale Inquiries' },
    { to: '/admin/bulk-orders/approvals', label: 'B2B Approvals' },
    { to: '/admin/bulk-orders/quote-gen', label: 'Quote Generator' },
    { to: '/admin/bulk-orders/tracker', label: 'B2B Tracker' },
  ];

  return (
    <>
      <PageSubNav title="Bulk Orders" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route path="inquiries" element={<WholesaleInquiriesTable />} />
            <Route path="approvals" element={<B2BUserApprovals />} />
            <Route path="quote-gen" element={<CustomQuoteGenerator />} />
            <Route path="tracker" element={<B2BOrdersTracker />} />
            <Route index element={<WholesaleInquiriesTable />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default BulkOrders;

