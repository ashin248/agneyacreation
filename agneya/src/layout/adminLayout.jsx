import { Link, useLocation, Outlet } from 'react-router-dom';
const logoImg = '/logo.png';


const adminLayout = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: 'bi-grid-1x2-fill' },
    { name: 'Products', href: '/admin/products', icon: 'bi-box-seam-fill' },
    { name: 'Orders', href: '/admin/orders', icon: 'bi-cart-fill' },
    { name: 'Design Assistance', href: '/admin/design-assistance/orders', icon: 'bi-pencil-square' },
    { name: 'Customer Designs', href: '/admin/custom-designs', icon: 'bi-palette-fill' },
    { name: 'Wholesale Orders', href: '/admin/bulk-orders', icon: 'bi-stack' },
    { name: 'Business Invoices', href: '/admin/gst-manager', icon: 'bi-building-fill-check' },
    { name: 'Ads & Discounts', href: '/admin/marketing', icon: 'bi-megaphone-fill' },
    { name: 'Store Settings', href: '/admin/settings', icon: 'bi-gear-fill' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Premium Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col shadow-xl">
        <div className="p-8 border-b border-slate-800/50">
           <Link to="/" className="flex items-center gap-3">
              <img src={logoImg} alt="Agneya" className="h-10 w-auto transition-transform hover:scale-105" />
           </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <i className={`bi ${item.icon} text-lg ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}></i>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <i className="bi bi-box-arrow-left text-lg"></i>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-0 px-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default adminLayout;

