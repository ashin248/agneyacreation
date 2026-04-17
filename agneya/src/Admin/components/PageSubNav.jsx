import React from 'react';
import { NavLink } from 'react-router-dom';

const PageSubNav = ({ title, links }) => {
  return (
    <div className="bg-white border-b border-gray-100 px-6 py-4 mb-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</h1>
        </div>
        
        <nav className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default PageSubNav;

