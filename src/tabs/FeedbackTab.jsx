import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { Modal, EmptyState, FAB, Btn, Field, Input, Select, Textarea, StarRating, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { MessageSquare, Plus, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function FeedbackTab({ event }) {
    const isOnline = useOnlineStatus();
    const [feedbacks, setFeedbacks] = useState([]);
    const [overallFb, setOverallFb] = useState(null);
    const [showDishModal, setShowDishModal] = useState(false);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [dishForm, setDishForm] = useState({ dishName: '', overallRating: 0, tasteRating: 0, presentationRating: 0, quantityAdequate: 'Yes', clientFeedback: '', internalNotes: '', suggestedImprovements: '' });
    const [overallForm, setOverallForm] = useState({ clientSatisfaction: 5, wentWell: '', needsImprovement: '', issues: '', overallRating: 0 });
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingDish, setSavingDish] = useState(false);
    const [savingOverall, setSavingOverall] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        Promise.all([getData(KEYS.FEEDBACK), getData(KEYS.RECIPES)]).then(([fData, rData]) => {
            const allFb = fData.filter(f => f.eventId === event.id);
            setFeedbacks(allFb.filter(f => !f.type));
            setOverallFb(allFb.find(f => f.type === 'overall') || null);
            setRecipes(rData.filter(r => r.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const openDishCreate = () => { setDishForm({ dishName: '', overallRating: 0, tasteRating: 0, presentationRating: 0, quantityAdequate: 'Yes', clientFeedback: '', internalNotes: '', suggestedImprovements: '' }); setEditing(null); setShowDishModal(true); };
    const openDishEdit = (f) => { setDishForm({ ...f }); setEditing(f.id); setShowDishModal(true); };

    const saveDish = async () => {
        if (!dishForm.dishName) return showMsg('Dish name required', 'warning');
        if (!isOnline) {
            showMsg('Offline: Cannot save feedback.', 'error');
            return;
        }

        setSavingDish(true);
        const id = editing || generateId();
        const final = { ...dishForm, id, eventId: event.id };

        try {
            await upsertRecord(KEYS.FEEDBACK, final);
            let updated;
            if (editing) {
                updated = feedbacks.map(f => f.id === editing ? final : f);
            } else {
                updated = [...feedbacks, final];
            }
            setFeedbacks(updated);
            setShowDishModal(false);
            showMsg('Feedback saved');
        } catch (err) {
            showMsg('Failed to save feedback.', 'error');
        } finally {
            setSavingDish(false);
        }
    };

    const saveOverall = async () => {
        if (!isOnline) {
            showMsg('Offline: Cannot save feedback.', 'error');
            return;
        }

        setSavingOverall(true);
        const id = overallFb?.id || generateId();
        const final = { ...overallForm, id, eventId: event.id, type: 'overall' };

        try {
            await upsertRecord(KEYS.FEEDBACK, final);
            setOverallFb(final);
            setShowOverallModal(false);
            showMsg('Overall feedback saved');
        } catch (err) {
            showMsg('Failed to save feedback.', 'error');
        } finally {
            setSavingOverall(false);
        }
    };

    const deleteFb = async (id) => {
        if (!confirm('Delete?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.FEEDBACK, id);
            setFeedbacks(feedbacks.filter(f => f.id !== id));
            showMsg('Feedback removed');
        } catch (err) {
            showMsg('Failed to delete feedback.', 'error');
        }
    };

    const radarData = feedbacks.length > 0 ? feedbacks.map(f => ({
        dish: f.dishName, Taste: f.tasteRating, Presentation: f.presentationRating, Overall: f.overallRating,
    })) : [];

    const barData = feedbacks.map(f => ({ name: f.dishName, rating: f.overallRating }));

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading feedback...</div>;
    }

    return (
        <>
            {/* Overall Event Feedback */}
            <StaggerCard index={0} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#1A1A2E]">Overall Event Feedback</h3>
                    <Btn variant="outline" onClick={() => { if (overallFb) setOverallForm({ ...overallFb }); setShowOverallModal(true); }}>
                        {overallFb ? <><Edit size={14} /> Edit</> : <><Plus size={14} /> Add</>}
                    </Btn>
                </div>
                {overallFb ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between sm:block border-b sm:border-0 pb-2 sm:pb-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Satisfaction</p>
                            <p className="text-xl lg:text-2xl font-bold text-[#E8B86D]">{overallFb.clientSatisfaction}/10</p>
                        </div>
                        <div className="flex items-center justify-between sm:block border-b sm:border-0 pb-2 sm:pb-0">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Overall Rating</p>
                            <StarRating value={overallFb.overallRating} readonly />
                        </div>
                        <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">What Went Well</p><p className="text-sm line-clamp-3">{overallFb.wentWell || '—'}</p></div>
                        {overallFb.needsImprovement && <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Needs Improvement</p><p className="text-sm line-clamp-3">{overallFb.needsImprovement}</p></div>}
                        {overallFb.issues && <div className="sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Issues</p><p className="text-sm text-[#E53935] line-clamp-3">{overallFb.issues}</p></div>}
                    </div>
                ) : <p className="text-sm text-[#7A7A7A]">No overall feedback recorded yet.</p>}
            </StaggerCard>

            {/* Charts */}
            {feedbacks.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <StaggerCard index={1} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#1A1A2E] mb-2">Dish Ratings Comparison</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                                <Tooltip /><Bar dataKey="rating" fill="#E8B86D" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </StaggerCard>
                    <StaggerCard index={2} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#1A1A2E] mb-2">Quality Radar</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={radarData}><PolarGrid /><PolarAngleAxis dataKey="dish" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis domain={[0, 5]} /><Radar name="Taste" dataKey="Taste" stroke="#E8B86D" fill="#E8B86D" fillOpacity={0.3} />
                                <Radar name="Presentation" dataKey="Presentation" stroke="#1A1A2E" fill="#1A1A2E" fillOpacity={0.1} />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </StaggerCard>
                </div>
            )}

            {/* Per-dish feedback table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-[#1A1A2E]">Dish-wise Feedback</h3>
                    <Btn onClick={openDishCreate}><Plus size={14} /> Add Feedback</Btn>
                </div>
                {feedbacks.length === 0 ? (
                    <EmptyState icon={MessageSquare} title="No Dish Feedback" message="Add feedback for each dish served." actionLabel="Add Feedback" onAction={openDishCreate} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                                <th className="text-left px-4 py-3">Dish</th><th className="px-4 py-3 text-center">Overall</th><th className="px-4 py-3 text-center">Taste</th><th className="px-4 py-3 text-center">Presentation</th><th className="px-4 py-3 text-center">Quantity</th><th></th>
                            </tr></thead>
                            <tbody>
                                {feedbacks.map(f => (
                                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-xs lg:text-sm">{f.dishName}</td>
                                        <td className="px-4 py-3 text-center"><StarRating value={f.overallRating} readonly size={12} /></td>
                                        <td className="px-4 py-3 text-center hidden sm:table-cell"><StarRating value={f.tasteRating} readonly size={10} /></td>
                                        <td className="px-4 py-3 text-center hidden md:table-cell"><StarRating value={f.presentationRating} readonly size={10} /></td>
                                        <td className="px-4 py-3 text-center text-xs">{f.quantityAdequate}</td>
                                        <td className="px-4 py-3"><div className="flex gap-1">
                                            <button onClick={() => openDishEdit(f)} className="p-1 hover:bg-gray-100 rounded cursor-pointer"><Edit size={14} /></button>
                                            <button onClick={() => deleteFb(f.id)} className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer"><Trash2 size={14} /></button>
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Dish Feedback Modal */}
            <Modal open={showDishModal} onClose={() => setShowDishModal(false)} title={editing ? 'Edit Dish Feedback' : 'Add Dish Feedback'}>
                <Field label="Dish Name" required>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" value={dishForm.dishName} onChange={e => setDishForm(p => ({ ...p, dishName: e.target.value }))}>
                        <option value="">Select or type...</option>
                        {recipes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                </Field>
                <div className="grid grid-cols-3 gap-4 my-3">
                    <Field label="Overall"><StarRating value={dishForm.overallRating} onChange={v => setDishForm(p => ({ ...p, overallRating: v }))} /></Field>
                    <Field label="Taste"><StarRating value={dishForm.tasteRating} onChange={v => setDishForm(p => ({ ...p, tasteRating: v }))} /></Field>
                    <Field label="Presentation"><StarRating value={dishForm.presentationRating} onChange={v => setDishForm(p => ({ ...p, presentationRating: v }))} /></Field>
                </div>
                <Field label="Quantity Adequate?"><Select options={['Yes', 'No', 'Excess']} value={dishForm.quantityAdequate} onChange={e => setDishForm(p => ({ ...p, quantityAdequate: e.target.value }))} /></Field>
                <Field label="Client Feedback"><Textarea value={dishForm.clientFeedback} onChange={e => setDishForm(p => ({ ...p, clientFeedback: e.target.value }))} /></Field>
                <Field label="Internal Notes"><Textarea value={dishForm.internalNotes} onChange={e => setDishForm(p => ({ ...p, internalNotes: e.target.value }))} /></Field>
                <Field label="Suggested Improvements"><Textarea value={dishForm.suggestedImprovements} onChange={e => setDishForm(p => ({ ...p, suggestedImprovements: e.target.value }))} /></Field>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowDishModal(false)}>Cancel</Btn>
                    <Btn onClick={saveDish} loading={savingDish} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>

            {/* Overall Modal */}
            <Modal open={showOverallModal} onClose={() => setShowOverallModal(false)} title="Overall Event Feedback">
                <Field label="Client Satisfaction (1-10)"><Input type="number" min="1" max="10" value={overallForm.clientSatisfaction} onChange={e => setOverallForm(p => ({ ...p, clientSatisfaction: parseInt(e.target.value) || 0 }))} /></Field>
                <Field label="Overall Rating"><StarRating value={overallForm.overallRating} onChange={v => setOverallForm(p => ({ ...p, overallRating: v }))} /></Field>
                <Field label="What Went Well"><Textarea value={overallForm.wentWell} onChange={e => setOverallForm(p => ({ ...p, wentWell: e.target.value }))} /></Field>
                <Field label="What Needs Improvement"><Textarea value={overallForm.needsImprovement} onChange={e => setOverallForm(p => ({ ...p, needsImprovement: e.target.value }))} /></Field>
                <Field label="Issues Faced"><Textarea value={overallForm.issues} onChange={e => setOverallForm(p => ({ ...p, issues: e.target.value }))} /></Field>
                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowOverallModal(false)}>Cancel</Btn>
                    <Btn onClick={saveOverall} loading={savingOverall} loadingText="Saving...">Save</Btn>
                </div>
            </Modal>

            <FAB onClick={openDishCreate} label="Add Feedback" />

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
