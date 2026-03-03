import { generateId, KEYS, saveData, getData } from './storage';

export async function seedIfNeeded() {
    const eventsCheck = await getData(KEYS.EVENTS);
    if (eventsCheck.length > 0) return; // DB is already seeded!

    const ev1Id = 'evt_completed_1';
    const ev2Id = 'evt_upcoming_1';

    const events = [
        {
            id: ev1Id,
            name: 'Sharma-Patel Wedding Reception',
            clientName: 'Raj Sharma',
            clientContact: '+91 98765 43210',
            date: '2026-02-14',
            time: '18:00',
            venue: 'Grand Orchid Banquet Hall, Mumbai',
            estimatedGuests: 350,
            confirmedGuests: 320,
            eventType: 'Wedding',
            menuType: 'Both',
            specialNotes: 'Client prefers Rajasthani thali as main course. Live chaat counter required.',
            status: 'Completed',
            estimatedBudget: 450000,
            actualBudget: 430000,
        },
        {
            id: ev2Id,
            name: 'TechNova Annual Gala Dinner',
            clientName: 'Priya Mehta',
            clientContact: '+91 91234 56789',
            date: '2026-03-20',
            time: '19:30',
            venue: 'The Ritz Ballroom, Bangalore',
            estimatedGuests: 200,
            confirmedGuests: 180,
            eventType: 'Corporate',
            menuType: 'Both',
            specialNotes: 'Formal sit-down dinner. Requires premium bar setup. 3 vegan options mandatory.',
            status: 'Upcoming',
            estimatedBudget: 350000,
            actualBudget: 0,
        },
    ];

    const inventory = [
        { id: 'inv_1', name: 'Basmati Rice', category: 'Grains', unit: 'kg', currentStock: 120, reorderLevel: 30, costPerUnit: 85, supplier: 'Agro Fresh Traders', lastUpdated: '2026-02-28' },
        { id: 'inv_2', name: 'Paneer', category: 'Dairy', unit: 'kg', currentStock: 15, reorderLevel: 20, costPerUnit: 320, supplier: 'Anand Dairy', lastUpdated: '2026-02-28' },
        { id: 'inv_3', name: 'Chicken Breast', category: 'Meat', unit: 'kg', currentStock: 40, reorderLevel: 15, costPerUnit: 280, supplier: 'Supreme Meats', lastUpdated: '2026-02-27' },
        { id: 'inv_4', name: 'Onions', category: 'Produce', unit: 'kg', currentStock: 80, reorderLevel: 25, costPerUnit: 30, supplier: 'Green Valley Farms', lastUpdated: '2026-02-28' },
        { id: 'inv_5', name: 'Cooking Oil (Sunflower)', category: 'Oils', unit: 'L', currentStock: 50, reorderLevel: 15, costPerUnit: 140, supplier: 'Fortune Distributor', lastUpdated: '2026-02-26' },
    ];

    const workers = [
        { id: 'wrk_1', name: 'Chef Ramesh Kumar', role: 'Chef', contact: '+91 99887 12345', dailyRate: 2500 },
        { id: 'wrk_2', name: 'Sunil Yadav', role: 'Helper', contact: '+91 88776 54321', dailyRate: 800 },
        { id: 'wrk_3', name: 'Anjali Deshmukh', role: 'Server', contact: '+91 77665 43210', dailyRate: 1000 },
    ];

    const rec1Id = 'rec_1';
    const recipes = [
        {
            id: rec1Id,
            name: 'Butter Chicken',
            category: 'Main',
            eventId: ev1Id,
            isTemplate: true,
            headCount: 300,
            ingredients: [
                { name: 'Chicken Breast', unit: 'kg', quantity: 25 },
                { name: 'Butter', unit: 'kg', quantity: 5 },
                { name: 'Tomatoes', unit: 'kg', quantity: 15 },
                { name: 'Cream', unit: 'L', quantity: 8 },
                { name: 'Spices Mix', unit: 'kg', quantity: 2 },
                { name: 'Cooking Oil', unit: 'L', quantity: 3 },
            ],
            totalYield: 60,
            portionSize: '180g',
            leftoverWeight: 2.5,
            leftoverPercent: 4.2,
            notes: 'Marinate chicken overnight. Cook on slow flame for best results. Use Kashmiri chilli for color.',
        },
        {
            id: 'rec_2',
            name: 'Paneer Tikka',
            category: 'Starter',
            eventId: ev1Id,
            isTemplate: false,
            headCount: 320,
            ingredients: [
                { name: 'Paneer', unit: 'kg', quantity: 15 },
                { name: 'Bell Peppers', unit: 'kg', quantity: 5 },
                { name: 'Yogurt', unit: 'L', quantity: 4 },
                { name: 'Spices Mix', unit: 'kg', quantity: 1.5 },
            ],
            totalYield: 35,
            portionSize: '100g',
            leftoverWeight: 1,
            leftoverPercent: 2.9,
            notes: 'Cut paneer into 1-inch cubes. Marinate for at least 2 hours.',
        },
        {
            id: 'rec_3',
            name: 'Gulab Jamun',
            category: 'Dessert',
            eventId: ev1Id,
            isTemplate: false,
            headCount: 350,
            ingredients: [
                { name: 'Khoya', unit: 'kg', quantity: 10 },
                { name: 'Sugar', unit: 'kg', quantity: 15 },
                { name: 'Ghee', unit: 'L', quantity: 5 },
            ],
            totalYield: 30,
            portionSize: '2 pcs',
            leftoverWeight: 5,
            leftoverPercent: 16.7,
            notes: 'Deep fry on low heat until dark brown. Soak in warm sugar syrup for 30 minutes.',
        },
    ];

    const procurement = [
        {
            id: 'proc_1', eventId: ev1Id, vendorName: 'Supreme Meats', vendorContact: '+91 98001 11111',
            itemName: 'Chicken Breast', quantity: 25, unit: 'kg', unitPrice: 280, totalCost: 7000,
            purchaseDate: '2026-02-12', receivedDate: '2026-02-13', paymentStatus: 'Paid',
            invoiceNumber: 'SM-2026-451', notes: 'Farm fresh delivery', category: 'Meat',
        },
        {
            id: 'proc_2', eventId: ev1Id, vendorName: 'Anand Dairy', vendorContact: '+91 98002 22222',
            itemName: 'Paneer', quantity: 15, unit: 'kg', unitPrice: 320, totalCost: 4800,
            purchaseDate: '2026-02-13', receivedDate: '2026-02-13', paymentStatus: 'Paid',
            invoiceNumber: 'AD-2026-112', notes: 'Fresh paneer blocks', category: 'Dairy',
        },
        {
            id: 'proc_3', eventId: ev1Id, vendorName: 'Green Valley Farms', vendorContact: '+91 98003 33333',
            itemName: 'Vegetables Assorted', quantity: 50, unit: 'kg', unitPrice: 60, totalCost: 3000,
            purchaseDate: '2026-02-12', receivedDate: '2026-02-12', paymentStatus: 'Paid',
            invoiceNumber: 'GVF-2026-78', notes: 'Mixed vegetables for various dishes', category: 'Produce',
        },
    ];

    const attendance = [
        { id: 'att_1', eventId: ev1Id, workerId: 'wrk_1', workerName: 'Chef Ramesh Kumar', role: 'Chef', status: 'Present', checkIn: '06:00', checkOut: '23:00', hoursWorked: 17, dailyRate: 2500, remarks: 'Led kitchen operations' },
        { id: 'att_2', eventId: ev1Id, workerId: 'wrk_2', workerName: 'Sunil Yadav', role: 'Helper', status: 'Present', checkIn: '08:00', checkOut: '23:00', hoursWorked: 15, dailyRate: 800, remarks: '' },
        { id: 'att_3', eventId: ev1Id, workerId: 'wrk_3', workerName: 'Anjali Deshmukh', role: 'Server', status: 'Present', checkIn: '16:00', checkOut: '23:30', hoursWorked: 7.5, dailyRate: 1000, remarks: 'Managed VIP table service' },
    ];

    const mom = [
        {
            id: 'mom_1', eventId: ev1Id, type: 'Pre',
            meetingDate: '2026-02-10', meetingTime: '10:00', location: 'CaterPro Office',
            attendees: ['Chef Ramesh Kumar', 'Raj Sharma', 'Event Coordinator Priya'],
            agendaItems: [
                { point: 'Menu Finalization', discussion: 'Client confirmed 3 starters, 4 mains, 2 desserts', decision: 'Approved Rajasthani thali as hero dish', owner: 'Chef Ramesh', deadline: '2026-02-11' },
                { point: 'Vendor Coordination', discussion: 'Need to secure chicken and paneer orders early', decision: 'Place orders by Feb 12', owner: 'Sunil Yadav', deadline: '2026-02-12' },
                { point: 'Staffing Plan', discussion: 'Need 3 chefs, 5 helpers, 8 servers', decision: 'Confirm all by Feb 12', owner: 'Event Coordinator', deadline: '2026-02-12' },
            ],
            actionItems: [
                { task: 'Finalize ingredient quantities', assignedTo: 'Chef Ramesh Kumar', dueDate: '2026-02-11', status: 'Done' },
                { task: 'Book transport for equipment', assignedTo: 'Sunil Yadav', dueDate: '2026-02-13', status: 'Done' },
                { task: 'Send final guest count confirmation to venue', assignedTo: 'Event Coordinator', dueDate: '2026-02-12', status: 'Done' },
            ],
            notes: 'Client specifically mentioned no peanuts - allergy concern for 2 guests. Setup time is 3 PM.',
            nextMeetingDate: '2026-02-15',
        },
    ];

    const feedback = [
        {
            id: 'fb_1', eventId: ev1Id, dishId: 'rec_1', dishName: 'Butter Chicken',
            overallRating: 5, tasteRating: 5, presentationRating: 4,
            quantityAdequate: 'Yes', clientFeedback: 'Absolutely delicious! Guests loved it.',
            internalNotes: 'Recipe is now perfected.', suggestedImprovements: 'Slightly more garnish next time.',
            serveAgain: 'Yes',
        },
        {
            id: 'fb_2', eventId: ev1Id, dishId: 'rec_2', dishName: 'Paneer Tikka',
            overallRating: 4, tasteRating: 4, presentationRating: 5,
            quantityAdequate: 'Yes', clientFeedback: 'Great presentation and flavor.',
            internalNotes: 'Use more tandoori masala next time.', suggestedImprovements: 'Try adding pineapple chunks.',
            serveAgain: 'Yes',
        },
        {
            id: 'fb_3', eventId: ev1Id, dishId: 'rec_3', dishName: 'Gulab Jamun',
            overallRating: 3, tasteRating: 4, presentationRating: 3,
            quantityAdequate: 'Excess', clientFeedback: 'Good taste but too many leftovers.',
            internalNotes: 'Reduce quantity by 20% next time.', suggestedImprovements: 'Serve warm with ice cream option.',
            serveAgain: 'Modified',
        },
        {
            id: 'fb_overall_1', eventId: ev1Id, type: 'overall',
            clientSatisfaction: 9, wentWell: 'Food quality was exceptional. Service was prompt and professional.',
            needsImprovement: 'Dessert quantity was over-estimated. Consider live stations for variety.',
            issues: 'Minor delay in dessert service due to kitchen congestion.',
            overallRating: 4,
        },
    ];

    await saveData(KEYS.EVENTS, events);
    await saveData(KEYS.INVENTORY, inventory);
    await saveData(KEYS.WORKERS, workers);
    await saveData(KEYS.RECIPES, recipes);
    await saveData(KEYS.PROCUREMENT, procurement);
    await saveData(KEYS.ATTENDANCE, attendance);
    await saveData(KEYS.MOM, mom);
    await saveData(KEYS.FEEDBACK, feedback);
    localStorage.setItem(KEYS.SEEDED, 'true');
}
