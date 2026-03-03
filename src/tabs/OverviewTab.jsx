import React from 'react';
import { formatDate, formatCurrency } from '../utils/helpers';
import { Calendar, MapPin, Users, DollarSign, UtensilsCrossed, FileText } from 'lucide-react';
import { StaggerCard } from '../components/ui';

export default function OverviewTab({ event }) {
    const e = event;
    const cards = [
        { icon: Calendar, label: 'Date & Time', value: `${formatDate(e.date)}${e.time ? ' at ' + e.time : ''}` },
        { icon: MapPin, label: 'Venue', value: e.venue || '—' },
        { icon: Users, label: 'Guests', value: `${e.confirmedGuests || '—'} confirmed / ${e.estimatedGuests || '—'} estimated` },
        { icon: DollarSign, label: 'Budget', value: `${formatCurrency(e.estimatedBudget)} est. / ${formatCurrency(e.actualBudget)} actual` },
        { icon: FileText, label: 'Event Type', value: e.eventType || '—' },
    ];

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
                {cards.map((c, i) => (
                    <StaggerCard key={c.label} index={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#E8B86D]/10 flex items-center justify-center shrink-0">
                                <c.icon size={20} className="text-[#E8B86D]" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-0.5">{c.label}</p>
                                <p className="text-sm font-medium text-[#1A1A2E]">{c.value}</p>
                            </div>
                        </div>
                    </StaggerCard>
                ))}
            </div>
            {e.specialNotes && (
                <StaggerCard index={6} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-2">Special Notes</h3>
                    <p className="text-sm text-[#2D2D2D] whitespace-pre-wrap">{e.specialNotes}</p>
                </StaggerCard>
            )}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StaggerCard index={7} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Client</p>
                    <p className="font-medium text-[#1A1A2E]">{e.clientName}</p>
                    <p className="text-sm text-[#7A7A7A]">{e.clientContact || '—'}</p>
                </StaggerCard>
                <StaggerCard index={8} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A] mb-1">Budget Variance</p>
                    {e.actualBudget > 0 ? (
                        <>
                            <p className={`text-xl font-bold ${e.actualBudget <= e.estimatedBudget ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>
                                {formatCurrency(Math.abs(e.estimatedBudget - e.actualBudget))}
                            </p>
                            <p className="text-sm text-[#7A7A7A]">{e.actualBudget <= e.estimatedBudget ? 'Under budget' : 'Over budget'}</p>
                        </>
                    ) : <p className="text-sm text-[#7A7A7A]">Actual budget not yet recorded</p>}
                </StaggerCard>
            </div>
        </div>
    );
}
