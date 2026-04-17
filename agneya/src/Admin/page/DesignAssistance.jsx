import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import OrderListTable from '../router/Orders/OrderListTable.jsx';
import OrderDetailsCard from '../router/Orders/OrderDetailsCard.jsx';
import DesignInquiryTable from '../router/Orders/DesignInquiryTable.jsx';
import PageSubNav from '../components/PageSubNav.jsx';

function DesignAssistance() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.includes('inquiries') ? 'inquiries' : 'orders');

  const links = [
    { to: '/admin/design-assistance/inquiries', label: 'Inquiry Pipeline' },
  ];

  return (
    <>
      <PageSubNav title="Inquiry Response Hub" links={links} />
      
      <div className="px-8 pb-12">
        {/* Statistics Header for the current view */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-px w-8 bg-indigo-600"></div>
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em]">Inquiry Management</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                Customer Briefs
              </h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                Review and respond to custom design inquiries before they convert to orders.
              </p>
           </div>
        </div>

        <div className="displayPage">
          <Routes>
            <Route path="inquiries" element={<DesignInquiryTable />} />
            <Route index element={<DesignInquiryTable />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default DesignAssistance;
