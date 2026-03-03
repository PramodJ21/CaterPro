import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatCurrency, WORKER_ROLES } from '../utils/helpers';
import { Modal, EmptyState, FAB, Btn, Field, Input, Select, StatusBadge, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const STATUSES = ['Present', 'Absent', 'Half-Day'];
const COLORS = ['#4CAF50', '#E53935', '#FF9800'];

export default function AttendanceTab({ event }) {
    const isOnline = useOnlineStatus();
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ workerId: '', workerName: '', role: '', status: 'Present', checkIn: '', checkOut: '', hoursWorked: '', dailyRate: '', remarks: '' });
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        Promise.all([getData(KEYS.ATTENDANCE), getData(KEYS.WORKERS)]).then(([aData, wData]) => {
            setRecords(aData.filter(a => a.eventId === event.id));
            setWorkers(wData);
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openCreate = () => {
        setForm({ workerId: '', workerName: '', role: '', status: 'Present', checkIn: '', checkOut: '', hoursWorked: '', dailyRate: '', remarks: '' });
        setEditing(null); setShowModal(true);
    };
    const openEdit = (r) => { setForm({ ...r }); setEditing(r.id); setShowModal(true); };

    const selectWorker = (wid) => {
        const w = workers.find(x => x.id === wid);
        if (w) setForm(p => ({ ...p, workerId: wid, workerName: w.name, role: w.role, dailyRate: w.dailyRate }));
    };

    const calcHours = (ci, co) => {
        if (!ci || !co) return '';
        const [h1, m1] = ci.split(':').map(Number);
        const [h2, m2] = co.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff < 0) diff += 24 * 60;
        return (diff / 60).toFixed(1);
    };

    const save = async () => {
        if (!form.workerName.trim()) return showMsg('Worker name required', 'warning');
        if (!isOnline) {
            showMsg('Offline: Cannot save record.', 'error');
            return;
        }

        setSaving(true);
        const hours = calcHours(form.checkIn, form.checkOut) || form.hoursWorked;
        const id = editing || generateId();
        const final = { ...form, id, eventId: event.id, hoursWorked: parseFloat(hours) || 0 };

        try {
            await upsertRecord(KEYS.ATTENDANCE, final);
            let updated;
            if (editing) {
                updated = records.map(a => a.id === editing ? final : a);
            } else {
                updated = [...records, final];
            }
            setRecords(updated);
            setShowModal(false);
            showMsg(editing ? 'Attendance updated' : 'Attendance recorded');
        } catch (err) {
            showMsg('Failed to save attendance.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteRec = async (id) => {
        if (!confirm('Delete?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.ATTENDANCE, id);
            setRecords(records.filter(a => a.id !== id));
            showMsg('Record removed');
        } catch (err) {
            showMsg('Failed to delete record.', 'error');
        }
    };

    const totalLabor = records.reduce((s, r) => {
        if (r.status === 'Absent') return s;
        const mult = r.status === 'Half-Day' ? 0.5 : 1;
        return s + (r.dailyRate || 0) * mult;
    }, 0);

    const pieData = STATUSES.map(s => ({ name: s, value: records.filter(r => r.status === s).length })).filter(d => d.value > 0);

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading attendance...</div>;
    }

    if (records.length === 0 && !showModal) {
        return <><EmptyState icon={Users} title="No Attendance Records" message="Add attendance for workers at this event." actionLabel="Add Record" onAction={openCreate} />{renderModal()}</>;
    }

    function renderModal() {
        return (
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Attendance' : 'Add Attendance'}>
                <Field label="Worker">
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={form.workerId} onChange={e => selectWorker(e.target.value)}>
                        <option value="">Select worker or type below...</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name} — {w.role}</option>)}
                    </select>
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="Worker Name"><Input value={form.workerName} onChange={e => setForm(p => ({ ...p, workerName: e.target.value }))} /></Field>
                    <Field label="Role"><Select options={WORKER_ROLES} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} /></Field>
                    <Field label="Status"><Select options={STATUSES} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} /></Field>
                    <Field label="Daily Rate"><Input type="number" value={form.dailyRate} onChange={e => setForm(p => ({ ...p, dailyRate: e.target.value }))} /></Field>
                    <Field label="Check In"><Input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value, hoursWorked: calcHours(e.target.value, p.checkOut) }))} /></Field>
                    <Field label="Check Out"><Input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value, hoursWorked: calcHours(p.checkIn, e.target.value) }))} /></Field>
                    <Field label="Hours Worked"><Input type="number" value={form.hoursWorked} readOnly className="!bg-gray-50" /></Field>
                </div>
                <Field label="Remarks"><Input value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} /></Field>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <StaggerCard index={0} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Workers Deployed</p>
                    <p className="text-2xl font-bold text-[#1A1A2E]">{records.length}</p>
                </StaggerCard>
                <StaggerCard index={1} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Total Labor Cost</p>
                    <p className="text-2xl font-bold text-[#E8B86D]">{formatCurrency(totalLabor)}</p>
                </StaggerCard>
                <StaggerCard index={2} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-2">Attendance Split</p>
                    {pieData.length === 0 ? <p className="text-sm text-[#7A7A7A]">No data</p> : (
                        <ResponsiveContainer width="100%" height={120}>
                            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={45} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie><Tooltip /></PieChart>
                        </ResponsiveContainer>
                    )}
                </StaggerCard>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1A1A2E]">Attendance Sheet</h3>
                    <Btn onClick={openCreate}><Plus size={14} /> Add</Btn>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                            <th className="text-left px-4 py-3">Worker</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Role</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 hidden md:table-cell">In</th>
                            <th className="px-4 py-3 hidden md:table-cell">Out</th>
                            <th className="px-4 py-3 text-center">Hrs</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Remarks</th>
                            <th></th>
                        </tr></thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-xs lg:text-sm">{r.workerName}</td>
                                    <td className="px-4 py-3 text-center text-[#7A7A7A] hidden sm:table-cell text-xs lg:text-sm">{r.role}</td>
                                    <td className="px-4 py-3 text-center"><StatusBadge status={r.status} /></td>
                                    <td className="px-4 py-3 text-center hidden md:table-cell text-xs lg:text-sm">{r.checkIn || '—'}</td>
                                    <td className="px-4 py-3 text-center hidden md:table-cell text-xs lg:text-sm">{r.checkOut || '—'}</td>
                                    <td className="px-4 py-3 text-center text-xs lg:text-sm">{r.hoursWorked || '—'}</td>
                                    <td className="px-4 py-3 text-[#7A7A7A] hidden lg:table-cell text-xs lg:text-sm">{r.remarks || '—'}</td>
                                    <td className="px-4 py-3"><div className="flex gap-1">
                                        <button onClick={() => openEdit(r)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                        <button onClick={() => deleteRec(r.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {renderModal()}
            <FAB onClick={openCreate} label="Add Record" />

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
