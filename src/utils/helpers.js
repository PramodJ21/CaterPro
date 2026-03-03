import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = parseISO(dateStr);
        return isValid(d) ? format(d, 'dd MMM yyyy') : dateStr;
    } catch {
        return dateStr;
    }
};

export const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
};

export const getStatusColor = (status) => {
    const map = {
        'Upcoming': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-amber-100 text-amber-800',
        'Completed': 'bg-green-100 text-green-800',
        'Paid': 'bg-green-100 text-green-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Partial': 'bg-orange-100 text-orange-800',
        'Ordered': 'bg-blue-100 text-blue-800',
        'Received': 'bg-green-100 text-green-800',
        'Done': 'bg-green-100 text-green-800',
        'Present': 'bg-green-100 text-green-800',
        'Absent': 'bg-red-100 text-red-800',
        'Half-Day': 'bg-yellow-100 text-yellow-800',
        'In Stock': 'bg-green-100 text-green-800',
        'Low Stock': 'bg-yellow-100 text-yellow-800',
        'Out of Stock': 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
};

export const getStockStatus = (item) => {
    if (item.currentStock <= 0) return 'Out of Stock';
    if (item.currentStock <= item.reorderLevel) return 'Low Stock';
    return 'In Stock';
};

export const getLeftoverColor = (pct) => {
    if (pct < 10) return 'bg-green-50';
    if (pct <= 25) return 'bg-yellow-50';
    return 'bg-red-50';
};

export const EVENT_TYPES = ['Wedding', 'Corporate', 'Birthday', 'Other'];
export const MENU_TYPES = ['Veg', 'Non-Veg', 'Both'];
export const EVENT_STATUSES = ['Upcoming', 'In Progress', 'Completed'];
export const WORKER_ROLES = ['Chef', 'Helper', 'Server', 'Supervisor', 'Driver'];
export const CATEGORIES = ['Starter', 'Main', 'Dessert', 'Beverage', 'Snack'];
export const INVENTORY_CATEGORIES = ['Grains', 'Dairy', 'Meat', 'Produce', 'Oils', 'Spices', 'Other'];
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial'];
export const PROCUREMENT_CATEGORIES = ['Produce', 'Dairy', 'Meat', 'Grains', 'Oils', 'Spices', 'Other'];
