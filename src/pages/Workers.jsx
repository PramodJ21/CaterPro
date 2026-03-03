import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatCurrency, WORKER_ROLES } from '../utils/helpers';
import { PageWrap, StaggerCard, Modal, EmptyState, FAB, Btn, Field, Input, Select, Notification, useOnlineStatus } from '../components/ui';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const emptyWorker = { name: '', role: '', contact: '', dailyRate: '' };

export default function Workers() {
    const isOnline = useOnlineStatus();
    const [workers, setWorkers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyWorker });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.WORKERS).then(data => {
            setWorkers(data);
            setLoading(false);
        });
    }, []);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openCreate = () => { setForm({ ...emptyWorker }); setEditing(null); setErrors({}); setShowModal(true); };
    const openEdit = (w) => { setForm({ ...w }); setEditing(w.id); setErrors({}); setShowModal(true); };

    const save = async () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.role) e.role = 'Required';
        setErrors(e);
        if (Object.keys(e).length) return;

        if (!isOnline) {
            showMsg('Offline: Check your mobile data/connection.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const final = { ...form, dailyRate: parseFloat(form.dailyRate) || 0, id };

        try {
            await upsertRecord(KEYS.WORKERS, final);
            let updated;
            if (editing) {
                updated = workers.map(w => w.id === editing ? final : w);
            } else {
                updated = [...workers, final];
            }
            setWorkers(updated);
            setShowModal(false);
            showMsg(editing ? 'Worker updated' : 'Worker added');
        } catch (err) {
            showMsg('Failed to save worker.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteWorker = async (id) => {
        if (!confirm('Delete?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.WORKERS, id);
            setWorkers(workers.filter(w => w.id !== id));
            showMsg('Worker removed');
        } catch (err) {
            showMsg('Failed to delete worker.', 'error');
        }
    };

    const getInitials = (name) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const roleColors = { Chef: '#E8B86D', Helper: '#4CAF50', Server: '#2196F3', Supervisor: '#9C27B0', Driver: '#FF9800' };

    return (
        <PageWrap>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold text-[#1A1A2E]">Workers</h1><p className="text-sm text-[#7A7A7A]">{workers.length} workers</p></div>
                <Btn onClick={openCreate}><Plus size={16} /> Add Worker</Btn>
            </div>

            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading workers...</div>
            ) : workers.length === 0 ? (
                <EmptyState icon={Users} title="No Workers" message="Add your team members." actionLabel="Add Worker" onAction={openCreate} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workers.map((w, i) => (
                        <StaggerCard key={w.id} index={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ backgroundColor: roleColors[w.role] || '#7A7A7A' }}>
                                    {getInitials(w.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#1A1A2E] truncate">{w.name}</h3>
                                    <p className="text-sm text-[#E8B86D] font-medium">{w.role}</p>
                                    <p className="text-xs text-[#7A7A7A] mt-1">{w.contact || 'No contact'}</p>
                                    <p className="text-sm font-medium mt-2">{formatCurrency(w.dailyRate)}<span className="text-xs text-[#7A7A7A]"> /day</span></p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => openEdit(w)} className="p-1.5 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                    <button onClick={() => deleteWorker(w.id)} className="p-1.5 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </StaggerCard>
                    ))}
                </div>
            )}

            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Worker' : 'Add Worker'}>
                <Field label="Name" required error={errors.name}><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></Field>
                <Field label="Role" required error={errors.role}><Select options={WORKER_ROLES} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} /></Field>
                <Field label="Contact"><Input value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} /></Field>
                <Field label="Daily Rate (₹)"><Input type="number" value={form.dailyRate} onChange={e => setForm(p => ({ ...p, dailyRate: e.target.value }))} /></Field>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>
            <FAB onClick={openCreate} label="Add Worker" />

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
