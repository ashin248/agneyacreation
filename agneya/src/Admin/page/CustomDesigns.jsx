import React from "react";
import { Routes, Route } from "react-router-dom";
import DesignReviewPanel from "../router/CustomDesigns/DesignReviewPanel.jsx";
import QualityControlActions from "../router/CustomDesigns/QualityControlActions.jsx";

import PageSubNav from '../components/PageSubNav.jsx';

function CustomDesigns() {
  const links = [
    { to: '/admin/custom-designs/review', label: 'Design Review Hub' },
    { to: '/admin/custom-designs/quality-control', label: 'QC Guidelines' },
  ];

  return (
    <>
      <PageSubNav title="Custom Design Pipeline" links={links} />
      <div className="px-6 pb-6">
        <div className="displayPage">
          <Routes>
            <Route path="review" element={<DesignReviewPanel />} />
            <Route path="quality-control" element={<QualityControlActions />} />
            <Route index element={<DesignReviewPanel />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default CustomDesigns;

