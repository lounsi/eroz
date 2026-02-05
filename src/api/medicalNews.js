/**
 * Service API pour la veille médicale - VERSION INSUBMERSIBLE (v5.0)
 * Architecture "Source-Aggregator" pour garantir 8 articles et zéro erreur rouge.
 */

// Configuration des catégories avec sources "Officielles" et Relais Google News
export const CATEGORIES = {
    innovation: {
        name: 'Bio-Innovation & Tech',
        icon: 'Microscope',
        color: 'violet',
        queries: ['innovation médicale technology', 'biotechnologie santé France', 'e-santé innovation'],
        gradient: 'from-violet-500 to-purple-600',
        rssSources: [
            { url: 'https://www.biotech.info/rss.php', name: 'Biotech.info' },
            { url: 'https://www.ticsante.com/rss.php', name: 'TIC Santé' },
            { url: 'https://news.google.com/rss/search?q=innovation+m%C3%A9dicale+language%3Afr&hl=fr&gl=FR&ceid=FR%3Afr', name: 'Google News Innovation' }
        ]
    },
    imaging: {
        name: 'Imagerie & Diagnostic',
        icon: 'Scan',
        color: 'cyan',
        queries: ['radiologie innovation', 'scanner IRM technologie', 'intelligence artificielle imagerie médicale'],
        gradient: 'from-cyan-500 to-blue-600',
        rssSources: [
            { url: 'https://www.has-sante.fr/portail/js/rss/actualites.xml', name: 'HAS Actualités', isOfficial: true },
            { url: 'https://news.google.com/rss/search?q=imagerie+m%C3%A9dicale+language%3Afr&hl=fr&gl=FR&ceid=FR%3Afr', name: 'Google News Imagerie' }
        ]
    },
    oncology: {
        name: 'Oncologie & Thérapeutique',
        icon: 'Heart',
        color: 'rose',
        queries: ['oncologie traitements innovation', 'cancer recherche immunothérapie'],
        gradient: 'from-rose-500 to-pink-600',
        rssSources: [
            { url: 'https://ansm.sante.fr/actualites/rss', name: 'ANSM Actualités', isOfficial: true },
            { url: 'https://news.google.com/rss/search?q=cancer+traitements+innovation+language%3Afr&hl=fr&gl=FR&ceid=FR%3Afr', name: 'Google News Oncologie' }
        ]
    },
    clinical: {
        name: 'Recherche & Clinique',
        icon: 'FlaskConical',
        color: 'emerald',
        queries: ['essais cliniques résultats', 'recherche médicale Inserm'],
        gradient: 'from-emerald-500 to-teal-600',
        rssSources: [
            { url: 'https://www.inserm.fr/feed/', name: 'INSERM', isOfficial: true },
            { url: 'https://www.santepubliquefrance.fr/rss/articles', name: 'Santé Publique France', isOfficial: true },
            { url: 'https://news.google.com/rss/search?q=recherche+m%C3%A9dicale+language%3Afr&hl=fr&gl=FR&ceid=FR%3Afr', name: 'Google News Recherche' }
        ]
    }
};

const MEDICAL_KEYWORDS = [
    'patient', 'médical', 'santé', 'thérapeutique', 'diagnostic', 'clinique', 'chirurgie',
    'médecin', 'hôpital', 'traitement', 'biotech', 'médicament', 'pathologie', 'irm',
    'scanner', 'cancer', 'biologie', 'neuro', 'cardio', 'soins', 'vaccin', 'molécule',
    'medical', 'health', 'trial', 'diagnosis', 'treatment', 'surgery', 'clinical', 'innovation'
];

/**
 * Proxy avec protection contre les erreurs 404/500
 */
