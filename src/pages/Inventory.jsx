import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatCurrency, getStockStatus, INVENTORY_CATEGORIES } from '../utils/helpers';
import { PageWrap, StaggerCard, Modal, EmptyState, FAB, Btn, Field, Input, Select, StatusBadge, SearchBar, Notification, useOnlineStatus } from '../components/ui';
import { Package, Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const emptyItem = { name: '', category: '', unit: 'kg', currentStock: '', reorderLevel: '', costPerUnit: '', supplier: '' };

export default function Inventory() {
    const isOnline = useOnlineStatus();
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyItem });
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.INVENTORY).then(data => {
            setItems(data);
            setLoading(false);
        });
    }, []);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const filtered = items.filter(i => {
        const q = search.toLowerCase();
        return (!q || i.name.toLowerCase().includes(q)) && (!filterCat || i.category === filterCat);
    });

    const lowStockItems = items.filter(i => getStockStatus(i) !== 'In Stock');

    const openCreate = () => { setForm({ ...emptyItem }); setEditing(null); setErrors({}); setShowModal(true); };
    const openEdit = (item) => { setForm({ ...item }); setEditing(item.id); setErrors({}); setShowModal(true); };

    const save = async () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.category) e.category = 'Required';
        setErrors(e);
        if (Object.keys(e).length) return;

        if (!isOnline) {
            showMsg('Offline: Check your mobile data.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const final = {
            ...form,
            id,
            currentStock: parseFloat(form.currentStock) || 0,
            reorderLevel: parseFloat(form.reorderLevel) || 0,
            costPerUnit: parseFloat(form.costPerUnit) || 0,
            lastUpdated: new Date().toISOString().split('T')[0]
        };

        try {
            await upsertRecord(KEYS.INVENTORY, final);
            let updated;
            if (editing) {
                updated = items.map(i => i.id === editing ? final : i);
            } else {
                updated = [...items, final];
            }
            setItems(updated);
            setShowModal(false);
            showMsg(editing ? 'Item updated' : 'Item added');
        } catch (err) {
            showMsg('Failed to save item.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (id) => {
        if (!confirm('Delete?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.INVENTORY, id);
            setItems(items.filter(i => i.id !== id));
            showMsg('Item removed');
        } catch (err) {
            showMsg('Failed to delete item.', 'error');
        }
    };

    return (
        <PageWrap>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold text-[#1A1A2E]">Inventory</h1><p className="text-sm text-[#7A7A7A]">{items.length} items • {lowStockItems.length} low stock</p></div>
                <Btn onClick={openCreate}><Plus size={16} /> Add Item</Btn>
            </div>

            {lowStockItems.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div><p className="font-medium text-red-800 text-sm">Low Stock Alert — {lowStockItems.length} items need restocking</p>
                        <p className="text-xs text-red-600 mt-1">{lowStockItems.map(i => i.name).join(', ')}</p></div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1"><SearchBar value={search} onChange={setSearch} placeholder="Search inventory..." /></div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white min-w-[140px]"><option value="">All Categories</option>{INVENTORY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>

            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading inventory...</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Package} title="No Items Found" message={items.length === 0 ? "Add your first inventory item." : "No items match your search."} actionLabel="Add Item" onAction={openCreate} />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                                <th className="text-left px-4 py-3">Item</th>
                                <th className="px-4 py-3 hidden md:table-cell">Cat</th>
                                <th className="px-4 py-3 text-right">Stock</th>
                                <th className="px-4 py-3 text-right hidden lg:table-cell">Reorder</th>
                                <th className="px-4 py-3 text-right hidden sm:table-cell">Cost</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 hidden xl:table-cell">Supplier</th>
                                <th className="px-4 py-3"></th>
                            </tr></thead>
                            <tbody>
                                {filtered.map((item, i) => (
                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-xs lg:text-sm">{item.name}</td>
                                        <td className="px-4 py-3 text-center text-[#7A7A7A] hidden md:table-cell text-xs lg:text-sm">{item.category}</td>
                                        <td className="px-4 py-3 text-right font-medium text-xs lg:text-sm">{item.currentStock} {item.unit}</td>
                                        <td className="px-4 py-3 text-right text-[#7A7A7A] hidden lg:table-cell text-xs lg:text-sm">{item.reorderLevel}</td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell text-xs lg:text-sm">{formatCurrency(item.costPerUnit)}</td>
                                        <td className="px-4 py-3 text-center"><StatusBadge status={getStockStatus(item)} /></td>
                                        <td className="px-4 py-3 text-[#7A7A7A] hidden xl:table-cell text-xs lg:text-sm">{item.supplier || '—'}</td>
                                        <td className="px-4 py-3"><div className="flex gap-1">
                                            <button onClick={() => openEdit(item)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                            <button onClick={() => deleteItem(item.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Item' : 'Add Inventory Item'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="Item Name" required error={errors.name}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
                    <Field label="Category" required error={errors.category}><Select options={INVENTORY_CATEGORIES} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></Field>
                    <Field label="Unit"><select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option>kg</option><option>L</option><option>pcs</option></select></Field>
                    <Field label="Current Stock"><Input type="number" value={form.currentStock} onChange={e => setForm(p => ({ ...p, currentStock: e.target.value }))} /></Field>
                    <Field label="Reorder Level"><Input type="number" value={form.reorderLevel} onChange={e => setForm(p => ({ ...p, reorderLevel: e.target.value }))} /></Field>
                    <Field label="Cost per Unit (₹)"><Input type="number" value={form.costPerUnit} onChange={e => setForm(p => ({ ...p, costPerUnit: e.target.value }))} /></Field>
                    <div className="sm:col-span-2"><Field label="Supplier"><Input value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} /></Field></div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>
            <FAB onClick={openCreate} label="Add Item" />

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </PageWrap>
    );
}
