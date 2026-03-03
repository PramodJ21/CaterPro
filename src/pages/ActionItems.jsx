import { getData, upsertRecord, KEYS } from '../utils/storage';
import { formatDate } from '../utils/helpers';
import { PageWrap, EmptyState, StatusBadge, SearchBar, Notification, useOnlineStatus } from '../components/ui';
import { ClipboardList, CheckCircle, Circle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export default function ActionItems() {
    const isOnline = useOnlineStatus();
    const [moms, setMoms] = useState([]);
    const [filterOwner, setFilterOwner] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        Promise.all([getData(KEYS.MOM), getData(KEYS.EVENTS)]).then(([mData, eData]) => {
            setMoms(mData);
            setEvents(eData);
            setLoading(false);
        });
    }, []);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const allActions = moms.flatMap(m => {
        const ev = events.find(e => e.id === m.eventId);
        return (m.actionItems || []).filter(a => a.task).map((a, idx) => ({
            ...a, momId: m.id, idx, eventName: ev?.name || 'Unknown', meetingType: m.type, meetingDate: m.meetingDate,
        }));
    });

    const owners = [...new Set(allActions.map(a => a.assignedTo).filter(Boolean))];

    const filtered = allActions.filter(a => {
        return (!filterOwner || a.assignedTo === filterOwner) && (!filterStatus || a.status === filterStatus);
    });

    const toggleStatus = async (momId, idx) => {
        if (!isOnline) {
            showMsg('Offline: Check connection.', 'error');
            return;
        }

        const m = moms.find(x => x.id === momId);
        if (!m) return;

        const updatedItems = [...m.actionItems];
        const newStatus = updatedItems[idx].status === 'Done' ? 'Pending' : 'Done';
        updatedItems[idx] = { ...updatedItems[idx], status: newStatus };
        const updatedMom = { ...m, actionItems: updatedItems };

        try {
            await upsertRecord(KEYS.MOM, updatedMom);
            const updatedMoms = moms.map(x => x.id === momId ? updatedMom : x);
            setMoms(updatedMoms);
            showMsg(`Task marked as ${newStatus}`);
        } catch (err) {
            showMsg('Failed to update status.', 'error');
        }
    };

    return (
        <PageWrap>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Action Items</h1>
                <p className="text-sm text-[#7A7A7A]">{allActions.filter(a => a.status === 'Pending').length} pending across all events</p>
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                <select value={filterOwner} onChange={e => setFilterOwner(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All Owners</option>{owners.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="">All Status</option><option value="Pending">Pending</option><option value="Done">Done</option>
                </select>
            </div>
            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading action items...</div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={ClipboardList} title="No Action Items" message="Action items from meeting notes will appear here." />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="text-xs text-[#7A7A7A] uppercase bg-gray-50 border-b">
                                <th className="w-10 px-4 py-3"></th><th className="text-left px-4 py-3">Task</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Assigned To</th><th className="px-4 py-3">Due Date</th><th className="px-4 py-3">Status</th>
                            </tr></thead>
                            <tbody>
                                {filtered.map((a, i) => (
                                    <tr key={`${a.momId}-${a.idx}`} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => toggleStatus(a.momId, a.idx)}>
                                        <td className="px-4 py-3">{a.status === 'Done' ? <CheckCircle size={18} className="text-[#4CAF50]" /> : <Circle size={18} className="text-gray-300" />}</td>
                                        <td className={`px-4 py-3 font-medium ${a.status === 'Done' ? 'line-through text-[#7A7A7A]' : ''}`}>{a.task}</td>
                                        <td className="px-4 py-3 text-center text-[#7A7A7A]">{a.eventName}</td>
                                        <td className="px-4 py-3 text-center">{a.assignedTo || '—'}</td>
                                        <td className="px-4 py-3 text-center text-[#7A7A7A]">{formatDate(a.dueDate)}</td>
                                        <td className="px-4 py-3 text-center"><StatusBadge status={a.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
