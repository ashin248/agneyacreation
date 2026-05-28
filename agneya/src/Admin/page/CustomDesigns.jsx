import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import OrderListTable from "../router/Orders/OrderListTable.jsx";
import OrderDetailsCard from "../router/Orders/OrderDetailsCard.jsx";
import PageSubNav from '../components/PageSubNav.jsx';

function CustomDesigns() {
  const links = [
    { to: '/admin/custom-designs/normal', label: 'Normal Orders' },
    { to: '/admin/custom-designs/3d', label: '3D Custom Orders' },
    { to: '/admin/custom-designs/2d', label: '2D Custom Orders' },
  ];

  return (
    <>
      <PageSubNav title="Custom Design Pipeline" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route index element={<Navigate to="/admin/custom-designs/normal" replace />} />
            <Route path="normal" element={<OrderListTable forcedType="NORMAL" />} />
            <Route path="3d" element={<OrderListTable forcedType="3D_STUDIO" />} />
            <Route path="2d" element={<OrderListTable forcedType="2D_STUDIO" />} />
            <Route path="details/:id" element={<OrderDetailsCard />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default CustomDesigns;

