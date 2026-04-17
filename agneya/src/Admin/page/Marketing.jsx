import React from 'react';
import { Routes, Route } from 'react-router-dom';

import HomepageBannersGrid from '../router/Marketing/HomepageBannersGrid.jsx';
import PromoCodesTable from '../router/Marketing/PromoCodesTable.jsx';
import CreateCouponForm from '../router/Marketing/CreateCouponForm.jsx';
import FlashSaleScheduler from '../router/Marketing/FlashSaleScheduler.jsx';

import PageSubNav from '../components/PageSubNav.jsx';

function Marketing() {
    const links = [
        { to: '/admin/marketing/banners', label: 'Store Banners' },
        { to: '/admin/marketing/promo-codes', label: 'Coupons & Deals' },
        { to: '/admin/marketing/create-coupon', label: 'New Promotion' },
        { to: '/admin/marketing/flash-sale', label: 'Flash Events' },
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <PageSubNav title="Growth & Marketing" links={links} />
            <div className="px-6 pb-12">
                <div className="displayPage max-w-[1600px] mx-auto mt-4">
                    <Routes>
                        <Route path="banners" element={<HomepageBannersGrid />} />
                        <Route path="promo-codes" element={<PromoCodesTable />} />
                        <Route path="create-coupon" element={<CreateCouponForm />} />
                        <Route path="flash-sale" element={<FlashSaleScheduler />} />
                        <Route index element={<HomepageBannersGrid />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
}

export default Marketing;

