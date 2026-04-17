import React from "react";
import { Routes, Route } from "react-router-dom";

import CompanyProfileForm from "../router/Settings/CompanyProfileForm.jsx";
import LegalAndTaxSettings from "../router/Settings/LegalAndTaxSettings.jsx";
import ShippingRulesManager from "../router/Settings/ShippingRulesManager.jsx";
import PaymentGatewayToggles from "../router/Settings/PaymentGatewayToggles.jsx";

import PageSubNav from '../components/PageSubNav.jsx';

function Settings() {
  const links = [
    { to: '/admin/settings/profile', label: 'Identity' },
    { to: '/admin/settings/legal', label: 'Tax & Legal' },
    { to: '/admin/settings/shipping', label: 'Logistics' },
    { to: '/admin/settings/payments', label: 'Finance' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PageSubNav title="System Configuration" links={links} />
      <div className="px-6 pb-12">
        <div className="displayPage max-w-[1600px] mx-auto mt-4">
          <Routes>
            <Route path="profile" element={<CompanyProfileForm />} />
            <Route path="legal" element={<LegalAndTaxSettings />} />
            <Route path="shipping" element={<ShippingRulesManager />} />
            <Route path="payments" element={<PaymentGatewayToggles />} />
            <Route index element={<CompanyProfileForm />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Settings;