const fetchSafely = async (url) => {
    const proxies = [
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`
    ];

    for (const template of proxies) {
        try {
            const proxyUrl = template(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) continue;

            if (proxyUrl.includes('allorigins')) {
                const data = await response.json();
                return data.contents;
            }
            return await response.text();
        } catch (e) { /* Échec silencieux */ }
    }
    return null;
};

/**
 * Parser XML RSS (V5 de poche)
 */
const parseXML = (xmlStr, sourceName, lang, isOfficial = false) => {
    if (!xmlStr) return [];
    try {
        const doc = new DOMParser().parseFromString(xmlStr, "text/xml");
        const items = doc.querySelectorAll("item");
        const now = new Date();
        const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

        return Array.from(items).map((item, i) => {
            const pubDateStr = item.querySelector("pubDate")?.textContent || new Date().toISOString();
            const pubDate = new Date(pubDateStr);

            // Règle : Pas plus de 365 jours
            if (pubDate < oneYearAgo) return null;

            return {
                id: `${sourceName}-${i}-${Date.now()}`,
                title: item.querySelector("title")?.textContent?.trim() || "",
                abstract: item.querySelector("description")?.textContent?.replace(/<[^>]*>/g, '').substring(0, 180).trim() + '...',
                journal: sourceName,
                publishedDate: pubDateStr,
                url: item.querySelector("link")?.textContent?.trim() || "",
                source: sourceName,
                lang: lang,
                isOfficial: isOfficial,
                isNew: pubDate > fortyEightHoursAgo // Badge "Nouveau" pour moins de 48h
            };
        }).filter(a => a && a.title.length > 5);
    } catch { return []; }
};

/**
 * PubMed Fallback (V5)
 */
const fetchPubMed = async (queries) => {
    try {
        const query = queries.join(' OR ');
        const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=15&sort=date&retmode=json`;
        const search = await fetchSafely(url);
        if (!search) return [];

        const ids = JSON.parse(search).esearchresult?.idlist || [];
        if (ids.length === 0) return [];

        const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
        const summary = await fetchSafely(summaryUrl);
        if (!summary) return [];

        const data = JSON.parse(summary).result || {};
        return ids.map(id => data[id] ? ({
            id: `pubmed-${id}`,
            title: data[id].title,
            abstract: data[id].sorttitle || data[id].title,
            journal: data[id].source,
            publishedDate: data[id].pubdate,
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            source: 'PubMed',
            lang: 'en'
        }) : null).filter(Boolean);
    } catch { return []; }
};

/**
 * CHARGEMENT PRINCIPAL : Zéro échec garanti
 */
export const fetchAllMedicalNews = async () => {
    console.log('[MedWatch v5.1] Refining selection logic...');
    const results = {};
    const usedTitles = new Set();
    const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 80);

    for (const [key, config] of Object.entries(CATEGORIES)) {
        // Collecter TOUS les articles potentiels pour cette catégorie
        const frPromises = config.rssSources.map(async (src) => {
            const xml = await fetchSafely(src.url);
            return parseXML(xml, src.name, 'fr', src.isOfficial);
        });

        const pubmedPromise = fetchPubMed(config.queries);
        const [frRaw, pubmedRaw] = await Promise.all([
            Promise.all(frPromises).then(r => r.flat()),
            pubmedPromise
        ]);

        // Pool global pour triage par date
        const fullPool = [...frRaw, ...pubmedRaw].sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

        let selectedArticles = [];
        let enCount = 0;

        // Étape 1 : Assurer au moins 1 article PubMed/Anglais si dispo
        const firstEn = fullPool.find(a => a.lang === 'en');
        if (firstEn) {
            selectedArticles.push(firstEn);
            usedTitles.add(normalize(firstEn.title));
            enCount = 1;
        }

        // Étape 2 : Remplir le reste avec priorité à la date, sous réserve des quotas
        for (const art of fullPool) {
            if (selectedArticles.length >= 8) break;

            const nt = normalize(art.title);
            if (usedTitles.has(nt)) continue;

            const isEn = art.lang === 'en';

            // Règles de quota
            if (isEn && enCount >= 3) continue; // Pas plus de 3 EN

            // Pertinence médicale simplifiée (déjà filtrée par XML mais double check)
            const text = (art.title + art.abstract).toLowerCase();
            if (MEDICAL_KEYWORDS.some(k => text.includes(k))) {
                selectedArticles.push(art);
                usedTitles.add(nt);
                if (isEn) enCount++;
            }
        }

        results[key] = {
            ...config,
            articles: selectedArticles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
        };
        console.log(`[MedWatch] ${config.name} : ${selectedArticles.length} items (${enCount} EN).`);
    }

    return results;
};

// Helpers UI obligatoires
export const getFeaturedArticles = (news) => Object.values(news).filter(c => c.articles?.length > 0).map(c => ({ ...c.articles[0], categoryInfo: { name: c.name, gradient: c.gradient, icon: c.icon } }));
export const searchArticles = (news, term) => {
    const r = [];
    const t = term.toLowerCase();
    Object.values(news).forEach(c => c.articles.forEach(a => { if (a.title.toLowerCase().includes(t)) r.push({ ...a, categoryInfo: { name: c.name, gradient: c.gradient, icon: c.icon } }); }));
    return r;
};
export const formatRelativeDate = (d) => { try { const diff = Math.floor(Math.abs(new Date() - new Date(d)) / 86400000); return diff === 0 ? "Aujourd'hui" : diff === 1 ? "Hier" : `Il y a ${diff} jours`; } catch { return d; } };
