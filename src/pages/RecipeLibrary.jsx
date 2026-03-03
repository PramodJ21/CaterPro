import React, { useState, useEffect } from 'react';
import { getData, upsertRecord, KEYS } from '../utils/storage';
import { formatCurrency, CATEGORIES } from '../utils/helpers';
import { PageWrap, StaggerCard, Modal, EmptyState, Btn, Field, Input, Select, Textarea, SearchBar, Notification, useOnlineStatus } from '../components/ui';
import { UtensilsCrossed, Plus, Copy, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function RecipeLibrary() {
    const isOnline = useOnlineStatus();
    const [recipes, setRecipes] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [processing, setProcessing] = useState(null); // Track which recipe is being deleted

    useEffect(() => {
        getData(KEYS.RECIPES).then(data => {
            setRecipes(data.filter(r => r.isTemplate));
            setLoading(false);
        });
    }, []);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const filtered = recipes.filter(r => {
        const q = search.toLowerCase();
        return (!q || r.name.toLowerCase().includes(q)) && (!filterCat || r.category === filterCat);
    });

    const deleteTemplate = async (id) => {
        if (!confirm('Remove from library?')) return;
        if (!isOnline) {
            showMsg('Offline: Check your connection.', 'error');
            return;
        }

        setProcessing(id);
        try {
            const all = await getData(KEYS.RECIPES);
            const recipeToUpdate = all.find(r => r.id === id);
            if (!recipeToUpdate) throw new Error('Recipe not found');

            const updatedRecipe = { ...recipeToUpdate, isTemplate: false };
            await upsertRecord(KEYS.RECIPES, updatedRecipe);

            setRecipes(recipes.filter(r => r.id !== id));
            showMsg('Recipe removed from library');
        } catch (err) {
            showMsg('Failed to remove recipe.', 'error');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <PageWrap>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Recipe Library</h1>
                <p className="text-sm text-[#7A7A7A]">{recipes.length} template recipes — reuse these in future events</p>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                <SearchBar value={search} onChange={setSearch} placeholder="Search recipes..." />
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading recipes...</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={UtensilsCrossed} title="No Templates" message="Mark a recipe as template from any event's Menu tab." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((r, i) => {
                        const cost = r.ingredients?.reduce((s, ing) => s + (ing.totalCost || 0), 0) || 0;
                        return (
                            <StaggerCard key={r.id} index={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div><h3 className="font-bold text-[#1A1A2E]">{r.name}</h3><p className="text-xs text-[#E8B86D] font-medium">{r.category}</p></div>
                                        <button
                                            onClick={() => deleteTemplate(r.id)}
                                            disabled={processing === r.id}
                                            className={`p-1 rounded text-red-500 cursor-pointer ${processing === r.id ? 'opacity-50' : 'hover:bg-red-100'}`}
                                        >
                                            {processing === r.id ? (
                                                <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-sm text-[#7A7A7A] mb-2">{r.ingredients?.length || 0} ingredients</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{formatCurrency(cost)}</span>
                                        <span className="text-[#7A7A7A]">Yield: {r.totalYield || '—'}</span>
                                    </div>
                                    {r.prepNotes && <p className="text-xs text-[#7A7A7A] mt-2 line-clamp-2">{r.prepNotes}</p>}
                                </div>
                            </StaggerCard>
                        );
                    })}
                </div>
            )}

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
