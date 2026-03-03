import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, deleteRecord, KEYS, generateId } from '../utils/storage';
import { formatCurrency, CATEGORIES } from '../utils/helpers';
import { Modal, EmptyState, FAB, Btn, Field, Input, Select, Textarea, StaggerCard, Notification, useOnlineStatus } from '../components/ui';
import { UtensilsCrossed, Plus, Trash2, Edit, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const emptyDish = {
    name: '', category: '', headCount: '',
    ingredients: [{ name: '', unit: 'kg', quantity: '' }],
    totalYield: '', leftoverWeight: '', leftoverPercent: '',
    portionSize: '', notes: '',
};

export default function MenuTab({ event }) {
    const isOnline = useOnlineStatus();
    const [dishes, setDishes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ ...emptyDish });
    const [errors, setErrors] = useState({});
    const [expandedDish, setExpandedDish] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        getData(KEYS.RECIPES).then(data => {
            setDishes(data.filter(r => r.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const calcDish = (f) => {
        const y = parseFloat(f.totalYield) || 0;
        const lw = parseFloat(f.leftoverWeight) || 0;
        const lp = y > 0 ? Math.round((lw / y) * 1000) / 10 : 0;
        return { ...f, leftoverPercent: lp };
    };

    const openCreate = () => { setForm({ ...emptyDish, ingredients: [{ name: '', unit: 'kg', quantity: '' }] }); setEditing(null); setErrors({}); setShowModal(true); };
    const openEdit = (d) => { setForm({ ...d }); setEditing(d.id); setErrors({}); setShowModal(true); };

    const addIngRow = () => setForm(p => ({ ...p, ingredients: [...p.ingredients, { name: '', unit: 'kg', quantity: '' }] }));
    const removeIngRow = (idx) => setForm(p => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }));
    const updateIng = (idx, field, val) => {
        setForm(p => {
            const ings = [...p.ingredients];
            ings[idx] = { ...ings[idx], [field]: val };
            return { ...p, ingredients: ings };
        });
    };

    const save = async () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Required';
        if (!form.category) e.category = 'Required';
        setErrors(e);
        if (Object.keys(e).length) return;

        if (!isOnline) {
            showMsg('Offline: Cannot save dish.', 'error');
            return;
        }

        setSaving(true);
        const id = editing || generateId();
        const final = { ...calcDish(form), id, eventId: event.id };

        try {
            await upsertRecord(KEYS.RECIPES, final);
            let updated;
            if (editing) {
                updated = dishes.map(d => d.id === editing ? final : d);
            } else {
                updated = [...dishes, final];
            }
            setDishes(updated);
            setShowModal(false);
            showMsg('Dish saved');
        } catch (err) {
            showMsg('Failed to save dish.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteDish = async (did) => {
        if (!confirm('Delete this dish?')) return;
        if (!isOnline) {
            showMsg('Offline: Cannot delete.', 'error');
            return;
        }

        try {
            showMsg('Deleting...', 'info');
            await deleteRecord(KEYS.RECIPES, did);
            setDishes(dishes.filter(d => d.id !== did));
            showMsg('Dish removed');
        } catch (err) {
            showMsg('Failed to delete dish.', 'error');
        }
    };

    const toggleExpand = (id) => setExpandedDish(prev => prev === id ? null : id);

    const getLeftoverBg = (pct) => {
        if (pct == null || pct === '') return '';
        if (pct < 10) return 'text-[#4CAF50]';
        if (pct <= 25) return 'text-[#FF9800]';
        return 'text-[#E53935]';
    };

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Loading menu...</div>;
    }

    if (dishes.length === 0 && !showModal) {
        return <><EmptyState icon={UtensilsCrossed} title="No Dishes Yet" message="Add dishes for this event with ingredients, yield, and serving details." actionLabel="Add Dish" onAction={openCreate} />{renderModal()}</>;
    }

    function renderModal() {
        return (
            <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Dish' : 'Add Dish'} wide>
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
                    <Field label="Dish Name" required error={errors.name}>
                        <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Butter Chicken" />
                    </Field>
                    <Field label="Category" required error={errors.category}>
                        <Select options={CATEGORIES} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
                    </Field>
                    <Field label="Head Count (servings for)">
                        <Input type="number" value={form.headCount} onChange={e => setForm(p => ({ ...p, headCount: e.target.value }))} placeholder="e.g. 300" />
                    </Field>
                </div>

                {/* Ingredients */}
                <div className="mt-4 mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">Ingredients & Quantities</h4>
                    <Btn variant="ghost" onClick={addIngRow} className="text-xs"><Plus size={14} /> Add Row</Btn>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-x-auto mb-4">
                    <table className="w-full text-sm min-w-[500px]">
                        <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                            <th className="text-left px-3 py-2 w-[45%]">Ingredient Name</th>
                            <th className="px-3 py-2 w-[20%] text-center">Quantity</th>
                            <th className="px-3 py-2 w-[20%] text-center">Unit</th>
                            <th className="px-3 py-2 w-[15%]"></th>
                        </tr></thead>
                        <tbody>
                            {form.ingredients.map((ing, idx) => (
                                <tr key={idx} className="border-b border-gray-50">
                                    <td className="px-2 lg:px-3 py-1.5">
                                        <Input value={ing.name} onChange={e => updateIng(idx, 'name', e.target.value)} placeholder="e.g. Chicken Breast" className="!px-2" />
                                    </td>
                                    <td className="px-2 lg:px-3 py-1.5">
                                        <Input type="number" value={ing.quantity} onChange={e => updateIng(idx, 'quantity', e.target.value)} placeholder="25" className="!px-2 text-center" />
                                    </td>
                                    <td className="px-2 lg:px-3 py-1.5">
                                        <select value={ing.unit} onChange={e => updateIng(idx, 'unit', e.target.value)}
                                            className="w-full px-1 lg:px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#E8B86D]">
                                            <option>kg</option><option>g</option><option>L</option><option>ml</option><option>pcs</option><option>dozen</option><option>cups</option><option>tbsp</option><option>tsp</option>
                                        </select>
                                    </td>
                                    <td className="px-1 lg:px-3 py-1.5 text-center">
                                        {form.ingredients.length > 1 && (
                                            <button onClick={() => removeIngRow(idx)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={14} /></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Yield, Portion, Leftover */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4">
                    <Field label="Total Yield (kg/L/portions)">
                        <Input type="number" value={form.totalYield} onChange={e => setForm(p => calcDish({ ...p, totalYield: e.target.value }))} placeholder="e.g. 60" />
                    </Field>
                    <Field label="Portion Size (per person)">
                        <Input value={form.portionSize} onChange={e => setForm(p => ({ ...p, portionSize: e.target.value }))} placeholder="e.g. 180g" />
                    </Field>
                    <Field label="Leftover Weight (kg/L)">
                        <Input type="number" value={form.leftoverWeight} onChange={e => setForm(p => calcDish({ ...p, leftoverWeight: e.target.value }))} placeholder="e.g. 2.5" />
                    </Field>
                    <Field label="Leftover %">
                        <Input type="number" value={form.leftoverPercent} readOnly className="!bg-gray-50" />
                    </Field>
                </div>

                {/* Notes */}
                <Field label="Notes">
                    <Textarea value={form.notes || form.prepNotes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value, prepNotes: e.target.value }))} placeholder="Cooking instructions, special requirements, allergy info..." />
                </Field>

                <div className="flex justify-end gap-3 mt-4">
                    <Btn variant="outline" onClick={() => setShowModal(false)}>Cancel</Btn>
                    <Btn onClick={save} loading={saving} loadingText="Saving...">{editing ? 'Update' : 'Add'} Dish</Btn>
                </div>
            </Modal>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-bold text-[#1A1A2E]">Event Dishes</h2>
                    <p className="text-sm text-[#7A7A7A]">{dishes.length} dishes for this event</p>
                </div>
                <Btn onClick={openCreate}><Plus size={14} /> Add Dish</Btn>
            </div>

            {/* Dish Cards */}
            <div className="space-y-4">
                {dishes.map((dish, i) => {
                    const isExpanded = expandedDish === dish.id;
                    const leftoverColor = getLeftoverBg(dish.leftoverPercent);
                    const filteredIngredients = (dish.ingredients || []).filter(ing => ing.name);

                    return (
                        <StaggerCard key={dish.id} index={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Card Header — always visible */}
                            <div className="p-5 cursor-pointer" onClick={() => toggleExpand(dish.id)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 lg:gap-4 flex-1 min-w-0">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-[#E8B86D]/10 flex items-center justify-center shrink-0">
                                            <UtensilsCrossed size={18} className="text-[#E8B86D]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h3 className="font-bold text-[#1A1A2E] text-sm lg:text-base truncate">{dish.name}</h3>
                                                <span className="px-2 py-0.5 bg-[#E8B86D]/10 text-[#E8B86D] text-[10px] lg:text-xs font-medium rounded-full">{dish.category}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#7A7A7A]">
                                                {dish.headCount && (
                                                    <span className="flex items-center gap-1 shrink-0"><Users size={12} /> {dish.headCount}</span>
                                                )}
                                                {dish.totalYield && <span className="shrink-0">Yield: <strong className="text-[#2D2D2D]">{dish.totalYield}</strong></span>}
                                                {dish.portionSize && <span className="shrink-0">Portion: <strong className="text-[#2D2D2D]">{dish.portionSize}</strong></span>}
                                                {dish.leftoverPercent != null && dish.leftoverPercent !== '' && (
                                                    <span className="shrink-0">Left: <strong className={leftoverColor}>{dish.leftoverPercent}%</strong></span>
                                                )}
                                                <span className="text-[10px] text-[#7A7A7A] opacity-60">{filteredIngredients.length} ingredients</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={e => { e.stopPropagation(); openEdit(dish); }} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"><Edit size={16} className="text-gray-500" /></button>
                                        <button onClick={e => { e.stopPropagation(); deleteDish(dish.id); }} className="p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 size={16} className="text-red-400" /></button>
                                        {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Ingredients List */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-2">Ingredients</h4>
                                            {filteredIngredients.length === 0 ? (
                                                <p className="text-sm text-[#7A7A7A]">No ingredients added</p>
                                            ) : (
                                                <div className="border border-gray-100 rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead><tr className="text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                                                            <th className="text-left px-3 py-2">Ingredient</th>
                                                            <th className="text-right px-3 py-2">Quantity</th>
                                                        </tr></thead>
                                                        <tbody>
                                                            {filteredIngredients.map((ing, j) => (
                                                                <tr key={j} className="border-b border-gray-50">
                                                                    <td className="px-3 py-2 font-medium">{ing.name}</td>
                                                                    <td className="px-3 py-2 text-right text-[#E8B86D] font-medium">{ing.quantity || '—'} {ing.unit}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        {/* Details & Notes */}
                                        <div>
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-2">Dish Details</h4>
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-[#7A7A7A] uppercase">Head Count</p>
                                                    <p className="text-lg font-bold text-[#1A1A2E]">{dish.headCount || '—'}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-[#7A7A7A] uppercase">Total Yield</p>
                                                    <p className="text-lg font-bold text-[#1A1A2E]">{dish.totalYield || '—'}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-[#7A7A7A] uppercase">Portion Size</p>
                                                    <p className="text-lg font-bold text-[#1A1A2E]">{dish.portionSize || '—'}</p>
                                                </div>
                                                <div className="p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs text-[#7A7A7A] uppercase">Leftover</p>
                                                    <p className={`text-lg font-bold ${leftoverColor || 'text-[#1A1A2E]'}`}>
                                                        {dish.leftoverWeight || '—'} {dish.leftoverPercent != null && dish.leftoverPercent !== '' ? `(${dish.leftoverPercent}%)` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {(dish.notes || dish.prepNotes) && (
                                                <>
                                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Notes</h4>
                                                    <p className="text-sm text-[#2D2D2D] p-3 bg-amber-50 rounded-lg whitespace-pre-wrap">{dish.notes || dish.prepNotes}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </StaggerCard>
                    );
                })}
            </div>

            {/* Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-bold text-[#1A1A2E] text-sm">Dishes Summary</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="text-[10px] lg:text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                            <th className="text-left px-4 py-3">Dish</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                            <th className="px-4 py-3 text-right">Head Count</th>
                            <th className="px-4 py-3 text-right hidden md:table-cell">Ingredients</th>
                            <th className="px-4 py-3 text-right">Yield</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Portion</th>
                            <th className="px-4 py-3 text-right hidden sm:table-cell">Leftover</th>
                            <th className="px-4 py-3 text-right">Leftover %</th>
                        </tr></thead>
                        <tbody>
                            {dishes.map(d => {
                                const bgColor = d.leftoverPercent < 10 ? 'bg-green-50/50' : d.leftoverPercent <= 25 ? 'bg-yellow-50/50' : 'bg-red-50/50';
                                const filteredIngs = (d.ingredients || []).filter(i => i.name);
                                return (
                                    <tr key={d.id} className={`border-b border-gray-50 ${d.leftoverPercent != null ? bgColor : ''}`}>
                                        <td className="px-4 py-3 font-medium text-xs lg:text-sm">{d.name}</td>
                                        <td className="px-4 py-3 text-center text-[#7A7A7A] hidden sm:table-cell">{d.category}</td>
                                        <td className="px-4 py-3 text-right">{d.headCount || '—'}</td>
                                        <td className="px-4 py-3 text-right hidden md:table-cell">{filteredIngs.length}</td>
                                        <td className="px-4 py-3 text-right">{d.totalYield || '—'}</td>
                                        <td className="px-4 py-3 text-center hidden lg:table-cell">{d.portionSize || '—'}</td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">{d.leftoverWeight || '—'}</td>
                                        <td className="px-4 py-3 text-right font-medium">{d.leftoverPercent != null && d.leftoverPercent !== '' ? `${d.leftoverPercent}%` : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {renderModal()}
            <FAB onClick={openCreate} label="Add Dish" />

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
