import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users as UsersIcon, Eye, Edit, FileText, Plus, Search, Filter } from 'lucide-react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatDate, formatCurrency, EVENT_TYPES, MENU_TYPES, EVENT_STATUSES } from '../utils/helpers';
import { PageWrap, StaggerCard, Modal, StatusBadge, EmptyState, FAB, Btn, Field, Input, Select, Textarea, Notification, useOnlineStatus } from '../components/ui';
import { AnimatePresence } from 'framer-motion';

const defaultEvent = {
    name: '', clientName: '', clientContact: '', date: '', time: '', venue: '',
    estimatedGuests: '', confirmedGuests: '', eventType: '',
    specialNotes: '', status: 'Upcoming', estimatedBudget: '', actualBudget: '',
};

export default function Events() {
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(defaultEvent);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.EVENTS).then(data => {
            setEvents(data);
            setLoading(false);
        });
    }, []);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const filtered = events.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = !q || e.name.toLowerCase().includes(q) || e.clientName.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q);
        const matchStatus = !filterStatus || e.status === filterStatus;
        const matchType = !filterType || e.eventType === filterType;
        return matchSearch && matchStatus && matchType;
    });

    const openCreate = () => { setForm(defaultEvent); setEditing(null); setErrors({}); setShowModal(true); };
    const openEdit = (ev) => { setForm({ ...ev }); setEditing(ev.id); setErrors({}); setShowModal(true); };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.clientName.trim()) e.clientName = 'Required';
        if (!form.date) e.date = 'Required';
        if (!form.venue.trim()) e.venue = 'Required';
        if (!form.eventType) e.eventType = 'Required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = async () => {
        if (!validate()) return;
        if (!isOnline) {
            showMsg('You are currently offline. Please check your connection.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const record = { ...form, id };

        try {
            await upsertRecord(KEYS.EVENTS, record);

            // Pessimistic update: only update local state after server success
            let updated;
            if (editing) {
                updated = events.map(e => e.id === editing ? record : e);
            } else {
                updated = [...events, record];
            }

            setEvents(updated);
            setShowModal(false);
            showMsg(editing ? 'Event updated successfully' : 'Event created successfully');
        } catch (err) {
            console.error('Save failed:', err);
            showMsg('Failed to save data. Please try again.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteEvent = async (id) => {
        if (!confirm('Delete this event? All related data will remain.')) return;
        if (!isOnline) {
            showMsg('You are currently offline.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.EVENTS, id);
            const updated = events.filter(e => e.id !== id);
            setEvents(updated);
            showMsg('Event deleted successfully');
        } catch (err) {
            console.error('Delete failed:', err);
            showMsg('Failed to delete event.', 'error');
        }
    };

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    return (
        <PageWrap>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A2E]">Events</h1>
                    <p className="text-sm text-[#7A7A7A]">{events.length} events total</p>
                </div>
                <Btn onClick={openCreate}><Plus size={16} /> Create Event</Btn>
            </div>

            {/* Search & Filters */}
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[140px] lg:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D]" />
                </div>
                <div className="flex gap-2 sm:gap-3">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#E8B86D]">
                        <option value="">All Status</option>
                        {EVENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#E8B86D]">
                        <option value="">All Types</option>
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Event Cards Grid */}
            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading events...</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Calendar} title="No Events Found" message={events.length === 0 ? "Create your first event to get started." : "No events match your filters."} actionLabel="Create Event" onAction={openCreate} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((ev, i) => (
                        <StaggerCard key={ev.id} index={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[#1A1A2E] truncate">{ev.name}</h3>
                                        <p className="text-sm text-[#7A7A7A]">{ev.clientName}</p>
                                    </div>
                                    <StatusBadge status={ev.status} />
                                </div>
                                <div className="space-y-2 text-sm text-[#7A7A7A]">
                                    <div className="flex items-center gap-2"><Calendar size={14} /><span>{formatDate(ev.date)}{ev.time ? ` • ${ev.time}` : ''}</span></div>
                                    <div className="flex items-center gap-2"><MapPin size={14} /><span className="truncate">{ev.venue || '—'}</span></div>
                                    <div className="flex items-center gap-2"><UsersIcon size={14} /><span>{ev.confirmedGuests || ev.estimatedGuests || 0} guests</span></div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                    <span className="text-xs font-medium text-[#E8B86D]">{ev.eventType || 'Event'}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => navigate(`/events/${ev.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="View"><Eye size={16} className="text-gray-500" /></button>
                                        <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Edit"><Edit size={16} className="text-gray-500" /></button>
                                        <button onClick={() => navigate(`/events/${ev.id}?tab=Report`)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" title="Report"><FileText size={16} className="text-gray-500" /></button>
                                    </div>
                                </div>
                            </div>
                        </StaggerCard>
                    ))}
                </div>
            )}

            <FAB onClick={openCreate} label="New Event" />

            {/* Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Event' : 'Create New Event'} wide>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                    <Field label="Event Name" required error={errors.name}><Input value={form.name} onChange={e => set('name', e.target.value)} /></Field>
                    <Field label="Client Name" required error={errors.clientName}><Input value={form.clientName} onChange={e => set('clientName', e.target.value)} /></Field>
                    <Field label="Client Contact"><Input value={form.clientContact} onChange={e => set('clientContact', e.target.value)} /></Field>
                    <Field label="Venue" required error={errors.venue}><Input value={form.venue} onChange={e => set('venue', e.target.value)} /></Field>
                    <Field label="Event Date" required error={errors.date}><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></Field>
                    <Field label="Event Time"><Input type="time" value={form.time} onChange={e => set('time', e.target.value)} /></Field>
                    <Field label="Estimated Guests"><Input type="number" value={form.estimatedGuests} onChange={e => set('estimatedGuests', e.target.value)} /></Field>
                    <Field label="Confirmed Guests"><Input type="number" value={form.confirmedGuests} onChange={e => set('confirmedGuests', e.target.value)} /></Field>
                    <Field label="Event Type" required error={errors.eventType}><Select options={EVENT_TYPES} value={form.eventType} onChange={e => set('eventType', e.target.value)} /></Field>
                    <Field label="Status"><Select options={EVENT_STATUSES} value={form.status} onChange={e => set('status', e.target.value)} /></Field>
                    <Field label="Estimated Budget"><Input type="number" value={form.estimatedBudget} onChange={e => set('estimatedBudget', e.target.value)} /></Field>
                    <Field label="Actual Budget"><Input type="number" value={form.actualBudget} onChange={e => set('actualBudget', e.target.value)} /></Field>
                    <div className="md:col-span-2"><Field label="Special Notes"><Textarea value={form.specialNotes} onChange={e => set('specialNotes', e.target.value)} /></Field></div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText={editing ? 'Updating...' : 'Creating...'}>
                        {editing ? 'Update' : 'Create'} Event
                    </Btn>
                </div>
            </Modal>

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
