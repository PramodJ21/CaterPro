import React, { useRef, useState, useEffect } from 'react';
import { getData, KEYS } from '../utils/storage';
import { formatDate, formatCurrency } from '../utils/helpers';
import { Btn, StarRating, Notification, useOnlineStatus } from '../components/ui';
import { Printer, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AnimatePresence } from 'framer-motion';

export default function ReportTab({ event }) {
    const isOnline = useOnlineStatus();
    const reportRef = useRef();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [notification, setNotification] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [procurement, setProcurement] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [moms, setMoms] = useState([]);
    const [feedback, setFeedback] = useState([]);

    const showMsg = (message, type = 'success') => {
        setNotification({ message, type });
    };

    useEffect(() => {
        Promise.all([
            getData(KEYS.RECIPES), getData(KEYS.PROCUREMENT),
            getData(KEYS.ATTENDANCE), getData(KEYS.MOM), getData(KEYS.FEEDBACK)
        ]).then(([rData, pData, aData, mData, fData]) => {
            setRecipes(rData.filter(r => r.eventId === event.id));
            setProcurement(pData.filter(p => p.eventId === event.id));
            setAttendance(aData.filter(a => a.eventId === event.id));
            setMoms(mData.filter(m => m.eventId === event.id));
            setFeedback(fData.filter(f => f.eventId === event.id));
            setLoading(false);
        });
    }, [event.id]);

    const dishFeedback = feedback.filter(f => !f.type);
    const overallFb = feedback.find(f => f.type === 'overall');

    const totalProcCost = procurement.reduce((s, p) => s + (p.totalCost || 0), 0);
    const totalLabor = attendance.reduce((s, a) => {
        if (a.status === 'Absent') return s;
        return s + (a.dailyRate || 0) * (a.status === 'Half-Day' ? 0.5 : 1);
    }, 0);
    const totalEventCost = totalProcCost + totalLabor;

    const handlePrint = () => window.print();
    const handlePDF = async () => {
        const el = reportRef.current;
        if (!el) return;

        try {
            setGenerating(true);
            showMsg('Generating PDF...', 'info');

            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = (canvas.height * pdfW) / canvas.width;
            let pos = 0;
            const pageH = pdf.internal.pageSize.getHeight();

            while (pos < pdfH) {
                if (pos > 0) pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, -pos, pdfW, pdfH);
                pos += pageH;
            }

            pdf.save(`CaterPro_Report_${event.name.replace(/\s+/g, '_')}.pdf`);
            showMsg('PDF Downloaded successfully');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            showMsg('Failed to generate PDF. Please try again.', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const Section = ({ title, children }) => (
        <div className="mb-6">
            <h3 className="text-sm font-bold text-[#1A1A2E] uppercase tracking-wider border-b-2 border-[#E8B86D] pb-1 mb-3">{title}</h3>
            {children}
        </div>
    );

    const Row = ({ label, value }) => (
        <div className="flex justify-between py-1 text-sm"><span className="text-[#7A7A7A]">{label}</span><span className="font-medium">{value}</span></div>
    );

    if (loading) {
        return <div className="py-20 text-center text-[#7A7A7A]">Generating report data...</div>;
    }

    return (
        <>
            <div className="flex gap-3 mb-6 no-print">
                <Btn onClick={handlePrint}><Printer size={16} /> Print Report</Btn>
                <Btn variant="secondary" onClick={handlePDF} loading={generating} loadingText="Generating..."><Download size={16} /> Download PDF</Btn>
            </div>

            <div ref={reportRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-[#1A1A2E] pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#E8B86D] rounded-xl flex items-center justify-center font-bold text-[#1A1A2E] text-lg">CP</div>
                        <div><h1 className="text-xl font-bold text-[#1A1A2E]">CaterPro Event Report</h1><p className="text-xs text-[#7A7A7A]">Generated: {new Date().toLocaleDateString()}</p></div>
                    </div>
                </div>

                <Section title="Event Overview">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                        <Row label="Event Name" value={event.name} /><Row label="Client" value={event.clientName} />
                        <Row label="Date" value={formatDate(event.date)} /><Row label="Venue" value={event.venue} />
                        <Row label="Guests (Est/Conf)" value={`${event.estimatedGuests || '—'} / ${event.confirmedGuests || '—'}`} />
                        <Row label="Event Type" value={event.eventType} />
                        <Row label="Budget (Est)" value={formatCurrency(event.estimatedBudget)} /><Row label="Budget (Actual)" value={formatCurrency(event.actualBudget)} />
                        <Row label="Status" value={event.status} />
                    </div>
                </Section>

                {recipes.length > 0 && (
                    <Section title="Menu Summary">
                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-[10px] sm:text-sm border-collapse min-w-[500px] sm:min-w-0">
                                <thead><tr className="text-[#7A7A7A] text-[10px] uppercase border-b">
                                    <th className="text-left py-2">Dish</th><th className="py-2">Category</th><th className="py-2 text-right">Yield</th><th className="py-2 text-right">Portions</th><th className="py-2 text-right">Leftover%</th>
                                </tr></thead>
                                <tbody>
                                    {recipes.map(r => (
                                        <tr key={r.id} className="border-b border-gray-100"><td className="py-1.5">{r.name}</td><td className="text-center text-[#7A7A7A]">{r.category}</td>
                                            <td className="text-right">{r.totalYield || '—'}</td><td className="text-right">{r.portionSize || '—'}</td><td className="text-right">{r.leftoverPercent != null ? `${r.leftoverPercent}%` : '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {procurement.length > 0 && (
                    <Section title="Procurement Summary">
                        <Row label="Total Spend" value={formatCurrency(totalProcCost)} />
                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-[10px] sm:text-sm border-collapse mt-2 min-w-[500px] sm:min-w-0">
                                <thead><tr className="text-[10px] text-[#7A7A7A] uppercase border-b"><th className="text-left py-2">Vendor</th><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Total</th><th className="py-2">Status</th></tr></thead>
                                <tbody>{procurement.map(p => (
                                    <tr key={p.id} className="border-b border-gray-100"><td className="py-1.5">{p.vendorName}</td><td className="text-center">{p.itemName}</td><td className="text-right">{p.quantity} {p.unit}</td><td className="text-right">{formatCurrency(p.totalCost)}</td><td className="text-center text-[10px]">{p.paymentStatus}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {attendance.length > 0 && (
                    <Section title="Attendance Summary">
                        <Row label="Workers Deployed" value={attendance.length} /><Row label="Total Labor Cost" value={formatCurrency(totalLabor)} />
                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-[10px] sm:text-sm border-collapse mt-2 min-w-[400px] sm:min-w-0">
                                <thead><tr className="text-[10px] text-[#7A7A7A] uppercase border-b"><th className="text-left py-2">Worker</th><th className="py-2">Role</th><th className="py-2">Status</th><th className="py-2 text-right">Hours</th></tr></thead>
                                <tbody>{attendance.map(a => (
                                    <tr key={a.id} className="border-b border-gray-100"><td className="py-1.5">{a.workerName}</td><td className="text-center">{a.role}</td><td className="text-center">{a.status}</td><td className="text-right">{a.hoursWorked || '—'}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                    </Section>
                )}

                {moms.length > 0 && (
                    <Section title="Minutes of Meeting">
                        {moms.map(m => (
                            <div key={m.id} className="mb-3 p-3 bg-gray-50 rounded">
                                <p className="font-medium text-sm">{m.type}-Event Meeting — {formatDate(m.meetingDate)}</p>
                                {m.agendaItems?.filter(a => a.point).map((a, i) => <p key={i} className="text-xs text-[#7A7A7A] mt-1">• {a.point}{a.decision ? `: ${a.decision}` : ''}</p>)}
                                {m.actionItems?.filter(a => a.task).map((a, i) => <p key={i} className="text-xs mt-1">[{a.status}] {a.task} — {a.assignedTo}</p>)}
                            </div>
                        ))}
                    </Section>
                )}

                {dishFeedback.length > 0 && (
                    <Section title="Feedback & Ratings">
                        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                            <table className="w-full text-[10px] sm:text-sm border-collapse min-w-[500px] sm:min-w-0">
                                <thead><tr className="text-[10px] text-[#7A7A7A] uppercase border-b"><th className="text-left py-2">Dish</th><th className="py-2">Overall</th><th className="py-2">Taste</th><th className="py-2">Presentation</th><th className="py-2">Qty</th></tr></thead>
                                <tbody>{dishFeedback.map(f => (
                                    <tr key={f.id} className="border-b border-gray-100"><td className="py-1.5">{f.dishName}</td><td className="text-center">{'★'.repeat(f.overallRating)}{'☆'.repeat(5 - f.overallRating)}</td><td className="text-center">{'★'.repeat(f.tasteRating)}{'☆'.repeat(5 - f.tasteRating)}</td><td className="text-center">{'★'.repeat(f.presentationRating)}{'☆'.repeat(5 - f.presentationRating)}</td><td className="text-center">{f.quantityAdequate}</td></tr>
                                ))}</tbody>
                            </table>
                        </div>
                        {overallFb && <div className="mt-3 p-3 bg-[#E8B86D]/5 rounded"><Row label="Client Satisfaction" value={`${overallFb.clientSatisfaction}/10`} />{overallFb.wentWell && <p className="text-xs text-[#7A7A7A] mt-1">What went well: {overallFb.wentWell}</p>}{overallFb.needsImprovement && <p className="text-xs text-[#7A7A7A]">Improvements: {overallFb.needsImprovement}</p>}</div>}
                    </Section>
                )}

                <Section title="Financial Summary">
                    <div className="p-4 bg-[#1A1A2E] text-white rounded-lg">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                            <div><p className="text-[10px] text-gray-400 uppercase">Procurement</p><p className="text-base sm:text-lg font-bold text-[#E8B86D]">{formatCurrency(totalProcCost)}</p></div>
                            <div><p className="text-[10px] text-gray-400 uppercase">Labor</p><p className="text-base sm:text-lg font-bold text-[#E8B86D]">{formatCurrency(totalLabor)}</p></div>
                            <div><p className="text-[10px] text-gray-400 uppercase">Total Cost</p><p className="text-base sm:text-lg font-bold">{formatCurrency(totalEventCost)}</p></div>
                            <div><p className="text-[10px] text-gray-400 uppercase">Variance</p>
                                <p className={`text-sm sm:text-base font-bold ${(event.estimatedBudget - totalEventCost) >= 0 ? 'text-[#4CAF50]' : 'text-[#E53935]'}`}>
                                    {formatCurrency(Math.abs(event.estimatedBudget - totalEventCost))} {(event.estimatedBudget - totalEventCost) >= 0 ? 'under' : 'over'}
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>
            </div>

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
