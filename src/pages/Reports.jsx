import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getData, KEYS } from '../utils/storage';
import { PageWrap, EmptyState } from '../components/ui';
import { FileText } from 'lucide-react';

export default function Reports() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getData(KEYS.EVENTS).then(data => {
            setEvents(data);
            setLoading(false);
        });
    }, []);

    return (
        <PageWrap>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Reports</h1>
                <p className="text-sm text-[#7A7A7A]">Generate detailed reports for any event</p>
            </div>
            {loading ? (
                <div className="py-20 text-center text-[#7A7A7A]">Loading events...</div>
            ) : events.length === 0 ? (
                <EmptyState icon={FileText} title="No Events" message="Create events first to generate reports." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map(e => (
                        <div key={e.id} onClick={() => navigate(`/events/${e.id}?tab=Report`)} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#E8B86D]/30 transition-all cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-[#1A1A2E] rounded-lg flex items-center justify-center"><FileText size={20} className="text-[#E8B86D]" /></div>
                                <div><h3 className="font-bold text-[#1A1A2E] text-sm">{e.name}</h3><p className="text-xs text-[#7A7A7A]">{e.clientName}</p></div>
                            </div>
                            <p className="text-xs text-[#E8B86D] font-medium">Click to generate report →</p>
                        </div>
                    ))}
                </div>
            )}
        </PageWrap>
    );
}
