import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatCurrency } from '../utils/helpers';
import { Modal, EmptyState, FAB, Btn, Field, Input, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function InventoryTab({ event }) {
    const isOnline = useOnlineStatus();
    const [movements, setMovements] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ itemName: '', openingStock: '', qtyUsed: '', closingStock: '', unit: 'kg' });
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.INVENTORY_MOVEMENTS).then(data => {
            setMovements(data.filter(m => m.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openCreate = () => { setForm({ itemName: '', openingStock: '', qtyUsed: '', closingStock: '', unit: 'kg' }); setEditing(null); setShowModal(true); };
    const openEdit = (m) => { setForm({ ...m }); setEditing(m.id); setShowModal(true); };

    const save = async () => {
        if (!form.itemName.trim()) return showMsg('Item name is required', 'warning');
        if (!isOnline) {
            showMsg('Offline: Cannot save movement.', 'error');
            return;
        }

        setSaving(true);
        const opening = parseFloat(form.openingStock) || 0;
        const used = parseFloat(form.qtyUsed) || 0;
        const closing = opening - used;
        const variance = closing - (parseFloat(form.closingStock) || closing);
        const id = editing || generateId();
        const final = { ...form, id, eventId: event.id, closingStock: parseFloat(form.closingStock) || closing, variance };

        try {
            await upsertRecord(KEYS.INVENTORY_MOVEMENTS, final);
            let updated;
            if (editing) {
                updated = movements.map(m => m.id === editing ? final : m);
            } else {
                updated = [...movements, final];
            }
            setMovements(updated);
            setShowModal(false);
            showMsg('Movement saved');
        } catch (err) {
            showMsg('Failed to save movement.', 'error');
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
            await deleteRecord(KEYS.INVENTORY_MOVEMENTS, id);
            setMovements(movements.filter(m => m.id !== id));
            showMsg('Movement removed');
        } catch (err) {
            showMsg('Failed to delete movement.', 'error');
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading movements...</div>;
    }

    if (movements.length === 0 && !showModal) {
        return (
            <>
                <EmptyState icon={Package} title="No Inventory Movements" message="Track which inventory items were used for this event." actionLabel="Add Movement" onAction={openCreate} />
                <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Inventory Movement">
                    {renderForm()}
                </Modal>
            </>
        );
    }

    function renderForm() {
        return (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="Item Name" required><Input value={form.itemName} onChange={e => setForm(p => ({ ...p, itemName: e.target.value }))} /></Field>
                    <Field label="Unit"><select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option>kg</option><option>L</option><option>pcs</option></select></Field>
                    <Field label="Opening Stock"><Input type="number" value={form.openingStock} onChange={e => setForm(p => ({ ...p, openingStock: e.target.value }))} /></Field>
                    <Field label="Qty Used"><Input type="number" value={form.qtyUsed} onChange={e => setForm(p => ({ ...p, qtyUsed: e.target.value }))} /></Field>
                    <Field label="Closing Stock"><Input type="number" value={form.closingStock} onChange={e => setForm(p => ({ ...p, closingStock: e.target.value }))} /></Field>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1A1A2E]">Inventory Movement Log</h3>
                    <Btn onClick={openCreate}><Plus size={14} /> Add</Btn>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                            <th className="text-left px-4 py-3">Item</th>
                            <th className="px-4 py-3">In</th>
                            <th className="px-4 py-3">Used</th>
                            <th className="px-4 py-3">Out</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Var.</th>
                            <th className="px-4 py-3"></th>
                        </tr></thead>
                        <tbody>
                            {movements.map(m => (
                                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-xs lg:text-sm">{m.itemName}</td>
                                    <td className="px-4 py-3 text-center text-xs lg:text-sm">{m.openingStock}</td>
                                    <td className="px-4 py-3 text-center text-xs lg:text-sm text-red-500">{m.qtyUsed}</td>
                                    <td className="px-4 py-3 text-center text-xs lg:text-sm font-bold">{m.closingStock}</td>
                                    <td className="px-4 py-3 text-center font-medium hidden sm:table-cell" style={{ color: m.variance === 0 ? '#4CAF50' : '#E53935' }}>{m.variance || 0}</td>
                                    <td className="px-4 py-3"><div className="flex gap-1">
                                        <button onClick={() => openEdit(m)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                        <button onClick={() => deleteItem(m.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Movement' : 'Add Movement'}>{renderForm()}</Modal>
            <FAB onClick={openCreate} label="Add Movement" />

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
