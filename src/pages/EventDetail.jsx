import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getData, KEYS } from '../utils/storage';
import { formatDate, formatCurrency } from '../utils/helpers';
import { PageWrap, TabBar, Btn, StatusBadge } from '../components/ui';
import { ArrowLeft, FileText } from 'lucide-react';
import OverviewTab from '../tabs/OverviewTab';
import MenuTab from '../tabs/MenuTab';
import ProcurementTab from '../tabs/ProcurementTab';
import InventoryTab from '../tabs/InventoryTab';
import AttendanceTab from '../tabs/AttendanceTab';
import MomTab from '../tabs/MomTab';
import FeedbackTab from '../tabs/FeedbackTab';
import ReportTab from '../tabs/ReportTab';

const TABS = ['Overview', 'Menu & Recipes', 'Procurement', 'Inventory Used', 'Attendance', 'MoM', 'Feedback', 'Report'];

export default function EventDetail({ setCurrentEvent }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [event, setEvent] = useState(null);
    const [tab, setTab] = useState(searchParams.get('tab') || 'Overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getData(KEYS.EVENTS).then(events => {
            if (!isMounted) return;
            const ev = events.find(e => e.id === id);
            setEvent(ev || null);
            setLoading(false);
            if (ev && setCurrentEvent) setCurrentEvent(ev);
        });
        return () => {
            isMounted = false;
            if (setCurrentEvent) setCurrentEvent(null);
        };
    }, [id, setCurrentEvent]);

    if (loading) return <PageWrap><div className="py-20 text-center text-[#7A7A7A]">Loading event details...</div></PageWrap>;
    if (!event) return <PageWrap><p className="text-center text-[#7A7A7A] py-20">Event not found.</p></PageWrap>;

    const refreshEvent = async () => {
        const events = await getData(KEYS.EVENTS);
        setEvent(events.find(e => e.id === id));
    };

    const tabContent = {
        'Overview': <OverviewTab event={event} />,
        'Menu & Recipes': <MenuTab event={event} />,
        'Procurement': <ProcurementTab event={event} />,
        'Inventory Used': <InventoryTab event={event} />,
        'Attendance': <AttendanceTab event={event} />,
        'MoM': <MomTab event={event} />,
        'Feedback': <FeedbackTab event={event} />,
        'Report': <ReportTab event={event} />,
    };

    return (
        <PageWrap>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/events')} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A2E] truncate max-w-[200px] sm:max-w-none">{event.name}</h1>
                        <StatusBadge status={event.status} />
                    </div>
                </div>
                <div className="sm:flex-1 sm:text-right">
                    <p className="text-xs lg:text-sm text-[#7A7A7A]">{event.clientName} • {formatDate(event.date)}</p>
                    <p className="text-xs text-[#7A7A7A] truncate max-w-[300px]">{event.venue}</p>
                </div>
            </div>
            <TabBar tabs={TABS} active={tab} onChange={t => {
                setTab(t);
                setSearchParams({ tab: t }, { replace: true });
            }} />
            {tabContent[tab]}
        </PageWrap>
    );
}
