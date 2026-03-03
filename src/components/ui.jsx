import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Plus, Trash2, AlertTriangle, Package, ChevronDown } from 'lucide-react';

// ── Page transition wrapper ──
export const PageWrap = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.3 }}
        className="p-4 lg:p-6"
    >
        {children}
    </motion.div>
);

// ── Staggered card entrance ──
export const StaggerCard = ({ children, index = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={className}
    >
        {children}
    </motion.div>
);

// ── Modal ──
export const Modal = ({ open, onClose, title, children, wide }) => {
    if (!open) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 bg-black/40 overflow-y-auto" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-xl shadow-2xl mx-auto mb-10 ${wide ? 'w-[95%] max-w-4xl' : 'w-[95%] max-w-xl'}`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-[#1A1A2E]">{title}</h2>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"><X size={20} /></button>
                    </div>
                    <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">{children}</div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// ── Status Badge ──
export const StatusBadge = ({ status, className = '' }) => {
    const colors = {
        'Upcoming': 'bg-blue-100 text-blue-700',
        'In Progress': 'bg-amber-100 text-amber-700',
        'Completed': 'bg-green-100 text-green-700',
        'Paid': 'bg-green-100 text-green-700',
        'Pending': 'bg-yellow-100 text-yellow-700',
        'Partial': 'bg-orange-100 text-orange-700',
        'Ordered': 'bg-blue-100 text-blue-700',
        'Received': 'bg-green-100 text-green-700',
        'Done': 'bg-green-100 text-green-700',
        'Present': 'bg-green-100 text-green-700',
        'Absent': 'bg-red-100 text-red-700',
        'Half-Day': 'bg-yellow-100 text-yellow-700',
        'In Stock': 'bg-green-100 text-green-700',
        'Low Stock': 'bg-yellow-100 text-yellow-700',
        'Out of Stock': 'bg-red-100 text-red-700',
    };
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-700'} ${className}`}>
            {status}
        </span>
    );
};

// ── Empty State ──
export const EmptyState = ({ icon: Icon = Package, title, message, actionLabel, onAction }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-[#F7F3EE] flex items-center justify-center mb-4">
            <Icon size={36} className="text-[#E8B86D]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A2E] mb-1">{title}</h3>
        <p className="text-sm text-[#7A7A7A] mb-4 max-w-sm">{message}</p>
        {actionLabel && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onAction}
                className="px-5 py-2.5 bg-[#E8B86D] text-white rounded-lg font-medium text-sm shadow-lg shadow-amber-200/40 cursor-pointer">
                {actionLabel}
            </motion.button>
        )}
    </motion.div>
);

// ── FAB (Floating Action Button) ──
export const FAB = ({ onClick, icon: Icon = Plus, label }) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 flex items-center gap-2 px-4 py-3 lg:px-5 lg:py-3.5 bg-[#E8B86D] text-white rounded-full shadow-xl shadow-amber-300/30 font-medium text-sm cursor-pointer"
    >
        <Icon size={20} />
        {label}
    </motion.button>
);

// ── Star Rating ──
export const StarRating = ({ value, onChange, readonly = false }) => (
    <div className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" disabled={readonly}
                className={`star-btn ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !readonly && onChange?.(s)}>
                <Star size={20} className={s <= value ? 'fill-[#E8B86D] text-[#E8B86D]' : 'text-gray-300'} />
            </button>
        ))}
    </div>
);

// ── Input field ──
export const Field = ({ label, required, error, children }) => (
    <div className="mb-3">
        <label className="block text-xs font-semibold text-[#7A7A7A] uppercase tracking-wider mb-1">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
);

export const Input = (props) => (
    <input {...props} className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D] transition-colors ${props.className || ''}`} />
);

export const Select = ({ options, ...props }) => (
    <div className="relative">
        <select {...props} className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D] transition-colors appearance-none bg-white ${props.className || ''}`}>
            <option value="">Select...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
);

export const Textarea = (props) => (
    <textarea {...props} className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D] transition-colors resize-y min-h-[80px] ${props.className || ''}`} />
);

// ── Notification (Toast) ──
export const Notification = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        info: 'bg-[#1A1A2E] text-white',
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-amber-500 text-white',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[300px] justify-between ${styles[type]}`}
        >
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={16} /></button>
        </motion.div>
    );
};

// ── Online Status Hook ──
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    return isOnline;
};

// ── Button ──
export const Btn = ({ children, variant = 'primary', className = '', loading = false, loadingText, ...props }) => {
    const base = 'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed';
    const styles = {
        primary: 'bg-[#E8B86D] text-white shadow-md shadow-amber-200/30 hover:bg-[#c99a4e]',
        secondary: 'bg-[#1A1A2E] text-white hover:bg-[#25254a]',
        outline: 'border border-gray-200 text-[#2D2D2D] hover:bg-gray-50',
        danger: 'bg-[#E53935] text-white hover:bg-red-700',
        ghost: 'text-[#7A7A7A] hover:bg-gray-100',
    };

    return (
        <motion.button
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            disabled={loading || props.disabled}
            className={`${base} ${styles[variant]} ${className}`}
            {...props}
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {loading ? (loadingText || children) : children}
        </motion.button>
    );
};

// ── KPI Card ──
export const KPICard = ({ label, value, icon: Icon, color = '#E8B86D', index = 0 }) => {
    const [display, setDisplay] = useState(0);
    const numVal = typeof value === 'number' ? value : parseInt(String(value).replace(/[^\d]/g, '')) || 0;

    useEffect(() => {
        let start = 0;
        const dur = 1000;
        const step = 16;
        const inc = numVal / (dur / step);
        const timer = setInterval(() => {
            start += inc;
            if (start >= numVal) { setDisplay(numVal); clearInterval(timer); }
            else setDisplay(Math.floor(start));
        }, step);
        return () => clearInterval(timer);
    }, [numVal]);

    return (
        <StaggerCard index={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">{label}</p>
                    <p className="text-xl lg:text-2xl font-bold" style={{ color }}>{typeof value === 'string' && value.startsWith('₹') ? '₹' + display.toLocaleString('en-IN') : display}</p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
                    <Icon size={20} style={{ color }} />
                </div>
            </div>
        </StaggerCard>
    );
};

// ── Tab Bar ──
export const TabBar = ({ tabs, active, onChange }) => (
    <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
            <button key={t} onClick={() => onChange(t)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer border-b-2 ${active === t ? 'border-[#E8B86D] text-[#1A1A2E]' : 'border-transparent text-[#7A7A7A] hover:text-[#2D2D2D]'}`}>
                {t}
            </button>
        ))}
    </div>
);

// ── Search Bar ──
export const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
    <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-xs focus:outline-none focus:border-[#E8B86D] focus:ring-1 focus:ring-[#E8B86D] transition-colors"
    />
);
