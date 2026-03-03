import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatDate } from '../utils/helpers';
import { Modal, EmptyState, FAB, Btn, Field, Input, Select, Textarea, StatusBadge, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { FileText, Plus, Edit, Trash2, CheckCircle, Circle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const emptyMom = {
    type: 'Pre', meetingDate: '', meetingTime: '', location: '', attendees: [],
    agendaItems: [{ point: '', discussion: '', decision: '', owner: '', deadline: '' }],
    actionItems: [{ task: '', assignedTo: '', dueDate: '', status: 'Pending' }],
    notes: '', nextMeetingDate: '',
};

export default function MomTab({ event }) {
    const isOnline = useOnlineStatus();
    const [moms, setMoms] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyMom });
    const [attendeeInput, setAttendeeInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.MOM).then(data => {
            setMoms(data.filter(m => m.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openCreate = () => { setForm({ ...emptyMom, agendaItems: [{ point: '', discussion: '', decision: '', owner: '', deadline: '' }], actionItems: [{ task: '', assignedTo: '', dueDate: '', status: 'Pending' }] }); setEditing(null); setShowModal(true); };
    const openEdit = (m) => { setForm({ ...m }); setEditing(m.id); setShowModal(true); };

    const addAttendee = () => {
        if (attendeeInput.trim()) {
            setForm(p => ({ ...p, attendees: [...(p.attendees || []), attendeeInput.trim()] }));
            setAttendeeInput('');
        }
    };
    const removeAttendee = (idx) => setForm(p => ({ ...p, attendees: p.attendees.filter((_, i) => i !== idx) }));

    const addAgenda = () => setForm(p => ({ ...p, agendaItems: [...p.agendaItems, { point: '', discussion: '', decision: '', owner: '', deadline: '' }] }));
    const updateAgenda = (idx, field, val) => setForm(p => ({ ...p, agendaItems: p.agendaItems.map((a, i) => i === idx ? { ...a, [field]: val } : a) }));

    const addAction = () => setForm(p => ({ ...p, actionItems: [...p.actionItems, { task: '', assignedTo: '', dueDate: '', status: 'Pending' }] }));
    const updateAction = (idx, field, val) => setForm(p => ({ ...p, actionItems: p.actionItems.map((a, i) => i === idx ? { ...a, [field]: val } : a) }));

    const save = async () => {
        if (!form.meetingDate) return showMsg('Meeting date required', 'warning');
        if (!isOnline) {
            showMsg('Offline: Cannot save MoM.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const final = { ...form, id, eventId: event.id };

        try {
            await upsertRecord(KEYS.MOM, final);
            let updated;
            if (editing) {
                updated = moms.map(m => m.id === editing ? final : m);
            } else {
                updated = [...moms, final];
            }
            setMoms(updated);
            setShowModal(false);
            showMsg('MoM saved');
        } catch (err) {
            showMsg('Failed to save MoM.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteMom = async (id) => {
        if (!confirm('Delete?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.MOM, id);
            setMoms(moms.filter(m => m.id !== id));
            showMsg('MoM removed');
        } catch (err) {
            showMsg('Failed to delete MoM.', 'error');
        }
    };

    const toggleActionStatus = async (momId, actionIdx) => {
        if (!isOnline) {
            showMsg('Offline: Check connection.', 'error');
            return;
        }

        const m = moms.find(x => x.id === momId);
        if (!m) return;

        const updatedItems = [...m.actionItems];
        const newStatus = updatedItems[actionIdx].status === 'Done' ? 'Pending' : 'Done';
        updatedItems[actionIdx] = { ...updatedItems[actionIdx], status: newStatus };
        const updatedMom = { ...m, actionItems: updatedItems };

        try {
            await upsertRecord(KEYS.MOM, updatedMom);
            setMoms(moms.map(x => x.id === momId ? updatedMom : x));
            showMsg(`Task marked as ${newStatus}`);
        } catch (err) {
            showMsg('Failed to update status.', 'error');
        }
    };

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading minutes of meeting...</div>;
    }

    if (moms.length === 0 && !showModal) {
        return <><EmptyState icon={FileText} title="No Minutes of Meeting" message="Record meeting notes for this event." actionLabel="Add MoM" onAction={openCreate} />{renderModal()}</>;
    }

    function renderModal() {
        return (
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit MoM' : 'Add Minutes of Meeting'} wide>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Field label="Meeting Type"><Select options={['Pre', 'Post']} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} /></Field>
                    <Field label="Meeting Date" required><Input type="date" value={form.meetingDate} onChange={e => setForm(p => ({ ...p, meetingDate: e.target.value }))} /></Field>
                    <Field label="Time"><Input type="time" value={form.meetingTime} onChange={e => setForm(p => ({ ...p, meetingTime: e.target.value }))} /></Field>
                    <Field label="Location"><Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} /></Field>
                </div>
                <Field label="Attendees">
                    <div className="flex gap-2 mb-2">
                        <Input value={attendeeInput} onChange={e => setAttendeeInput(e.target.value)} placeholder="Name" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAttendee())} />
                        <Btn variant="outline" onClick={addAttendee} type="button">Add</Btn>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {(form.attendees || []).map((a, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">{a}<button onClick={() => removeAttendee(i)} className="text-red-400 hover:text-red-600 cursor-pointer">×</button></span>
                        ))}
                    </div>
                </Field>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mt-4 mb-2">Agenda Items</h4>
                {form.agendaItems.map((a, idx) => (
                    <div key={idx} className="p-3 border border-gray-100 rounded-lg mb-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                            <Field label="Agenda Point"><Input value={a.point} onChange={e => updateAgenda(idx, 'point', e.target.value)} /></Field>
                            <Field label="Owner"><Input value={a.owner} onChange={e => updateAgenda(idx, 'owner', e.target.value)} /></Field>
                        </div>
                        <Field label="Discussion"><Textarea value={a.discussion} onChange={e => updateAgenda(idx, 'discussion', e.target.value)} /></Field>
                        <Field label="Decision"><Input value={a.decision} onChange={e => updateAgenda(idx, 'decision', e.target.value)} /></Field>
                    </div>
                ))}
                <Btn variant="ghost" onClick={addAgenda} className="text-xs mb-4"><Plus size={14} /> Add Agenda</Btn>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mt-2 mb-2">Action Items</h4>
                {form.actionItems.map((a, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="sm:col-span-2"><Input value={a.task} onChange={e => updateAction(idx, 'task', e.target.value)} placeholder="Task" /></div>
                        <Input value={a.assignedTo} onChange={e => updateAction(idx, 'assignedTo', e.target.value)} placeholder="Assigned to" />
                        <div className="flex gap-2">
                            <Input type="date" value={a.dueDate} onChange={e => updateAction(idx, 'dueDate', e.target.value)} className="flex-1" />
                            <Select options={['Pending', 'Done']} value={a.status} onChange={e => updateAction(idx, 'status', e.target.value)} className="w-[100px]" />
                        </div>
                    </div>
                ))}
                <Btn variant="ghost" onClick={addAction} className="text-xs mb-4"><Plus size={14} /> Add Action</Btn>
                <Field label="General Notes"><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field>
                <Field label="Next Meeting Date"><Input type="date" value={form.nextMeetingDate} onChange={e => setForm(p => ({ ...p, nextMeetingDate: e.target.value }))} /></Field>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>
        );
    }

    return (
        <>
            <div className="flex justify-end mb-4"><Btn onClick={openCreate}><Plus size={14} /> Add MoM</Btn></div>
            <div className="space-y-4">
                {moms.map((m, i) => (
                    <StaggerCard key={m.id} index={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={m.type === 'Pre' ? 'Upcoming' : 'Completed'} />
                                        <span className="text-sm font-bold text-[#1A1A2E]">{m.type}-Event Meeting</span>
                                    </div>
                                    <p className="text-xs text-[#7A7A7A] mt-1">{formatDate(m.meetingDate)}{m.meetingTime ? ` at ${m.meetingTime}` : ''}{m.location ? ` — ${m.location}` : ''}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(m)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                    <button onClick={() => deleteMom(m.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {m.attendees?.length > 0 && (
                                <p className="text-xs text-[#7A7A7A] mb-3">Attendees: {m.attendees.join(', ')}</p>
                            )}
                            {m.agendaItems?.filter(a => a.point).length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Agenda</p>
                                    {m.agendaItems.filter(a => a.point).map((a, j) => (
                                        <div key={j} className="p-2 bg-gray-50 rounded mb-1 text-sm">
                                            <strong>{a.point}</strong>{a.decision && <span className="text-[#7A7A7A]"> — {a.decision}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {m.actionItems?.filter(a => a.task).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Action Items</p>
                                    {m.actionItems.filter(a => a.task).map((a, j) => (
                                        <div key={j} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm cursor-pointer" onClick={() => toggleActionStatus(m.id, j)}>
                                            {a.status === 'Done' ? <CheckCircle size={16} className="text-[#4CAF50] shrink-0" /> : <Circle size={16} className="text-gray-300 shrink-0" />}
                                            <span className={a.status === 'Done' ? 'line-through text-[#7A7A7A]' : ''}>{a.task}</span>
                                            <span className="text-xs text-[#7A7A7A] ml-auto">{a.assignedTo}{a.dueDate ? ` • ${formatDate(a.dueDate)}` : ''}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {m.notes && <p className="text-sm text-[#7A7A7A] mt-3 p-2 bg-gray-50 rounded">{m.notes}</p>}
                        </div>
                    </StaggerCard>
                ))}
            </div>
            {renderModal()}
            <FAB onClick={openCreate} label="Add MoM" />

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
