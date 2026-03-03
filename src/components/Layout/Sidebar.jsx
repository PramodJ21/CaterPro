import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Calendar, Package, ShoppingCart, Users,
    FileText, ChevronLeft, ChevronRight, ChevronDown, UtensilsCrossed,
    ClipboardList, MessageSquare, AlertTriangle
} from 'lucide-react';
import { getData, KEYS } from '../../utils/storage';
import { getStockStatus } from '../../utils/helpers';

const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    {
        label: 'Events', icon: Calendar, path: '/events',
        children: [
            { label: 'All Events', path: '/events' },
        ]
    },
    { label: 'Recipe Library', icon: UtensilsCrossed, path: '/recipes' },
    { label: 'Inventory', icon: Package, path: '/inventory' },
    { label: 'Procurement', icon: ShoppingCart, path: '/procurement' },
    { label: 'Workers', icon: Users, path: '/workers' },
    { label: 'Action Items', icon: ClipboardList, path: '/action-items' },
    { label: 'Reports', icon: FileText, path: '/reports' },
];

export default function Sidebar({ collapsed, setCollapsed, isOpen, setIsOpen, isMobile }) {
    const location = useLocation();
    const [openSections, setOpenSections] = useState({});
    const [lowStockCount, setLowStockCount] = useState(0);

    useEffect(() => {
        getData(KEYS.INVENTORY).then(data => {
            const count = data.filter(i => getStockStatus(i) === 'Low Stock' || getStockStatus(i) === 'Out of Stock').length;
            setLowStockCount(count);
        });
    }, [location.pathname]); // Re-fetch occasionally, such as on navigation

    const toggle = (label) => setOpenSections(p => ({ ...p, [label]: !p[label] }));

    return (
        <>
            {/* Backdrop for mobile */}
            <AnimatePresence>
                {isMobile && isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={isMobile ? { x: -260 } : false}
                animate={{
                    width: isMobile ? 260 : (collapsed ? 72 : 260),
                    x: isMobile ? (isOpen ? 0 : -260) : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="fixed left-0 top-0 h-screen bg-[#1A1A2E] text-white z-50 flex flex-col shadow-xl"
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                    <div className="w-9 h-9 bg-[#E8B86D] rounded-lg flex items-center justify-center font-bold text-[#1A1A2E] text-sm shrink-0">
                        CP
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="font-bold text-lg tracking-tight whitespace-nowrap">CaterPro</motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                        const hasChildren = item.children && item.children.length > 0;
                        const isOpen = openSections[item.label];

                        return (
                            <div key={item.label} className="mb-0.5">
                                {hasChildren && !collapsed ? (
                                    <>
                                        <button onClick={() => toggle(item.label)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${isActive ? 'bg-white/10 text-[#E8B86D]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                                            <Icon size={20} className="shrink-0" />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>{isOpen && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                {item.children.map(c => (
                                                    <NavLink key={c.path} to={c.path}
                                                        onClick={() => isMobile && setIsOpen(false)}
                                                        className={({ isActive: a }) => `block pl-11 pr-3 py-2 text-xs rounded-lg transition-colors ${a ? 'text-[#E8B86D]' : 'text-gray-400 hover:text-white'}`}>
                                                        {c.label}
                                                    </NavLink>
                                                ))}
                                            </motion.div>
                                        )}</AnimatePresence>
                                    </>
                                ) : (
                                    <NavLink to={item.path} end={item.path === '/'}
                                        onClick={() => isMobile && setIsOpen(false)}
                                        className={({ isActive: a }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative ${a ? 'bg-white/10 text-[#E8B86D]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                        title={collapsed ? item.label : undefined}>
                                        {({ isActive: a }) => (
                                            <>
                                                {a && <motion.div layoutId="nav-indicator" className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#E8B86D] rounded-r" />}
                                                <Icon size={20} className="shrink-0" />
                                                <AnimatePresence>
                                                    {(!collapsed || isMobile) && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">{item.label}</motion.span>}
                                                </AnimatePresence>
                                                {item.label === 'Inventory' && lowStockCount > 0 && (
                                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{lowStockCount}</span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Collapse toggle (only desktop) */}
                {!isMobile && (
                    <button onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center justify-center p-3 border-t border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer">
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                    </button>
                )}
            </motion.aside>
        </>
    );
}
