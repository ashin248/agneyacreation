import React from "react";
import { Routes, Route } from "react-router-dom";
import UserListTable from "../router/Customers/UserListTable.jsx";
import UserProfileDetails from "../router/Customers/UserProfileDetails.jsx";
import BusinessGSTManager from "../router/Customers/BusinessGSTManager.jsx";
import CustomerOrderHistory from "../router/Customers/CustomerOrderHistory.jsx";

import PageSubNav from '../components/PageSubNav.jsx';

export default function Customers() {
  const links = [
    { to: '/admin/gst-manager/list', label: 'User Directory' },
    { to: '/admin/gst-manager/gst-manager', label: 'GST Compliance' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PageSubNav title="GST Manager" links={links} />
      <div className="px-6 pb-12">
        <div className="displayPage max-w-[1600px] mx-auto mt-4">
          <Routes>
            <Route path="list" element={<UserListTable />} />
            <Route path="profile/:id" element={<UserProfileDetails />} />
            <Route path="history/:id" element={<CustomerOrderHistory />} />
            <Route path="gst-manager" element={<BusinessGSTManager />} />
            <Route index element={<UserListTable />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

