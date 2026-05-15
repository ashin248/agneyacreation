import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DesignReviewPanel from "../router/CustomDesigns/DesignReviewPanel.jsx";
import QualityControlActions from "../router/CustomDesigns/QualityControlActions.jsx";
import OrderListTable from "../router/Orders/OrderListTable.jsx";
import OrderDetailsCard from "../router/Orders/OrderDetailsCard.jsx";
import PageSubNav from '../components/PageSubNav.jsx';

function CustomDesigns() {
  const links = [
    { to: '/admin/custom-designs', label: 'Design Review Hub', end: true },
    { to: '/admin/custom-designs/orders', label: 'Studio Orders' },
  ];

  return (
    <>
      <PageSubNav title="Custom Design Pipeline" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route index element={<DesignReviewPanel />} />
            <Route path="review" element={<Navigate to="/admin/custom-designs" replace />} />
            <Route path="orders" element={<OrderListTable forcedType="CustomAndNormal" />} />
            <Route path="details/:id" element={<OrderDetailsCard />} />
            <Route path="quality-control" element={<QualityControlActions />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default CustomDesigns;

