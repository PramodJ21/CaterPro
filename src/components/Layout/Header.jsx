import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, Menu, X } from 'lucide-react';

const breadcrumbMap = {
    '/': 'Dashboard',
    '/events': 'Events',
    '/inventory': 'Inventory',
    '/procurement': 'Procurement',
    '/workers': 'Workers',
    '/recipes': 'Recipe Library',
    '/action-items': 'Action Items',
    '/reports': 'Reports',
};

export default function Header({ currentEvent, globalSearch, setGlobalSearch, toggleSidebar, isMobile }) {
    const location = useLocation();
    const pathParts = location.pathname.split('/').filter(Boolean);

    const crumbs = [{ label: 'Home', path: '/' }];
    if (pathParts.length > 0) {
        let accum = '';
        pathParts.forEach((p, i) => {
            accum += '/' + p;
            const label = breadcrumbMap[accum] || decodeURIComponent(p).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            crumbs.push({ label, path: accum });
        });
    }

    return (
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 h-16">
                <div className="flex items-center gap-3">
                    {isMobile && (
                        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <Menu size={22} className="text-[#1A1A2E]" />
                        </button>
                    )}
                    <h1 className="text-lg lg:text-xl font-bold text-[#1A1A2E]">
                        {breadcrumbMap[location.pathname] || 'CaterPro'}
                    </h1>
                    {currentEvent && !isMobile && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#E8B86D]/10 rounded-lg">
                            <span className="text-xs font-semibold text-[#E8B86D] uppercase tracking-wider">Event:</span>
                            <span className="text-sm font-medium text-[#1A1A2E]">{currentEvent.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 lg:gap-3">
                    <div className={`relative ${isMobile ? 'flex-1' : ''}`}>
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            placeholder={isMobile ? "Search..." : "Search events, items, workers..."}
                            className={`${isMobile ? 'w-full max-w-[120px] focus:max-w-[200px]' : 'w-64'} pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D] transition-all`}
                        />
                    </div>
                    {!isMobile && (
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative cursor-pointer">
                            <Bell size={20} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </div>
            {/* Breadcrumbs (only desktop) */}
            {!isMobile && (
                <div className="px-6 pb-2 flex items-center gap-1.5 text-xs text-[#7A7A7A]">
                    {crumbs.map((c, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                            {i > 0 && <span>/</span>}
                            {i === crumbs.length - 1 ? (
                                <span className="font-medium text-[#2D2D2D]">{c.label}</span>
                            ) : (
                                <Link to={c.path} className="hover:text-[#E8B86D] transition-colors">{c.label}</Link>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </header>
    );
}
