import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatDate, formatCurrency, PAYMENT_STATUSES, PROCUREMENT_CATEGORIES } from '../utils/helpers';
import { Modal, EmptyState, FAB, Btn, Field, Input, Select, Textarea, StatusBadge, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { ShoppingCart, Plus, Edit, Trash2, Paperclip, FileText } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const emptyEntry = { vendorName: '', vendorContact: '', itemName: '', quantity: '', unit: 'kg', unitPrice: '', totalCost: 0, purchaseDate: '', receivedDate: '', paymentStatus: 'Pending', invoiceNumber: '', notes: '', category: '', invoiceFile: null, invoiceFileName: '' };

export default function ProcurementTab({ event }) {
    const isOnline = useOnlineStatus();
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyEntry });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.PROCUREMENT).then(data => {
            setItems(data.filter(p => p.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openCreate = () => { setForm({ ...emptyEntry }); setEditing(null); setErrors({}); setShowModal(true); };
    const openEdit = (p) => { setForm({ ...p }); setEditing(p.id); setErrors({}); setShowModal(true); };

    const save = async () => {
        const e = {};
        if (!form.vendorName.trim()) e.vendorName = 'Required';
        if (!form.itemName.trim()) e.itemName = 'Required';
        setErrors(e);
        if (Object.keys(e).length) return;

        if (!isOnline) {
            showMsg('Offline: Check connection.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const tc = (parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0);
        const final = { ...form, id, eventId: event.id, totalCost: tc };

        try {
            await upsertRecord(KEYS.PROCUREMENT, final);
            let updatedItems;
            if (editing) {
                updatedItems = items.map(p => p.id === editing ? final : p);
            } else {
                updatedItems = [...items, final];
            }
            setItems(updatedItems);
            setShowModal(false);
            showMsg(editing ? 'Entry updated' : 'Entry added');
        } catch (err) {
            showMsg('Failed to save entry.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (pid) => {
        if (!confirm('Delete this entry?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.PROCUREMENT, pid);
            setItems(items.filter(p => p.id !== pid));
            showMsg('Entry removed');
        } catch (err) {
            showMsg('Failed to delete entry.', 'error');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Convert to base64 for localStorage persistence (simulating file upload)
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm(p => ({ ...p, invoiceFile: reader.result, invoiceFileName: file.name }));
        };
        reader.readAsDataURL(file);
    };

    const totalSpent = items.reduce((s, p) => s + (p.totalCost || 0), 0);
    const categoryData = Object.entries(items.reduce((m, p) => { m[p.category || 'Other'] = (m[p.category || 'Other'] || 0) + (p.totalCost || 0); return m; }, {})).map(([name, value]) => ({ name, value }));

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading procurement...</div>;
    }

    if (items.length === 0 && !showModal) {
        return <><EmptyState icon={ShoppingCart} title="No Procurement Entries" message="Add procurement records for this event." actionLabel="Add Entry" onAction={openCreate} />{renderModal()}</>;
    }

    function renderModal() {
        return (
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Entry' : 'Add Procurement Entry'} wide>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="Vendor Name" required error={errors.vendorName}><Input value={form.vendorName} onChange={e => setForm(p => ({ ...p, vendorName: e.target.value }))} /></Field>
                    <Field label="Vendor Contact"><Input value={form.vendorContact} onChange={e => setForm(p => ({ ...p, vendorContact: e.target.value }))} /></Field>
                    <Field label="Item Name" required error={errors.itemName}><Input value={form.itemName} onChange={e => setForm(p => ({ ...p, itemName: e.target.value }))} /></Field>
                    <Field label="Category"><Select options={PROCUREMENT_CATEGORIES} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} /></Field>
                    <Field label="Quantity"><Input type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></Field>
                    <Field label="Unit"><select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"><option>kg</option><option>L</option><option>pcs</option></select></Field>
                    <Field label="Unit Price (₹)"><Input type="number" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} /></Field>
                    <Field label="Payment Status"><Select options={PAYMENT_STATUSES} value={form.paymentStatus} onChange={e => setForm(p => ({ ...p, paymentStatus: e.target.value }))} /></Field>
                    <Field label="Purchase Date"><Input type="date" value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} /></Field>
                    <Field label="Invoice Number"><Input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-2">
                    <Field label="Invoice Upload">
                        <div className="flex items-center gap-3">
                            <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-center hover:bg-gray-100 transition-colors">
                                <span className="text-sm text-[#7A7A7A] flex items-center justify-center gap-2">
                                    <Paperclip size={16} /> {form.invoiceFileName || 'Click to upload invoice'}
                                </span>
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                            </label>
                            {form.invoiceFile && (
                                <button className="text-red-400 p-2 hover:bg-red-50 rounded" onClick={() => setForm(p => ({ ...p, invoiceFile: null, invoiceFileName: '' }))}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </Field>
                    <Field label="Notes"><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>
        );
    }

    return (
        <>
            {/* Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <StaggerCard index={0} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Total Procurement Spend</p>
                    <p className="text-2xl font-bold text-[#E8B86D]">{formatCurrency(totalSpent)}</p>
                    <p className="text-sm text-[#7A7A7A] mt-1">{items.length} entries</p>
                </StaggerCard>
                <StaggerCard index={1} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-2">Spend by Category</p>
                    {categoryData.length === 0 ? <p className="text-sm text-[#7A7A7A]">No data</p> : (
                        <ResponsiveContainer width="100%" height={150}>
                            <BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={v => formatCurrency(v)} /><Bar dataKey="value" fill="#E8B86D" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1A1A2E]">Purchase Orders</h3>
                    <Btn onClick={openCreate}><Plus size={14} /> Add Entry</Btn>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                            <th className="text-left px-4 py-3">Vendor</th>
                            <th className="px-4 py-3">Item</th>
                            <th className="px-4 py-3 hidden md:table-cell">Qty</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Unit Price</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 hidden sm:table-cell text-center">Date</th>
                            <th className="px-4 py-3 text-center">Invoice</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3"></th>
                        </tr></thead>
                        <tbody>
                            {items.map(p => (
                                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-xs lg:text-sm">{p.vendorName}</td>
                                    <td className="px-4 py-3 text-center text-xs lg:text-sm">{p.itemName}</td>
                                    <td className="px-4 py-3 text-center hidden md:table-cell text-xs lg:text-sm">{p.quantity} {p.unit}</td>
                                    <td className="px-4 py-3 text-center hidden lg:table-cell text-xs lg:text-sm">{formatCurrency(p.unitPrice)}</td>
                                    <td className="px-4 py-3 text-right font-medium text-xs lg:text-sm">{formatCurrency(p.totalCost)}</td>
                                    <td className="px-4 py-3 text-center text-[#7A7A7A] hidden sm:table-cell text-[10px] lg:text-xs">{formatDate(p.purchaseDate)}</td>
                                    <td className="px-4 py-3 text-center">
                                        {p.invoiceFile ? (
                                            <a href={p.invoiceFile} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#E8B86D] hover:underline text-[10px] lg:text-xs" title={p.invoiceFileName}>
                                                <FileText size={12} /> <span className="hidden sm:inline">View</span>
                                            </a>
                                        ) : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={p.paymentStatus} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(p)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                            <button onClick={() => deleteItem(p.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {renderModal()}
            <FAB onClick={openCreate} label="Add Entry" />

            <AnimatePresence>
                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
