"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedIndianFoods = exports.searchExercises = exports.searchFood = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const https_2 = require("firebase-functions/v2/https");
const node_fetch_1 = __importDefault(require("node-fetch"));
admin.initializeApp();
const db = admin.firestore();
// ── Helpers ───────────────────────────────────────────────────────────────────
const USDA_KEY = process.env.USDA_API_KEY ?? '';
const EXERCISEDB_KEY = process.env.EXERCISEDB_API_KEY ?? '';
function normalizeStr(s) {
    return s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}
// ── FUNCTION 1: searchFood ────────────────────────────────────────────────────
// Flow: Firestore cache → Indian DB → USDA → Open Food Facts → fallback
exports.searchFood = (0, https_1.onCall)({ cors: true, secrets: ['USDA_API_KEY'] }, async (req) => {
    const query = (req.data?.query ?? '').trim();
    if (!query || query.length < 2) {
        return { foods: [], source: 'empty' };
    }
    const qLower = query.toLowerCase();
    const results = [];
    // 1️⃣ Check Firestore cache first
    try {
        const snap = await db.collection('foodCache')
            .where('searchTerms', 'array-contains', qLower)
            .limit(15)
            .get();
        if (!snap.empty) {
            snap.docs.forEach(d => results.push(d.data()));
            if (results.length >= 5)
                return { foods: results, source: 'cache' };
        }
    }
    catch { /* continue to API */ }
    // 2️⃣ Search Indian food DB in Firestore
    try {
        const indianSnap = await db.collection('indianFoods')
            .where('searchTerms', 'array-contains', qLower)
            .limit(8)
            .get();
        indianSnap.docs.forEach(d => {
            const data = d.data();
            if (!results.find(r => r.fdcId === data.fdcId))
                results.push(data);
        });
    }
    catch { /* continue */ }
    // 3️⃣ USDA FoodData Central
    if (USDA_KEY) {
        try {
            const url = `https://api.nal.usda.gov/fdc/v1/foods/search` +
                `?api_key=${USDA_KEY}` +
                `&query=${encodeURIComponent(query)}` +
                `&dataType=Foundation,SR%20Legacy,Branded` +
                `&pageSize=15`;
            const res = await (0, node_fetch_1.default)(url);
            if (res.ok) {
                const data = await res.json();
                const foods = (data.foods ?? []).map(parseUSDA).filter(f => f.calories > 0);
                for (const food of foods.slice(0, 10)) {
                    if (!results.find(r => r.fdcId === food.fdcId)) {
                        results.push({ ...food, source: 'usda', cachedAt: Date.now() });
                        // Cache it
                        const terms = buildSearchTerms(food.name);
                        await db.collection('foodCache').doc(`usda_${food.fdcId}`).set({
                            ...food, source: 'usda', searchTerms: terms, cachedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }).catch(() => { });
                    }
                }
            }
        }
        catch { /* continue */ }
    }
    // 4️⃣ Open Food Facts (for packaged/branded items)
    if (results.length < 8) {
        try {
            const url = `https://world.openfoodfacts.org/cgi/search.pl` +
                `?search_terms=${encodeURIComponent(query)}` +
                `&search_simple=1&action=process&json=1&page_size=10` +
                `&fields=id,product_name,brands,nutriments`;
            const res = await (0, node_fetch_1.default)(url, { headers: { 'User-Agent': 'FitvoryaAI/1.0' } });
            if (res.ok) {
                const data = await res.json();
                for (const p of (data.products ?? []).slice(0, 6)) {
                    const food = parseOFF(p);
                    if (food && !results.find(r => r.fdcId === food.fdcId)) {
                        results.push({ ...food, source: 'openfoodfacts', cachedAt: Date.now() });
                        const terms = buildSearchTerms(food.name);
                        await db.collection('foodCache').doc(`off_${food.fdcId}`).set({
                            ...food, source: 'openfoodfacts', searchTerms: terms, cachedAt: admin.firestore.FieldValue.serverTimestamp(),
                        }).catch(() => { });
                    }
                }
            }
        }
        catch { /* continue */ }
    }
    return { foods: results.slice(0, 20), source: 'api' };
});
// ── FUNCTION 2: searchExercises ───────────────────────────────────────────────
exports.searchExercises = (0, https_1.onCall)({ cors: true, secrets: ['EXERCISEDB_API_KEY'] }, async (req) => {
    const query = (req.data?.query ?? '').trim();
    const bodyPart = (req.data?.bodyPart ?? '').trim();
    // 1️⃣ Check Firestore exercise cache
    try {
        let fsQuery = db.collection('exerciseCache');
        if (bodyPart) {
            fsQuery = fsQuery.where('muscleGroup', '==', bodyPart);
        }
        if (query) {
            fsQuery = fsQuery.where('searchTerms', 'array-contains', query.toLowerCase());
        }
        const snap = await fsQuery.limit(20).get();
        if (!snap.empty) {
            return { exercises: snap.docs.map(d => d.data()), source: 'cache' };
        }
    }
    catch { /* continue */ }
    // 2️⃣ ExerciseDB
    const exercises = [];
    if (EXERCISEDB_KEY) {
        try {
            const endpoint = bodyPart
                ? `https://v2.exercisedb.io/exercises/bodyPart/${encodeURIComponent(bodyPart)}`
                : query
                    ? `https://v2.exercisedb.io/exercises/name/${encodeURIComponent(query)}`
                    : `https://v2.exercisedb.io/exercises`;
            const res = await (0, node_fetch_1.default)(`${endpoint}?limit=20&offset=0`, {
                headers: { 'x-rapidapi-key': EXERCISEDB_KEY, 'x-rapidapi-host': 'v2.exercisedb.io' },
            });
            if (res.ok) {
                const data = await res.json();
                for (const e of (Array.isArray(data) ? data : []).slice(0, 20)) {
                    const ex = parseExerciseDB(e);
                    exercises.push(ex);
                    await db.collection('exerciseCache').doc(ex.id).set({
                        ...ex,
                        searchTerms: buildSearchTerms(ex.name),
                        cachedAt: admin.firestore.FieldValue.serverTimestamp(),
                    }).catch(() => { });
                }
            }
        }
        catch { /* continue */ }
    }
    return { exercises, source: exercises.length ? 'api' : 'empty' };
});
// ── FUNCTION 3: seedIndianFoods ───────────────────────────────────────────────
// HTTP trigger — call once to populate the Indian food DB
exports.seedIndianFoods = (0, https_2.onRequest)({ cors: false }, async (_req, res) => {
    const batch = db.batch();
    for (const food of INDIAN_FOODS) {
        const ref = db.collection('indianFoods').doc(`indian_${normalizeStr(food.name)}`);
        batch.set(ref, {
            ...food,
            source: 'indian',
            searchTerms: buildSearchTerms(food.name),
            cachedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    await batch.commit();
    res.json({ ok: true, count: INDIAN_FOODS.length });
});
function parseUSDA(f) {
    const get = (id) => f.foodNutrients.find(n => n.nutrientId === id)?.value ?? 0;
    return {
        fdcId: String(f.fdcId),
        name: f.description,
        brand: f.brandOwner,
        calories: Math.round(get(1008)),
        protein: Math.round(get(1003) * 10) / 10,
        carbs: Math.round(get(1005) * 10) / 10,
        fat: Math.round(get(1004) * 10) / 10,
        fiber: Math.round(get(1079) * 10) / 10,
    };
}
function parseOFF(p) {
    if (!p.product_name || !p.nutriments)
        return null;
    const n = p.nutriments;
    const cal = n['energy-kcal_100g'] ?? 0;
    if (!cal)
        return null;
    return {
        fdcId: p.id ?? String(Math.random()),
        name: p.product_name,
        brand: p.brands,
        calories: Math.round(cal),
        protein: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
        carbs: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
        fat: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
        fiber: Math.round((n['fiber_100g'] ?? 0) * 10) / 10,
    };
}
const BODYPART_CATEGORY = {
    chest: 'hypertrophy', back: 'strength', shoulders: 'hypertrophy',
    'upper arms': 'hypertrophy', 'lower arms': 'hypertrophy',
    'upper legs': 'strength', 'lower legs': 'hypertrophy',
    waist: 'strength', cardio: 'cardio', neck: 'mobility',
};
function parseExerciseDB(e) {
    return {
        id: e.id,
        name: e.name.charAt(0).toUpperCase() + e.name.slice(1),
        muscleGroup: e.target,
        secondaryMuscles: e.secondaryMuscles ?? [],
        equipment: e.equipment,
        category: BODYPART_CATEGORY[e.bodyPart] ?? 'strength',
        instructions: e.instructions ?? [],
        gifUrl: e.gifUrl,
        source: 'exercisedb',
        cachedAt: Date.now(),
    };
}
// ── Search term builder ───────────────────────────────────────────────────────
function buildSearchTerms(name) {
    const words = name.toLowerCase().split(/[\s,()-]+/).filter(w => w.length > 1);
    const terms = new Set();
    // Add full name lowercase
    terms.add(name.toLowerCase());
    // Add individual words
    words.forEach(w => terms.add(w));
    // Add 2-word combinations
    for (let i = 0; i < words.length - 1; i++) {
        terms.add(`${words[i]} ${words[i + 1]}`);
    }
    return Array.from(terms).slice(0, 20);
}
// ── Indian food database ──────────────────────────────────────────────────────
const INDIAN_FOODS = [
    // South Indian
    { fdcId: 'ind_idli', name: 'Idli (1 piece)', calories: 39, protein: 2, carbs: 8, fat: 0.2, fiber: 0.5 },
    { fdcId: 'ind_dosa', name: 'Plain Dosa', calories: 133, protein: 3.5, carbs: 25, fat: 2.5, fiber: 1 },
    { fdcId: 'ind_masala_dosa', name: 'Masala Dosa', calories: 230, protein: 5, carbs: 40, fat: 6, fiber: 2 },
    { fdcId: 'ind_sambar', name: 'Sambar (1 cup)', calories: 102, protein: 5, carbs: 16, fat: 2, fiber: 4 },
    { fdcId: 'ind_rasam', name: 'Rasam (1 cup)', calories: 45, protein: 2, carbs: 8, fat: 0.5, fiber: 1 },
    { fdcId: 'ind_uttapam', name: 'Uttapam', calories: 180, protein: 5, carbs: 32, fat: 4, fiber: 1.5 },
    { fdcId: 'ind_pongal', name: 'Ven Pongal (1 cup)', calories: 220, protein: 6, carbs: 38, fat: 6, fiber: 2 },
    { fdcId: 'ind_curd_rice', name: 'Curd Rice (1 cup)', calories: 198, protein: 5, carbs: 35, fat: 4, fiber: 0.5 },
    { fdcId: 'ind_lemon_rice', name: 'Lemon Rice (1 cup)', calories: 210, protein: 4, carbs: 40, fat: 4, fiber: 1 },
    { fdcId: 'ind_tomato_rice', name: 'Tomato Rice (1 cup)', calories: 215, protein: 4, carbs: 42, fat: 4, fiber: 2 },
    { fdcId: 'ind_vada', name: 'Medu Vada (1 piece)', calories: 97, protein: 4, carbs: 12, fat: 4, fiber: 1 },
    { fdcId: 'ind_coconut_chutney', name: 'Coconut Chutney (2 tbsp)', calories: 55, protein: 1, carbs: 3, fat: 4.5, fiber: 1 },
    // Rice
    { fdcId: 'ind_white_rice', name: 'White Rice cooked (1 cup)', calories: 206, protein: 4.2, carbs: 44.5, fat: 0.4, fiber: 0.6 },
    { fdcId: 'ind_brown_rice', name: 'Brown Rice cooked (1 cup)', calories: 216, protein: 5, carbs: 44, fat: 1.8, fiber: 3.5 },
    { fdcId: 'ind_kambu', name: 'Kambu Koozh (Pearl Millet Porridge)', calories: 115, protein: 3, carbs: 23, fat: 1, fiber: 2.5 },
    { fdcId: 'ind_ragi', name: 'Ragi Kali (Finger Millet)', calories: 120, protein: 3, carbs: 25, fat: 0.5, fiber: 3 },
    // Bread
    { fdcId: 'ind_chapati', name: 'Chapati / Roti (1 piece)', calories: 71, protein: 2.5, carbs: 13, fat: 1.5, fiber: 1 },
    { fdcId: 'ind_paratha', name: 'Plain Paratha (1 piece)', calories: 130, protein: 3, carbs: 20, fat: 5, fiber: 1 },
    { fdcId: 'ind_aloo_paratha', name: 'Aloo Paratha (1 piece)', calories: 200, protein: 4, carbs: 30, fat: 7, fiber: 2 },
    { fdcId: 'ind_naan', name: 'Naan (1 piece)', calories: 262, protein: 9, carbs: 45, fat: 5, fiber: 2 },
    { fdcId: 'ind_puri', name: 'Puri (1 piece)', calories: 80, protein: 2, carbs: 10, fat: 4, fiber: 0.5 },
    // Dal & Legumes
    { fdcId: 'ind_dal_tadka', name: 'Dal Tadka (1 cup)', calories: 180, protein: 10, carbs: 26, fat: 5, fiber: 7 },
    { fdcId: 'ind_chana_masala', name: 'Chana Masala (1 cup)', calories: 270, protein: 14, carbs: 40, fat: 7, fiber: 10 },
    { fdcId: 'ind_rajma', name: 'Rajma (1 cup)', calories: 260, protein: 14, carbs: 42, fat: 4, fiber: 11 },
    { fdcId: 'ind_moong_dal', name: 'Moong Dal (1 cup)', calories: 150, protein: 10, carbs: 24, fat: 1, fiber: 6 },
    { fdcId: 'ind_masoor_dal', name: 'Masoor Dal (1 cup)', calories: 140, protein: 9, carbs: 22, fat: 0.5, fiber: 5 },
    // Vegetables
    { fdcId: 'ind_palak_paneer', name: 'Palak Paneer (1 cup)', calories: 280, protein: 14, carbs: 12, fat: 20, fiber: 3 },
    { fdcId: 'ind_paneer_bhurji', name: 'Paneer Bhurji (100g)', calories: 265, protein: 18, carbs: 6, fat: 19, fiber: 1 },
    { fdcId: 'ind_aloo_gobi', name: 'Aloo Gobi (1 cup)', calories: 145, protein: 4, carbs: 22, fat: 5, fiber: 4 },
    { fdcId: 'ind_baingan', name: 'Baingan Bharta (1 cup)', calories: 120, protein: 3, carbs: 15, fat: 6, fiber: 5 },
    // Non-Veg
    { fdcId: 'ind_chicken_curry', name: 'Chicken Curry (1 cup)', calories: 290, protein: 28, carbs: 8, fat: 16, fiber: 1 },
    { fdcId: 'ind_butter_chicken', name: 'Butter Chicken (1 cup)', calories: 320, protein: 26, carbs: 12, fat: 18, fiber: 1 },
    { fdcId: 'ind_mutton_curry', name: 'Mutton Curry (1 cup)', calories: 340, protein: 28, carbs: 5, fat: 22, fiber: 0.5 },
    { fdcId: 'ind_egg_curry', name: 'Egg Curry (2 eggs)', calories: 215, protein: 14, carbs: 8, fat: 14, fiber: 1 },
    { fdcId: 'ind_fish_curry', name: 'Fish Curry (1 cup)', calories: 220, protein: 24, carbs: 6, fat: 11, fiber: 1 },
    { fdcId: 'ind_boiled_egg', name: 'Boiled Egg (1 whole)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, fiber: 0 },
    // Snacks
    { fdcId: 'ind_banana', name: 'Banana (1 medium)', calories: 96, protein: 1.2, carbs: 25, fat: 0.3, fiber: 2.6 },
    { fdcId: 'ind_apple', name: 'Apple (1 medium)', calories: 72, protein: 0.4, carbs: 19, fat: 0.2, fiber: 2.4 },
    { fdcId: 'ind_mango', name: 'Mango (1 cup cubed)', calories: 99, protein: 1.4, carbs: 24, fat: 0.6, fiber: 2.6 },
    { fdcId: 'ind_curd', name: 'Curd / Plain Yogurt (100g)', calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0 },
    { fdcId: 'ind_lassi', name: 'Sweet Lassi (1 glass)', calories: 180, protein: 5, carbs: 32, fat: 3.5, fiber: 0 },
    { fdcId: 'ind_chai', name: 'Masala Chai with Milk (1 cup)', calories: 80, protein: 2.5, carbs: 12, fat: 2, fiber: 0 },
    // Millets
    { fdcId: 'ind_varagu', name: 'Varagu (Kodo Millet) cooked', calories: 110, protein: 2.9, carbs: 22, fat: 0.9, fiber: 2 },
    { fdcId: 'ind_kuthiraivali', name: 'Kuthiraivali (Barnyard Millet)', calories: 105, protein: 3.5, carbs: 20, fat: 0.8, fiber: 3 },
    { fdcId: 'ind_kavuni', name: 'Kavuni Arisi (Black Rice) cooked', calories: 130, protein: 3, carbs: 28, fat: 0.5, fiber: 2.5 },
    { fdcId: 'ind_samai', name: 'Samai (Little Millet) cooked', calories: 107, protein: 3.3, carbs: 21, fat: 0.7, fiber: 2.5 },
    // Proteins
    { fdcId: 'ind_paneer', name: 'Paneer (100g)', calories: 265, protein: 18, carbs: 3, fat: 20, fiber: 0 },
    { fdcId: 'ind_milk', name: 'Full Cream Milk (1 cup)', calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0 },
    { fdcId: 'ind_whey', name: 'Whey Protein Powder (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 },
    { fdcId: 'ind_peanuts', name: 'Roasted Peanuts (30g)', calories: 170, protein: 7.5, carbs: 5, fat: 14, fiber: 2 },
    { fdcId: 'ind_almonds', name: 'Almonds (10 pieces)', calories: 70, protein: 2.6, carbs: 2.5, fat: 6, fiber: 1.2 },
];
//# sourceMappingURL=index.js.map