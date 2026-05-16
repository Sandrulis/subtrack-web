/* =============================================
   SubTrack - demo dati (kopīgi starp paneli un analītiku)
   ============================================= */

var subscriptions = [
    { id: 1, name: 'Netflix', category: 'subscription', amount: 10.99, period: 'monthly', date: '2026-05-15', icon: 'fa-solid fa-film', color: '#e50914', note: 'Ģimenes plāns', devices: [] },
    { id: 2, name: 'Spotify', category: 'subscription', amount: 9.99, period: 'monthly', date: '2026-05-10', icon: 'fa-solid fa-music', color: '#1db954', note: '', devices: [] },
    { id: 3, name: 'Adobe Creative Cloud', category: 'subscription', amount: 14.99, period: 'monthly', date: '2026-06-01', icon: 'fa-solid fa-palette', color: '#ea4c89', note: '', devices: [] },
    { id: 4, name: 'LinkedIn Premium', category: 'subscription', amount: 7.99, period: 'monthly', date: '2026-05-20', icon: 'fa-solid fa-briefcase', color: '#0077b5', note: '', devices: [] },
    { id: 5, name: 'Notion Personal Pro', category: 'subscription', amount: 4.99, period: 'monthly', date: '2026-06-03', icon: 'fa-solid fa-box', color: '#1e1e2e', note: '', devices: [] },
    { id: 6, name: 'Ātrais kredīts', category: 'credit', amount: 89.0, period: 'monthly', date: '2026-05-28', icon: 'fa-solid fa-building-columns', color: '#0d9488', note: 'Swedbank', termStart: '2025-09-01', termEnd: '2028-09-01', devices: [] },
    { id: 7, name: 'Telefona rēķins', category: 'bill', amount: 22, period: 'monthly', date: '2026-05-18', icon: 'fa-solid fa-mobile-screen-button', color: '#3b82f6', note: 'Ģimenes plāns',
        devices: [
            { id: 1, name: 'Viedpulkstenis', note: 'Mans', amount: 5, termStart: '2025-06-01', termEnd: '2027-06-01' },
            { id: 2, name: 'Modēms', note: 'Sievas', amount: 3.5, termStart: '2025-01-01', termEnd: '2026-12-01' },
        ],
    },
    { id: 8, name: 'Citi maksājumi', category: 'other', amount: 15.9, period: 'monthly', date: '2026-05-22', icon: 'fa-solid fa-receipt', color: '#64748b', note: 'Apkope, ziedojumi', devices: [] },
];

var nextId = 9;
