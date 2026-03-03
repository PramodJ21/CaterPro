import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp, Plus, Package, UserPlus, AlertTriangle } from 'lucide-react';
import { getData, KEYS } from '../utils/storage';
import { formatDate, formatCurrency, getStockStatus } from '../utils/helpers';
import { PageWrap, StaggerCard, KPICard, Btn, StatusBadge, EmptyState } from '../components/ui';
import { format, parseISO, subMonths, isAfter, isBefore, addDays } from 'date-fns';

const COLORS = ['#E8B86D', '#1A1A2E', '#4CAF50', '#FF9800', '#E53935', '#2196F3', '#9C27B0'];

export default function Dashboard() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [procurement, setProcurement] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const [e, w, i, p, r, f] = await Promise.all([
                getData(KEYS.EVENTS), getData(KEYS.WORKERS), getData(KEYS.INVENTORY),
                getData(KEYS.PROCUREMENT), getData(KEYS.RECIPES), getData(KEYS.FEEDBACK)
            ]);
            setEvents(e); setWorkers(w); setInventory(i);
            setProcurement(p); setRecipes(r); setFeedback(f);
            setLoading(false);
        };
        loadData();
    }, []);

    const now = new Date();
    const upcoming = events.filter(e => e.status === 'Upcoming');
    const totalRevenue = events.reduce((s, e) => s + (e.actualBudget || e.estimatedBudget || 0), 0);
    const lowStockItems = inventory.filter(i => getStockStatus(i) !== 'In Stock');

    // Events per month (last 12)
    const monthlyEvents = useMemo(() => {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i);
            const key = format(d, 'MMM yy');
            const count = events.filter(e => {
                try { return format(parseISO(e.date), 'MMM yy') === key; } catch { return false; }
            }).length;
            months.push({ month: key, events: count });
        }
        return months;
    }, [events]);

    // Revenue per month
    const monthlyRevenue = useMemo(() => {
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = subMonths(now, i);
            const key = format(d, 'MMM yy');
            const rev = events
                .filter(e => { try { return format(parseISO(e.date), 'MMM yy') === key; } catch { return false; } })
                .reduce((s, e) => s + (e.actualBudget || e.estimatedBudget || 0), 0);
            months.push({ month: key, revenue: rev });
        }
        return months;
    }, [events]);

    // Event type distribution
    const typeDistribution = useMemo(() => {
        const map = {};
        events.forEach(e => { map[e.eventType] = (map[e.eventType] || 0) + 1; });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [events]);

    // Top 5 ingredients
    const topIngredients = useMemo(() => {
        const map = {};
        recipes.forEach(r => r.ingredients?.forEach(ing => {
            map[ing.name] = (map[ing.name] || 0) + (ing.actualUsed || ing.requiredQty || 0);
        }));
        return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 5);
    }, [recipes]);

    // Top 5 dishes by rating
    const topDishes = useMemo(() => {
        const dishFb = feedback.filter(f => !f.type && f.overallRating);
        const map = {};
        dishFb.forEach(f => {
            if (!map[f.dishName]) map[f.dishName] = { total: 0, count: 0 };
            map[f.dishName].total += f.overallRating;
            map[f.dishName].count += 1;
        });
        return Object.entries(map).map(([name, v]) => ({ name, rating: (v.total / v.count).toFixed(1) })).sort((a, b) => b.rating - a.rating).slice(0, 5);
    }, [feedback]);

    const recentProcurement = procurement.slice(-5).reverse();

    if (loading) return <PageWrap><div className="py-20 text-center text-[#7A7A7A]">Loading dashboard...</div></PageWrap>;

    return (
        <PageWrap>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Dashboard</h1>
                <p className="text-sm text-[#7A7A7A]">Welcome to CaterPro — your catering operations overview</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
                <KPICard label="Total Events" value={events.length} icon={Calendar} index={0} />
                <KPICard label="Upcoming Events" value={upcoming.length} icon={TrendingUp} color="#4CAF50" index={1} />
                <KPICard label="Total Revenue" value={`₹${totalRevenue}`} icon={DollarSign} color="#1A1A2E" index={2} />
                <KPICard label="Active Workers" value={workers.length} icon={Users} color="#FF9800" index={3} />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <StaggerCard index={4} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Events Per Month</h3>
                    {events.length === 0 ? <p className="text-sm text-[#7A7A7A] py-10 text-center">No event data yet</p> : (
                        <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 180 : 250}>
                            <LineChart data={monthlyEvents}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip /><Line type="monotone" dataKey="events" stroke="#E8B86D" strokeWidth={2} dot={{ fill: '#E8B86D' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
                <StaggerCard index={5} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Revenue Per Month</h3>
                    {events.length === 0 ? <p className="text-sm text-[#7A7A7A] py-10 text-center">No revenue data yet</p> : (
                        <ResponsiveContainer width="100%" height={window.innerWidth < 640 ? 180 : 250}>
                            <BarChart data={monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={v => formatCurrency(v)} /><Bar dataKey="revenue" fill="#1A1A2E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <StaggerCard index={6} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Event Types</h3>
                    {typeDistribution.length === 0 ? <p className="text-sm text-[#7A7A7A] py-10 text-center">No data</p> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart><Pie data={typeDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
                <StaggerCard index={7} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Top 5 Ingredients</h3>
                    {topIngredients.length === 0 ? <p className="text-sm text-[#7A7A7A] py-10 text-center">No data</p> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topIngredients} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip /><Bar dataKey="qty" fill="#E8B86D" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
                <StaggerCard index={8} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Top Rated Dishes</h3>
                    {topDishes.length === 0 ? <p className="text-sm text-[#7A7A7A] py-10 text-center">No ratings yet</p> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={topDishes} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip /><Bar dataKey="rating" fill="#4CAF50" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <StaggerCard index={9} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Upcoming Events</h3>
                    {upcoming.length === 0 ? <p className="text-sm text-[#7A7A7A] text-center py-6">No upcoming events</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase border-b border-gray-100">
                                    <th className="text-left py-2">Event</th><th className="text-left py-2">Date</th><th className="text-right py-2">Guests</th>
                                </tr></thead>
                                <tbody>
                                    {upcoming.slice(0, 5).map(e => (
                                        <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/events/${e.id}`)}>
                                            <td className="py-2.5 font-medium text-xs lg:text-sm">{e.name}</td>
                                            <td className="py-2.5 text-[#7A7A7A] text-[10px] lg:text-xs">{formatDate(e.date)}</td>
                                            <td className="py-2.5 text-right text-xs lg:text-sm">{e.confirmedGuests || e.estimatedGuests}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </StaggerCard>
                <StaggerCard index={10} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={16} className="text-[#FF9800]" />
                        <h3 className="text-sm font-bold text-[#1A1A2E]">Low Stock Alerts</h3>
                    </div>
                    {lowStockItems.length === 0 ? <p className="text-sm text-[#7A7A7A] text-center py-6">All items are well-stocked!</p> : (
                        <div className="space-y-2">
                            {lowStockItems.map(i => (
                                <div key={i.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{i.name}</p>
                                        <p className="text-xs text-[#7A7A7A]">{i.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-600">{i.currentStock} {i.unit}</p>
                                        <p className="text-xs text-[#7A7A7A]">Reorder: {i.reorderLevel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </StaggerCard>
            </div>

            {/* Quick Actions */}
            <StaggerCard index={11} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                    <Btn onClick={() => navigate('/events')}><Plus size={16} /> New Event</Btn>
                    <Btn variant="secondary" onClick={() => navigate('/inventory')}><Package size={16} /> Add Inventory</Btn>
                    <Btn variant="outline" onClick={() => navigate('/workers')}><UserPlus size={16} /> Add Worker</Btn>
                </div>
            </StaggerCard>
        </PageWrap>
    );
}
