import React, { useState, useEffect } from 'react';
import { getData, KEYS } from '../utils/storage';
import { formatDate, formatCurrency, PAYMENT_STATUSES, PROCUREMENT_CATEGORIES } from '../utils/helpers';
import { PageWrap, EmptyState, StatusBadge, SearchBar } from '../components/ui';
import { ShoppingCart } from 'lucide-react';

export default function Procurement() {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getData(KEYS.PROCUREMENT), getData(KEYS.EVENTS)]).then(([pData, eData]) => {
            setItems(pData);
            setEvents(eData);
            setLoading(false);
        });
    }, []);

    const filtered = items.filter(p => {
        const q = search.toLowerCase();
        return (!q || p.vendorName.toLowerCase().includes(q) || p.itemName.toLowerCase().includes(q)) && (!filterStatus || p.paymentStatus === filterStatus);
    });

    return (
        <PageWrap>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Procurement</h1>
                <p className="text-sm text-[#7A7A7A]">{items.length} entries across all events — {formatCurrency(items.reduce((s, p) => s + (p.totalCost || 0), 0))} total</p>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                <SearchBar value={search} onChange={setSearch} placeholder="Search vendor or item..." />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All Status</option>{PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading procurement...</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No Procurement Records" message="Procurement entries are added from each event's detail page." />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                                <th className="text-left px-4 py-3">Event</th><th className="text-left px-4 py-3">Vendor</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Payment</th>
                            </tr></thead>
                            <tbody>
                                {filtered.map(p => {
                                    const ev = events.find(e => e.id === p.eventId);
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-[#E8B86D]">{ev?.name || '—'}</td>
                                            <td className="px-4 py-3">{p.vendorName}</td>
                                            <td className="px-4 py-3 text-center">{p.itemName}</td>
                                            <td className="px-4 py-3 text-center">{p.quantity} {p.unit}</td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.totalCost)}</td>
                                            <td className="px-4 py-3 text-center text-[#7A7A7A]">{formatDate(p.purchaseDate)}</td>
                                            <td className="px-4 py-3 text-center"><StatusBadge status={p.paymentStatus} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </PageWrap>
    );
}
