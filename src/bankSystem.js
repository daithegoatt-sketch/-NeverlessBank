'use strict';

const crypto = require('node:crypto');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const {
  USER_PREFIX,
  MARKET_PREFIX,
  COMMAND_CD,
  SALARY_CD,
  TIP_CD,
  MARKET_STEP,
  LOAN_CD,
  LOAN_AMOUNT,
  MAX_BET,
  PROTECTION_DURATION,
  clamp,
  newUser,
  packUser,
  unpackUser,
  newMarket,
  packMarket,
  unpackMarket,
  enc,
  parseRecord,
  digits,
  parseAmount,
  parseShares,
  parseShareAmount,
  money,
  commandCooldownLeft,
  setCommandCooldown,
  formatDuration,
  cooldownStatus,
} = require('./bankUtils');
const {
  balanceCard,
  rewardCard,
  vaultCard,
  transferCard,
  marketCard,
  stockTradeCard,
  topCard,
  infoCard,
  economyEventCard,
  usageCard,
  propertiesCard,
  assetCatalogCard,
  goldMarketCard,
  assetTradeCard,
} = require('./bankVisualCore');
const {
  investmentCard,
  betCard,
  diceCard,
  gambleCard,
  tradeGameCard,
  rouletteCard,
  hiloCard,
  boxesCard,
  minesCard,
  fruitGameCard,
  colorsCard,
  coinCard,
  numberGuessCard,
} = require('./bankVisualGames');
const { catalogCard, businessCard, projectsSummaryCard, inventoryCard, storeCard, incomeCard, npcStoreCard } = require('./businessVisuals');

const BANK_CHANNEL_ID = '1548665575247581184';
const BANK_TEST_CHANNEL_ID = '1548665662556217384';
const BANK_EXTRA_CHANNEL_ID = '1548983198120419418';
const BANK_CHANNELS = new Set([BANK_CHANNEL_ID, BANK_TEST_CHANNEL_ID, BANK_EXTRA_CHANNEL_ID]);
const DATA_CHANNEL_NAME = 'neverless-data';
const ADMIN_PERMISSION = 'Administrator';
const ASSET_MARKET_STEP = 60 * 60 * 1000;
const GOLD_MARKET_STEP = 15 * 60 * 1000;
const STOCK_COMPANIES = Object.freeze({
  NVRS: { code: 'NVRS', name: 'Neverless Tech', aliases: ['neverless','nvrs','نفرلس','نيفرلس'] },
  ASTRA: { code: 'ASTRA', name: 'Astra Labs', aliases: ['astra','استرا','أسترا'] },
  ARCANE: { code: 'ARCANE', name: 'Arcane Media', aliases: ['arcane','اركين','أركين'] },
  SALV: { code: 'SALV', name: 'Salvation Energy', aliases: ['salvation','سلفيشن','سالفاشن'] },
  VIRO: { code: 'VIRO', name: 'Viro Systems', aliases: ['viro','فايرو','فيرو'] },
});
const ASSET_CATALOG = Object.freeze({
  HOUSE: { code:'HOUSE', category:'PROPERTY', name:'بيت', aliases:['بيت'], seed:75000, fractional:false },
  APARTMENT: { code:'APARTMENT', category:'PROPERTY', name:'شقة', aliases:['شقة','شقه'], seed:125000, fractional:false },
  VILLA: { code:'VILLA', category:'PROPERTY', name:'فيلا', aliases:['فيلا','فلة','فله'], seed:350000, fractional:false },
  PALACE: { code:'PALACE', category:'PROPERTY', name:'قصر', aliases:['قصر'], seed:1000000, fractional:false },
  SEDAN: { code:'SEDAN', category:'CAR', name:'سيدان', aliases:['سيدان','سيارة عادية','سياره عاديه'], seed:30000, fractional:false },
  SUV: { code:'SUV', category:'CAR', name:'SUV', aliases:['suv','جيب','دفع رباعي'], seed:70000, fractional:false },
  SPORT: { code:'SPORT', category:'CAR', name:'سيارة رياضية', aliases:['سيارة رياضية','سياره رياضيه','رياضية','رياضيه'], seed:120000, fractional:false },
  LUXURY: { code:'LUXURY', category:'CAR', name:'سيارة فخمة', aliases:['سيارة فخمة','سياره فخمه','فخمة','فخمه'], seed:250000, fractional:false },
  HELI: { code:'HELI', category:'PLANE', name:'هليكوبتر', aliases:['هليكوبتر','هيلكوبتر'], seed:450000, fractional:false },
  JET: { code:'JET', category:'PLANE', name:'طائرة خاصة', aliases:['طائرة خاصة','طيارة خاصة','طياره خاصه','طائره خاصه','خاصة','خاصه'], seed:900000, fractional:false },
  BIZJET: { code:'BIZJET', category:'PLANE', name:'طائرة رجال أعمال', aliases:['طائرة رجال أعمال','طيارة رجال اعمال','طائره رجال اعمال','رجال أعمال','رجال اعمال'], seed:1800000, fractional:false },
  GOLD: { code:'GOLD', category:'GOLD', name:'ذهب', aliases:['ذهب','gold'], seed:2500, fractional:true },
});



const PRODUCT_CATALOG = Object.freeze({
 EGG:{code:'EGG',name:'بيض'}, WHEAT:{code:'WHEAT',name:'قمح'}, FLOUR:{code:'FLOUR',name:'دقيق'}, BREAD:{code:'BREAD',name:'خبز'},
 MILK:{code:'MILK',name:'حليب'}, FEED:{code:'FEED',name:'علف'}, IRON:{code:'IRON',name:'حديد'}, PARTS:{code:'PARTS',name:'قطع صناعية'},
 FUEL:{code:'FUEL',name:'وقود'}, JEWEL:{code:'JEWEL',name:'مجوهرات'}, MEAL:{code:'MEAL',name:'وجبة'}, BATTERY:{code:'BATTERY',name:'بطارية'}
});
const PROJECT_CATALOG = Object.freeze({
 POULTRY:{code:'POULTRY',name:'مزرعة دواجن',aliases:['دواجن','بيض','مزرعة دواجن'],cost:50000,output:'EGG',outputName:'بيض',outputQty:20,duration:30*60*1000,inputs:{FEED:4},inputsText:'4 علف → 20 بيض'},
 WHEATFARM:{code:'WHEATFARM',name:'مزرعة قمح',aliases:['قمح','مزرعة قمح'],cost:60000,output:'WHEAT',outputName:'قمح',outputQty:25,duration:30*60*1000,inputs:{},inputsText:'إنتاج أساسي'},
 MILL:{code:'MILL',name:'مطحنة',aliases:['مطحنة','دقيق'],cost:110000,output:'FLOUR',outputName:'دقيق',outputQty:15,duration:35*60*1000,inputs:{WHEAT:20},inputsText:'20 قمح → 15 دقيق'},
 BAKERY:{code:'BAKERY',name:'مخبز',aliases:['مخبز','خبز'],cost:180000,output:'BREAD',outputName:'خبز',outputQty:12,duration:40*60*1000,inputs:{FLOUR:10,EGG:4},inputsText:'10 دقيق + 4 بيض → 12 خبز'},
 MINE:{code:'MINE',name:'منجم',aliases:['منجم','حديد'],cost:300000,output:'IRON',outputName:'حديد',outputQty:18,duration:45*60*1000,inputs:{},inputsText:'إنتاج أساسي'},
 PARTSFACTORY:{code:'PARTSFACTORY',name:'مصنع قطع',aliases:['مصنع قطع','قطع'],cost:650000,output:'PARTS',outputName:'قطع صناعية',outputQty:8,duration:55*60*1000,inputs:{IRON:15},inputsText:'15 حديد → 8 قطع'},
 REFINERY:{code:'REFINERY',name:'مصفاة',aliases:['مصفاة','وقود'],cost:900000,output:'FUEL',outputName:'وقود',outputQty:10,duration:60*60*1000,inputs:{},inputsText:'إنتاج أساسي'},
 JEWELRY:{code:'JEWELRY',name:'ورشة مجوهرات',aliases:['مجوهرات','ورشة مجوهرات'],cost:1200000,output:'JEWEL',outputName:'مجوهرات',outputQty:3,duration:75*60*1000,inputs:{IRON:5},inputsText:'مواد صناعية → 3 مجوهرات'}
});
function projectFrom(raw){const q=String(raw||'').trim().toLowerCase();return Object.values(PROJECT_CATALOG).find(p=>p.code.toLowerCase()===q||p.name===q||p.aliases.includes(q))||null;}
function productFrom(raw){const q=String(raw||'').trim().toLowerCase();return Object.values(PRODUCT_CATALOG).find(p=>p.code.toLowerCase()===q||p.name===q)||null;}
const NPC_REFRESH = 15*60*1000;
const NPC_BASE = Object.freeze({EGG:55,WHEAT:42,FLOUR:80,BREAD:125,MILK:70,FEED:35,IRON:180,PARTS:420,FUEL:310,JEWEL:2200,MEAL:160,BATTERY:650});
function npcSnapshot(){
 const slot=Math.floor(Date.now()/NPC_REFRESH), rng=(n)=>{const x=Math.sin(slot*9301+n*49297)*233280;return x-Math.floor(x);};
 const rows=Object.values(PRODUCT_CATALOG).map((item,i)=>({code:item.code,name:item.name,price:Math.max(5,Math.round((NPC_BASE[item.code]||100)*(0.78+rng(i)*0.55))),qty:8+Math.floor(rng(i+31)*43)}));
 return {slot,rows,next:(slot+1)*NPC_REFRESH-Date.now()};
}
function normalizeBusinessState(state){
 if(!state.inventory||typeof state.inventory!=='object')state.inventory={};
 if(!Array.isArray(state.businesses))state.businesses=[];
 if(!state.store||typeof state.store!=='object')state.store={name:'',slots:3,listings:[],revenue:0,expenses:0,sales:0};
 if(!Array.isArray(state.store.listings))state.store.listings=[];
 state.store.slots=Math.max(3,Math.floor(Number(state.store.slots)||3));
 return state;
}

const users = new Map();
const userMessageIds = new Map();
const markets = new Map();
const marketMessageIds = new Map();
const loadPromises = new Map();
const locks = new Map();

const key = (guildId, userId) => `${guildId}:${userId}`;
const accountLockKey = (guildId, userId) => `account:${guildId}:${userId}`;
const marketLockKey = (guildId) => `market:${guildId}`;

function dataChannel(guild) {
  return guild.channels.cache.find((channel) => channel?.name === DATA_CHANNEL_NAME && channel.isTextBased?.()) || null;
}

async function loadGuild(guild) {
  const started = Date.now();
  const channel = dataChannel(guild);
  if (!channel) throw new Error(`Bank data channel "${DATA_CHANNEL_NAME}" not found in ${guild.name}`);

  const latestUsers = new Map();
  let latestMarket = null;
  let before;
  let scanned = 0;

  while (scanned < 5000) {
    let batch;
    try {
      batch = await channel.messages.fetch({ limit: 100, before });
    } catch (error) {
      throw new Error(`Bank data fetch failed in ${guild.name}: ${error.message}`);
    }
    if (!batch?.size) break;

    for (const message of batch.values()) {
      const record = parseRecord(message.content);
      if (!record || record.guildId !== guild.id) continue;

      if (record.type === 'user') {
        const old = latestUsers.get(record.userId);
        if (!old || message.createdTimestamp > old.ts) {
          latestUsers.set(record.userId, { ...record, id: message.id, ts: message.createdTimestamp });
        }
      } else if (!latestMarket || message.createdTimestamp > latestMarket.ts) {
        latestMarket = { ...record, id: message.id, ts: message.createdTimestamp };
      }
    }

    scanned += batch.size;
    before = batch.last()?.id;
    if (batch.size < 100) break;
  }

  for (const record of latestUsers.values()) {
    users.set(key(guild.id, record.userId), unpackUser(record.payload));
    userMessageIds.set(key(guild.id, record.userId), record.id);
  }

  if (latestMarket) {
    markets.set(guild.id, unpackMarket(latestMarket.payload));
    marketMessageIds.set(guild.id, latestMarket.id);
  } else {
    markets.set(guild.id, newMarket());
  }

  console.log(`[bank] loaded ${latestUsers.size} accounts in ${guild.name} (${Date.now() - started}ms)`);
}

function ensureLoaded(guild) {
  if (!loadPromises.has(guild.id)) {
    const promise = loadGuild(guild).catch((error) => {
      if (loadPromises.get(guild.id) === promise) loadPromises.delete(guild.id);
      console.error('[bank] load failed:', error);
      throw error;
    });
    loadPromises.set(guild.id, promise);
  }
  return loadPromises.get(guild.id);
}

function getUser(guildId, userId) {
  const accountKey = key(guildId, userId);
  if (!users.has(accountKey)) users.set(accountKey, newUser());
  return users.get(accountKey);
}

function debitBalance(state, amount) {
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  if (!value) return 0;
  const before = Number(state.balance) || 0;
  state.balance = before - value;
  if (Number(state.loanDebt || 0) > 0 && before > 0 && state.balance <= 0) {
    state.balance -= Math.max(0, Math.floor(Number(state.loanDebt) || 0));
    state.loanDebt = 0;
  }
  return value;
}

function outstandingLoan(state) {
  return Math.max(0, Math.floor(Number(state.loanDebt) || 0)) + Math.max(0, -Math.floor(Number(state.balance) || 0));
}


async function persistUser(guild, userId) {
  const channel = dataChannel(guild);
  if (!channel) return false;

  const accountKey = key(guild.id, userId);
  const content = `${USER_PREFIX}${guild.id}|${userId}|${enc(packUser(getUser(guild.id, userId)))}`;
  const id = userMessageIds.get(accountKey);

  if (id) {
    const edited = await channel.messages.edit(id, {
      content,
      allowedMentions: { parse: [] },
    }).catch(() => null);
    if (edited) return true;
  }

  const message = await channel.send({ content, allowedMentions: { parse: [] } }).catch((error) => {
    console.error(`[bank] failed to persist user ${userId}:`, error);
    return null;
  });
  if (!message) return false;
  userMessageIds.set(accountKey, message.id);
  return true;
}

async function persistMarket(guild) {
  const channel = dataChannel(guild);
  if (!channel) return false;

  const market = markets.get(guild.id) || newMarket();
  const content = `${MARKET_PREFIX}${guild.id}|${enc(packMarket(market))}`;
  const id = marketMessageIds.get(guild.id);

  if (id) {
    const edited = await channel.messages.edit(id, {
      content,
      allowedMentions: { parse: [] },
    }).catch(() => null);
    if (edited) return true;
  }

  const message = await channel.send({ content, allowedMentions: { parse: [] } }).catch((error) => {
    console.error('[bank] failed to persist market:', error);
    return null;
  });
  if (!message) return false;
  marketMessageIds.set(guild.id, message.id);
  return true;
}

async function withLock(lockKey, fn) {
  const previous = locks.get(lockKey) || Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const queued = previous.catch(() => {}).then(() => gate);
  locks.set(lockKey, queued);
  await previous.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(lockKey) === queued) locks.delete(lockKey);
  }
}

async function withLocks(lockKeys, fn) {
  const ordered = [...new Set(lockKeys)].sort();
  const take = async (index) => {
    if (index >= ordered.length) return fn();
    return withLock(ordered[index], () => take(index + 1));
  };
  return take(0);
}

function normalizeMarketShape(market) {
  if (!market.companies || typeof market.companies !== 'object') market.companies = {};
  delete market.companies.VVIP;
  delete market.vvipLeaderId;
  const seeds = { NVRS: 1200, ASTRA: 2400, ARCANE: 900, SALV: 1650, VIRO: 650 };
  for (const company of Object.values(STOCK_COMPANIES)) {
    if (!market.companies[company.code]) {
      const seed = company.code === 'NVRS' && Number(market.price) > 0 ? Number(market.price) : seeds[company.code];
      const oldHistory = company.code === 'NVRS' && Array.isArray(market.history) ? market.history : [seed];
      market.companies[company.code] = { price: Math.max(5, Math.round(seed)), history: oldHistory.slice(-24) };
    }
  }
  if (!market.assets || typeof market.assets !== 'object') market.assets = {};
  for (const asset of Object.values(ASSET_CATALOG)) {
    if (!market.assets[asset.code]) market.assets[asset.code] = { price: asset.seed, history: [asset.seed] };
  }
  if (Number(market.stockScaleVersion || 1) < 3) {
    for (const company of Object.values(STOCK_COMPANIES)) {
      const data = market.companies[company.code];
      const current = Math.max(1, Number(data.price || seeds[company.code] || 100));
      const multiplier = current < 100 ? 30 : current < 300 ? 10 : 3;
      data.price = Math.max(300, Math.round(current * multiplier));
      data.history = (Array.isArray(data.history) ? data.history : [current])
        .map((n) => Math.max(300, Math.round(Math.max(1, Number(n || current)) * multiplier)))
        .slice(-24);
    }
    market.stockScaleVersion = 3;
  }
  market.updatedAt = Math.max(0, Number(market.updatedAt) || Date.now());
  market.assetUpdatedAt = Math.max(0, Number(market.assetUpdatedAt) || market.updatedAt || Date.now());
  market.goldUpdatedAt = Math.max(0, Number(market.goldUpdatedAt) || market.assetUpdatedAt || Date.now());
  market.price = market.companies.NVRS.price;
  market.history = market.companies.NVRS.history;
  return market;
}

function marketMove() {
  const roll = Math.random();
  let magnitude;
  if (roll < 0.25) magnitude = 0.04 + Math.random() * 0.06;
  else if (roll < 0.65) magnitude = 0.12 + Math.random() * 0.13;
  else if (roll < 0.90) magnitude = 0.30 + Math.random() * 0.25;
  else magnitude = 0.60 + Math.random() * 0.20;
  return magnitude * (Math.random() < 0.5 ? -1 : 1);
}

function goldMove() {
  const roll = Math.random();
  let magnitude;
  if (roll < 0.60) magnitude = 0.015 + Math.random() * 0.035;
  else if (roll < 0.90) magnitude = 0.06 + Math.random() * 0.06;
  else magnitude = 0.15 + Math.random() * 0.10;
  return magnitude * (Math.random() < 0.58 ? 1 : -1);
}

function assetsValue(state, market) {
  return Object.values(ASSET_CATALOG).reduce((sum, asset) => sum + Math.max(0, Number(state.assets?.[asset.code] || 0)) * market.assets[asset.code].price, 0);
}

function baseNetWorth(state, market) {
  return state.balance + state.vault + portfolioValue(state, market) + assetsValue(state, market);
}

function updateMarket(guildId) {
  const currentMarket = markets.get(guildId) || newMarket();
  const scaleChanged = Number(currentMarket.stockScaleVersion || 1) < 3;
  const market = normalizeMarketShape(currentMarket);
  const now = Date.now();
  const stockSteps = Math.min(24, Math.floor(Math.max(0, now - market.updatedAt) / MARKET_STEP));
  const assetSteps = Math.min(24, Math.floor(Math.max(0, now - market.assetUpdatedAt) / ASSET_MARKET_STEP));
  const goldSteps = Math.min(96, Math.floor(Math.max(0, now - market.goldUpdatedAt) / GOLD_MARKET_STEP));

  for (let i = 0; i < stockSteps; i += 1) {
    for (const company of Object.values(STOCK_COMPANIES)) {
      const data = market.companies[company.code];
      const move = marketMove();
      data.price = clamp(Math.max(300, Math.round(data.price * (1 + move))), 300, 5000000);
      data.history = [...(data.history || [data.price]), data.price].slice(-24);
    }
    market.updatedAt += MARKET_STEP;
  }

  for (let i = 0; i < assetSteps; i += 1) {
    for (const asset of Object.values(ASSET_CATALOG)) {
      if (asset.code === 'GOLD') continue;
      const data = market.assets[asset.code];
      const move = marketMove() * 0.8;
      data.price = clamp(Math.max(1, Math.round(data.price * (1 + move))), Math.max(1, Math.round(asset.seed * 0.08)), asset.seed * 20);
      data.history = [...(data.history || [data.price]), data.price].slice(-24);
    }
    market.assetUpdatedAt += ASSET_MARKET_STEP;
  }

  for (let i = 0; i < goldSteps; i += 1) {
    const asset = ASSET_CATALOG.GOLD;
    const data = market.assets.GOLD;
    const move = goldMove();
    data.price = clamp(Math.max(1, Math.round(data.price * (1 + move))), Math.max(1, Math.round(asset.seed * 0.08)), asset.seed * 20);
    data.history = [...(data.history || [data.price]), data.price].slice(-24);
    market.goldUpdatedAt += GOLD_MARKET_STEP;
  }

  market.price = market.companies.NVRS.price;
  market.history = market.companies.NVRS.history;
  markets.set(guildId, market);
  return {
    market,
    changed: scaleChanged || stockSteps > 0 || assetSteps > 0 || goldSteps > 0,
    stockChanged: stockSteps > 0,
    assetChanged: assetSteps > 0,
    goldChanged: goldSteps > 0,
  };
}

function companyFrom(raw) {
  const q = String(raw || '').trim().toLowerCase();
  return Object.values(STOCK_COMPANIES).find(c => c.code.toLowerCase() === q || c.name.toLowerCase() === q || c.aliases.includes(q)) || null;
}

function holdingUnits(state, code) {
  return Math.max(0, Number(state.stocks?.[code] || (code === 'NVRS' ? state.shares : 0)) || 0);
}

function setHoldingUnits(state, code, units) {
  if (!state.stocks || typeof state.stocks !== 'object') state.stocks = {};
  state.stocks[code] = Math.max(0, Number(units) || 0);
  if (state.stocks[code] < 0.000001) delete state.stocks[code];
  if (code === 'NVRS') state.shares = state.stocks[code] || 0;
}

function portfolioValue(state, market) {
  return Object.values(STOCK_COMPANIES).reduce((sum, company) => sum + holdingUnits(state, company.code) * market.companies[company.code].price, 0);
}

function cleanAssetQuery(raw) {
  return String(raw || '').trim().toLowerCase()
    .replace(/^(?:سيارة|سياره|عقار|عقارات|طيارة|طياره|طائرة|طائره)\s+/u, '')
    .trim();
}

function assetFrom(raw) {
  const q = cleanAssetQuery(raw);
  return Object.values(ASSET_CATALOG).find((a) => a.code.toLowerCase() === q || a.name.toLowerCase() === q || a.aliases.includes(q)) || null;
}

function assetCategoryLabel(category) {
  return category === 'PROPERTY' ? 'العقارات' : category === 'CAR' ? 'السيارات' : category === 'PLANE' ? 'الطائرات' : 'الذهب';
}
function categoryFromText(raw) {
  const q = String(raw || '').trim().toLowerCase();
  if (/^(?:عقار|عقارات|ارض|أرض|اراضي|أراضي)$/u.test(q)) return 'PROPERTY';
  if (/^(?:سيارة|سياره|سيارات)$/u.test(q)) return 'CAR';
  if (/^(?:طائرة|طائره|طيارة|طياره|طائرات)$/u.test(q)) return 'PLANE';
  return null;
}

async function assetCatalog(message, category) {
  await withLock(marketLockKey(message.guildId), async () => {
    const { market, changed } = updateMarket(message.guildId);
    if (changed && !await persistMarket(message.guild)) return replyInfo(message, 'تعذر تحديث الأسعار', 'جرّب مرة ثانية');
    const next = Math.max(0, market.assetUpdatedAt + ASSET_MARKET_STEP - Date.now());
    const label = assetCategoryLabel(category);
    await replyImage(
      message,
      assetCatalogCard(category, market, ASSET_CATALOG, next),
      `asset-catalog-${category.toLowerCase()}-${message.guildId}.png`,
      `<@${message.author.id}> — ${label} المتوفرة`,
    );
  });
}

async function goldMarket(message) {
  await withLock(marketLockKey(message.guildId), async () => {
    const { market, changed } = updateMarket(message.guildId);
    if (changed && !await persistMarket(message.guild)) return replyInfo(message, 'تعذر تحديث سعر الذهب', 'جرّب مرة ثانية');
    const next = Math.max(0, market.goldUpdatedAt + GOLD_MARKET_STEP - Date.now());
    const state = getUser(message.guildId, message.author.id);
    await replyImage(
      message,
      goldMarketCard(market, state, next),
      `gold-market-${message.guildId}.png`,
      `<@${message.author.id}> — سعر الذهب الحالي ${money(market.assets.GOLD.price)} للأونصة`,
    );
  });
}

function rankForUser(guildId, userId, market) {
  const rows = [];
  for (const [accountKey, state] of users) {
    if (!accountKey.startsWith(`${guildId}:`)) continue;
    rows.push({ id: accountKey.slice(guildId.length + 1), net: baseNetWorth(state, market) });
  }
  rows.sort((a,b)=>b.net-a.net);
  const i = rows.findIndex((row)=>row.id===userId);
  return i >= 0 ? i + 1 : rows.length + 1;
}

async function properties(message) {
  const { market, changed } = updateMarket(message.guildId);
  const state = getUser(message.guildId, message.author.id);
  const save = changed ? persistMarket(message.guild) : Promise.resolve(true);
  await commitCard(
    message,
    save,
    Promise.resolve(propertiesCard(state, market, STOCK_COMPANIES, ASSET_CATALOG, portfolioValue(state, market), assetsValue(state, market))),
    `properties-${message.author.id}.png`,
    `<@${message.author.id}> — ممتلكات Neverless`,
  );
}

async function tradeAsset(message, action, raw) {
  let text = String(raw || '').trim();
  let amountRaw = '';
  let asset = assetFrom(text);

  if (!asset) {
    const m = text.match(/^(.*?)(?:\s+([0-9٠-٩۰-۹.,]+|كامل|الكل|نص|نصف|ربع|full|all|half|quarter))$/u);
    if (m) {
      asset = assetFrom(m[1]);
      amountRaw = m[2];
    }
  }
  if (!asset) {
    return replyUsage(message, action === 'buy' ? 'شراء' : 'بيع', [
      `${action === 'buy' ? 'شراء' : 'بيع'} فيلا`,
      `${action === 'buy' ? 'شراء' : 'بيع'} سيارة رياضية`,
      `${action === 'buy' ? 'شراء' : 'بيع'} طائرة خاصة`,
      `${action === 'buy' ? 'شراء' : 'بيع'} ذهب 50000`,
    ]);
  }

  await withLocks([marketLockKey(message.guildId), accountLockKey(message.guildId, message.author.id)], async () => {
    const { market, changed } = updateMarket(message.guildId);
    const state = getUser(message.guildId, message.author.id);
    const price = market.assets[asset.code].price;
    const owned = Math.max(0, Number(state.assets?.[asset.code] || 0));
    let quantity, total;

    if (asset.code === 'GOLD') {
      if (!amountRaw) {
        const parts = text.split(/\s+/u);
        amountRaw = parts.length > 1 ? parts.at(-1) : '';
      }
      const maxValue = action === 'buy' ? state.balance : owned * price;
      if (action === 'sell' && owned <= 0) return replyInfo(message, 'لا تملك ذهباً', 'اشترِ ذهباً أولاً ثم يمكنك بيعه');
      total = parseAmount(amountRaw, maxValue);
      if (!Number.isFinite(total)) return replyUsage(message, action === 'buy' ? 'شراء ذهب' : 'بيع ذهب', [
        `${action === 'buy' ? 'شراء' : 'بيع'} ذهب 50000`,
        `${action === 'buy' ? 'شراء' : 'بيع'} ذهب نص`,
        `${action === 'buy' ? 'شراء' : 'بيع'} ذهب كامل`,
      ]);
      quantity = total / price;
      if (action === 'buy') { debitBalance(state, total); state.assets.GOLD = owned + quantity; }
      else { state.assets.GOLD = Math.max(0, owned - quantity); state.balance += total; }
    } else {
      let count = 1;
      if (amountRaw) count = Number(digits(amountRaw).replace(/,/g,''));
      if (!Number.isInteger(count) || count <= 0 || count > 100) return replyInfo(message,'كمية غير صالحة','استخدم اسم الممتلك فقط أو أضف عدداً صحيحاً');
      quantity = count;
      total = price * count;
      if (action === 'buy') {
        if (state.balance < total) return replyInfo(message,'رصيد غير كافٍ',`تحتاج ${money(total)}`);
        debitBalance(state, total);
        state.assets[asset.code] = owned + count;
      } else {
        if (owned < count) return replyInfo(message,'لا تملك هذا الممتلك',`لديك ${owned} من ${asset.name}`);
        state.assets[asset.code] = owned - count;
        if (state.assets[asset.code] <= 0) delete state.assets[asset.code];
        state.balance += total;
      }
    }

    const persisted = Promise.all([persistUser(message.guild,message.author.id), changed ? persistMarket(message.guild) : Promise.resolve(true)]).then(x=>x.every(Boolean));
    await commitCard(message,persisted,assetTradeCard(message.author,action,asset,quantity,total,price,state,assetsValue(state,market)),`asset-${action}-${asset.code}-${message.author.id}.png`,`<@${message.author.id}> — ${action==='buy'?'شراء':'بيع'} ${asset.name} • ${money(total)}`);
  });
}

function helpEmbed() {
  return new EmbedBuilder()
    .setColor(0x173a5e)
    .setTitle('🏦 أوامر Neverless Bank')
        .addFields(
      { name: 'الحساب', value: 'رصيد\nتحويل\nايداع\nسحب', inline: true },
      { name: 'الدخل', value: 'راتب\nبخشيش\nقرض\nتسديد قرض\nوقت', inline: true },
      { name: 'الألعاب', value: 'رهان\nاستثمار\nنرد\nقمار\nتداول', inline: true },
      { name: 'ألعاب إضافية', value: 'روليت\nهايلو\nصناديق\nالغام\nفواكه\nالوان\nعملة\nرقم', inline: true },
      { name: 'السوق', value: 'سهم\nعقار / سيارة / طائرة\nذهب\nشراء اسم الممتلك\nبيع اسم الممتلك\nممتلكات', inline: true },
      { name: 'الأمان والترتيب', value: 'سرقة\nحماية\nالغاء حماية\nتوب', inline: true },
      { name: 'الأعمال والمتاجر', value: 'مشاريع\nإنشاء مشروع\nمشروعي\nإنتاج\nتطوير مشروع\nمخزني\nإنشاء متجر\nمتجر @member\nعرض\nشراء من متجر\nتوسعة متجر\nدخل المتجر', inline: true },
    )
    .setFooter({ text: 'Neverless Bank' });
}

function cooldownEmbed(user, state) {
  const now = Date.now();
  const rows = [
    ['راتب', Math.max(0, state.salaryAt + SALARY_CD - now)],
    ['بخشيش', Math.max(0, state.tipAt + TIP_CD - now)],
    ['قرض', Math.max(0, Number(state.loanAt || 0) + LOAN_CD - now)],
    ['رهان', commandCooldownLeft(state, 'bet', now)],
    ['استثمار', commandCooldownLeft(state, 'invest', now)],
    ['نرد', commandCooldownLeft(state, 'dice', now)],
    ['قمار', commandCooldownLeft(state, 'gamble', now)],
    ['تداول', commandCooldownLeft(state, 'trade', now)],
    ['روليت', commandCooldownLeft(state, 'roulette', now)],
    ['هايلو', commandCooldownLeft(state, 'hilo', now)],
    ['صناديق', commandCooldownLeft(state, 'boxes', now)],
    ['ألغام', commandCooldownLeft(state, 'mines', now)],
    ['فواكه', commandCooldownLeft(state, 'fruits', now)],
    ['ألوان', commandCooldownLeft(state, 'colors', now)],
    ['عملة', commandCooldownLeft(state, 'coin', now)],
    ['رقم', commandCooldownLeft(state, 'number', now)],
    ['سرقة', commandCooldownLeft(state, 'rob', now)],
  ];
  const protectionLeft = Math.max(0, Number(state.protectionUntil || 0) - now);
  const value = rows.map(([name, ms]) => `${ms <= 0 ? '✅' : '❌'} **${name}** — ${ms <= 0 ? 'متاح' : formatDuration(ms)}`).join('\n');
  return new EmbedBuilder()
    .setColor(0x173a5e)
    .setTitle('⏱️ حالة أوامر Neverless Bank')
    .setDescription(value)
    .addFields({ name: 'الحماية', value: protectionLeft > 0 ? `🛡️ مفعلة — ${formatDuration(protectionLeft)}` : 'غير مفعلة' })
    .setFooter({ text: user.globalName || user.username || 'Neverless Bank' });
}

async function replyImage(message, buffer, name, content = null, components = []) {
  return message.reply({
    content: content || `<@${message.author.id}>`,
    files: [{ attachment: buffer, name }],
    components,
    allowedMentions: { repliedUser: true, users: [message.author.id] },
  });
}

async function replyInfo(message, title, text, content = null) {
  return replyImage(message, infoCard(title, text), `bank-info-${Date.now()}.png`, content);
}

async function replyUsage(message, command, lines) {
  return replyImage(message, usageCard(command, lines), `bank-usage-${Date.now()}.png`);
}

async function commitCard(message, persistPromise, cardPromise, fileName, content) {
  const [persisted, image] = await Promise.all([persistPromise, cardPromise]);
  if (!persisted) {
    console.error(`[bank] persistence failed before success reply: ${fileName}`);
    return replyInfo(message, 'تعذر حفظ العملية', 'لم يتم تأكيد العملية • جرّب مرة ثانية');
  }
  return replyImage(message, image, fileName, content);
}

async function balance(message) {
  const target = message.mentions.users.first() || message.author;
  const existed = users.has(key(message.guildId, target.id));
  const { market, changed } = updateMarket(message.guildId);
  const state = getUser(message.guildId, target.id);
  const persistPromise = Promise.all([
    existed ? Promise.resolve(true) : persistUser(message.guild, target.id),
    changed ? persistMarket(message.guild) : Promise.resolve(true),
  ]).then((results) => results.every(Boolean));
  await commitCard(
    message,
    persistPromise,
    balanceCard(target, { ...state, rank: rankForUser(message.guildId,target.id,market), portfolioValue: portfolioValue(state, market), assetValue: assetsValue(state, market), stockPositions: Object.keys(state.stocks || {}).filter(code => holdingUnits(state, code) > 0).length }, market.price),
    `neverless-balance-${target.id}.png`,
    `<@${target.id}> — حساب Neverless Bank`,
  );
}

async function income(message, type) {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const isSalary = type === 'salary';
    const at = isSalary ? state.salaryAt : state.tipAt;
    const cooldown = isSalary ? SALARY_CD : TIP_CD;
    const left = Math.max(0, Number(at) + cooldown - Date.now());
    if (left > 0) {
      await replyInfo(message, 'الأمر غير متاح', `الوقت الباقي ${formatDuration(left)}`);
      return;
    }

    const amount = isSalary ? 700 + Math.floor(Math.random() * 801) : 120 + Math.floor(Math.random() * 381);
    state.balance += amount;
    state.earned += amount;
    if (isSalary) state.salaryAt = Date.now();
    else state.tipAt = Date.now();

    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      rewardCard(message.author, isSalary ? 'راتب Neverless' : 'بخشيش Neverless', amount, state.balance, type),
      `${type}-${message.author.id}.png`,
      `<@${message.author.id}> — ${isSalary ? 'تم إيداع راتبك' : 'وصلتك مكافأة'}`,
    );
  });
}

async function loan(message) {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    if (outstandingLoan(state) > 0) {
      await replyInfo(message, 'لديك قرض قائم', `المتبقي عليك ${money(outstandingLoan(state))}`);
      return;
    }
    const left = Math.max(0, Number(state.loanAt || 0) + LOAN_CD - Date.now());
    if (left > 0) {
      await replyInfo(message, 'القرض غير متاح', `الوقت الباقي ${formatDuration(left)}`);
      return;
    }
    state.balance += LOAN_AMOUNT;
    state.loanDebt = LOAN_AMOUNT;
    state.loanAt = Date.now();
    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      rewardCard(message.author, 'قرض Neverless', LOAN_AMOUNT, state.balance, 'loan'),
      `loan-${message.author.id}.png`,
      `<@${message.author.id}> — تم إيداع قرض ${money(LOAN_AMOUNT)} • المتبقي ${money(state.loanDebt)}`,
    );
  });
}

async function repayLoan(message, raw = 'كامل') {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const debt = outstandingLoan(state);
    if (debt <= 0) return replyInfo(message, 'لا يوجد قرض', 'ليس لديك قرض متبقٍ للسداد');

    if (state.balance < 0) {
      return replyInfo(message, 'رصيدك بالسالب', `المتبقي عليك ${money(Math.abs(state.balance))} • أي راتب أو بخشيش يقلل الدين تلقائياً`);
    }

    const available = Math.min(Math.max(0, state.balance), Math.max(0, Number(state.loanDebt || 0)));
    const amount = parseAmount(raw || 'كامل', available);
    if (!Number.isFinite(amount)) return replyUsage(message, 'تسديد قرض', ['تسديد قرض كامل', 'تسديد قرض نص', 'تسديد قرض 5000']);

    state.balance -= amount;
    state.loanDebt = Math.max(0, Number(state.loanDebt || 0) - amount);
    if (state.balance <= 0 && state.loanDebt > 0) {
      state.balance = -Math.floor(state.loanDebt);
      state.loanDebt = 0;
    }

    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      economyEventCard(message.author, 'تسديد قرض', amount, state.balance, 'good'),
      `loan-repay-${message.author.id}.png`,
      `<@${message.author.id}> — تم تسديد ${money(amount)} • المتبقي ${money(outstandingLoan(state))}`,
    );
  });
}

async function transfer(message, raw) {
  const target = message.mentions.users.first();
  if (!target || target.bot || target.id === message.author.id) {
    await replyInfo(message, 'طريقة الاستخدام', 'تحويل @member 500');
    return;
  }

  await withLocks([
    accountLockKey(message.guildId, message.author.id),
    accountLockKey(message.guildId, target.id),
  ], async () => {
    const fromState = getUser(message.guildId, message.author.id);
    const amount = parseAmount(raw, fromState.balance);
    if (!Number.isFinite(amount)) {
      await replyInfo(message, 'مبلغ غير صالح', `رصيدك المتاح ${money(fromState.balance)}`);
      return;
    }

    const toState = getUser(message.guildId, target.id);
    debitBalance(fromState, amount);
    toState.balance += amount;

    const persistPromise = Promise.all([
      persistUser(message.guild, message.author.id),
      persistUser(message.guild, target.id),
    ]).then((results) => results.every(Boolean));
    await commitCard(
      message,
      persistPromise,
      transferCard(message.author, target, amount, fromState.balance, toState.balance),
      `transfer-${message.author.id}-${target.id}.png`,
      `<@${message.author.id}> → <@${target.id}> • ${money(amount)}`,
    );
  });
}

async function vault(message, action, raw) {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const source = action === 'deposit' ? state.balance : state.vault;
    const amount = parseAmount(raw, source);
    if (!Number.isFinite(amount)) {
      await replyUsage(message, action === 'deposit' ? 'ايداع' : 'سحب', [action === 'deposit' ? 'ايداع كامل' : 'سحب كامل', action === 'deposit' ? 'ايداع نص' : 'سحب نص', action === 'deposit' ? 'ايداع ربع' : 'سحب ربع', action === 'deposit' ? 'ايداع 5000' : 'سحب 5000']);
      return;
    }

    if (action === 'deposit') {
      debitBalance(state, amount);
      state.vault += amount;
    } else {
      state.vault -= amount;
      state.balance += amount;
    }

    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      vaultCard(message.author, action, amount, state),
      `vault-${action}-${message.author.id}.png`,
      `<@${message.author.id}> — ${action === 'deposit' ? 'إيداع' : 'سحب'} ${money(amount)}`,
    );
  });
}

function scaledPercent(wager, min, max) {
  const scale = Math.max(0, Math.min(1, Math.log10(Math.max(10, wager)) / 9));
  const lo = min * (1 - scale * 0.35);
  const hi = max * (1 - scale * 0.45);
  return Math.round(lo + Math.random() * (hi - lo));
}

function randomOutcome(type, wager) {
  if (type === 'bet') {
    const won = Math.random() < 0.48;
    const multiplier = won ? 1.9 : 0;
    return { payout: won ? Math.floor(wager * multiplier) : 0, multiplier };
  }
  if (type === 'invest') {
    const won = Math.random() < 0.58;
    const percent = won ? 10 + Math.floor(Math.random() * 26) : -(6 + Math.floor(Math.random() * 15));
    return { payout: Math.max(0, Math.floor(wager * (1 + percent / 100))), percent };
  }
  if (type === 'dice') {
    const player = 1 + Math.floor(Math.random() * 6);
    const bank = 1 + Math.floor(Math.random() * 6);
    return { payout: player > bank ? wager * 2 : player === bank ? wager : 0, player, bank };
  }
  if (type === 'gamble') {
    const won = Math.random() < 0.48;
    const multiplier = won ? 2 : 0;
    return { payout: won ? wager * 2 : 0, multiplier };
  }
  const won = Math.random() < 0.55;
  const percent = won ? 8 + Math.floor(Math.random() * 21) : -(7 + Math.floor(Math.random() * 16));
  return { payout: Math.max(0, Math.floor(wager * (1 + percent / 100))), percent };
}

async function moneyGame(message, type, raw) {
  const names = { bet: 'رهان', invest: 'استثمار', dice: 'نرد', gamble: 'قمار', trade: 'تداول' };
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const left = commandCooldownLeft(state, type);
    if (left > 0) {
      await replyInfo(message, `${names[type]} غير متاح`, `الوقت الباقي ${formatDuration(left)}`);
      return;
    }

    const wager = parseAmount(raw, Math.min(state.balance, MAX_BET));
    if (!Number.isFinite(wager)) {
      await replyUsage(message, names[type], [`${names[type]} كامل`, `${names[type]} نص`, `${names[type]} ربع`, `${names[type]} 5000`]);
      return;
    }

    const out = randomOutcome(type, wager);
    const net = out.payout - wager;
    debitBalance(state, wager);
    state.balance += out.payout;
    state.games += 1;
    if (net > 0) {
      state.wins += 1;
      state.earned += net;
    } else if (net < 0) {
      state.lost += -net;
    }
    setCommandCooldown(state, type);

    let cardPromise;
    if (type === 'invest') cardPromise = investmentCard(message.author, wager, out, net, state.balance);
    else if (type === 'bet') cardPromise = betCard(message.author, wager, out, net, state.balance);
    else if (type === 'dice') cardPromise = diceCard(message.author, message.client.user, wager, out.player, out.bank, net > 0 ? 'win' : net < 0 ? 'loss' : 'draw', state.balance);
    else if (type === 'gamble') cardPromise = gambleCard(message.author, wager, out, net, state.balance);
    else cardPromise = tradeGameCard(message.author, wager, out, net, state.balance);

    const resultText = net > 0 ? `ربحت ${money(net)}` : net < 0 ? `خسرت ${money(-net)}` : 'تعادل';
    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      cardPromise,
      `${type}-${message.author.id}-${Date.now()}.png`,
      `<@${message.author.id}> — ${names[type]} • ${resultText}`,
    );
  });
}

function diceChallengeButtons(nonce, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`nlbank:dice:${nonce}:accept`)
      .setLabel('قبول')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`nlbank:dice:${nonce}:reject`)
      .setLabel('رفض')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
  )];
}

async function diceChallenge(message, raw) {
  const target = message.mentions.users.first();
  if (!target || target.bot || target.id === message.author.id) {
    await replyInfo(message, 'تحدي غير صالح', 'اختر عضو مختلف للتحدي');
    return;
  }

  const amountRaw = String(raw).replace(/<@!?\d{15,22}>/g, '').trim();
  const challengerState = getUser(message.guildId, message.author.id);
  const wager = parseAmount(amountRaw, Math.min(challengerState.balance, MAX_BET));
  if (!Number.isFinite(wager)) {
    await replyInfo(message, 'مبلغ غير صالح', `رصيدك المتاح ${money(challengerState.balance)}`);
    return;
  }

  const nonce = crypto.randomBytes(5).toString('hex');
  const sent = await message.reply({
    content: `🎲 <@${target.id}> لديك تحدي نرد من <@${message.author.id}> بقيمة **${money(wager)}**`,
    components: diceChallengeButtons(nonce),
    allowedMentions: { repliedUser: false, users: [target.id, message.author.id] },
  });

  const collector = sent.createMessageComponentCollector({ time: 45_000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== target.id) {
      await interaction.reply({ content: 'فقط العضو المطلوب يستطيع قبول أو رفض التحدي.', ephemeral: true }).catch(() => {});
      return;
    }

    collector.stop('done');
    const accepted = interaction.customId.endsWith(':accept');
    await interaction.deferUpdate().catch(() => {});

    if (!accepted) {
      await sent.edit({
        content: `❌ <@${target.id}> رفض تحدي النرد من <@${message.author.id}>.`,
        components: diceChallengeButtons(nonce, true),
        allowedMentions: { users: [target.id, message.author.id] },
      }).catch(() => {});
      return;
    }

    let result;
    await withLocks([
      accountLockKey(message.guildId, message.author.id),
      accountLockKey(message.guildId, target.id),
    ], async () => {
      const a = getUser(message.guildId, message.author.id);
      const b = getUser(message.guildId, target.id);
      const aCd = commandCooldownLeft(a, 'dice');
      const bCd = commandCooldownLeft(b, 'dice');
      if (aCd > 0 || bCd > 0) {
        result = { error: `أمر النرد غير متاح حالياً • ${aCd > 0 ? formatDuration(aCd) : formatDuration(bCd)}` };
        return;
      }
      if (a.balance < wager || b.balance < wager) {
        result = { error: 'أحد الطرفين لا يملك المبلغ المطلوب حالياً.' };
        return;
      }

      let aRoll = 1 + Math.floor(Math.random() * 6);
      let bRoll = 1 + Math.floor(Math.random() * 6);
      while (aRoll === bRoll) {
        aRoll = 1 + Math.floor(Math.random() * 6);
        bRoll = 1 + Math.floor(Math.random() * 6);
      }

      const aWon = aRoll > bRoll;
      a.balance += aWon ? wager : -wager;
      b.balance += aWon ? -wager : wager;
      a.games += 1; b.games += 1;
      if (aWon) {
        a.wins += 1; a.earned += wager; b.lost += wager;
      } else {
        b.wins += 1; b.earned += wager; a.lost += wager;
      }
      setCommandCooldown(a, 'dice');
      setCommandCooldown(b, 'dice');

      const saved = await Promise.all([
        persistUser(message.guild, message.author.id),
        persistUser(message.guild, target.id),
      ]);

      result = saved.every(Boolean)
        ? { aRoll, bRoll, aWon, aBalance: a.balance, bBalance: b.balance }
        : { error: 'تعذر حفظ نتيجة التحدي.' };
    });

    if (result.error) {
      await sent.edit({ content: result.error, components: diceChallengeButtons(nonce, true) }).catch(() => {});
      return;
    }

    const winner = result.aWon ? message.author : target;
    const image = await diceCard(
      message.author,
      target,
      wager,
      result.aRoll,
      result.bRoll,
      result.aWon ? 'win' : 'loss',
      result.aBalance,
    );

    await sent.edit({
      content: `🎲 الفائز <@${winner.id}> • ربح **${money(wager)}**`,
      files: [{ attachment: image, name: `dice-duel-${nonce}.png` }],
      attachments: [],
      components: diceChallengeButtons(nonce, true),
      allowedMentions: { users: [winner.id] },
    }).catch((error) => console.error('[bank] dice duel edit failed:', error));
  });

  collector.on('end', async (_, reason) => {
    if (reason !== 'done') {
      await sent.edit({
        content: 'انتهى وقت قبول تحدي النرد.',
        components: diceChallengeButtons(nonce, true),
      }).catch(() => {});
    }
  });
}

async function roulette(message, raw) {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const left = commandCooldownLeft(state, 'roulette');
    if (left > 0) {
      await replyInfo(message, 'روليت غير متاح', `الوقت الباقي ${formatDuration(left)}`);
      return;
    }

    const wager = parseAmount(raw, Math.min(state.balance, MAX_BET));
    if (!Number.isFinite(wager)) {
      await replyInfo(message, 'طريقة الاستخدام', `روليت كامل / نص / ربع / 500 • رصيدك ${money(state.balance)}`);
      return;
    }

    const roll = Math.random();
    const multiplier = roll >= 0.95 ? 5 : roll >= 0.85 ? 2 : roll >= 0.65 ? 1.5 : roll >= 0.45 ? 1 : 0;
    const payout = Math.floor(wager * multiplier);
    const net = payout - wager;
    debitBalance(state, wager); state.balance += payout;
    state.games += 1;
    if (net > 0) {
      state.wins += 1;
      state.earned += net;
    } else if (net < 0) {
      state.lost += -net;
    }
    setCommandCooldown(state, 'roulette');

    await commitCard(
      message,
      persistUser(message.guild, message.author.id),
      Promise.resolve(rouletteCard(multiplier, wager, payout, state.balance)),
      `roulette-${message.author.id}.png`,
      `<@${message.author.id}> — ${net > 0 ? `ربحت ${money(net)}` : net < 0 ? `خسرت ${money(-net)}` : 'عاد لك نفس المبلغ'}`,
    );
  });
}

function hiloButtons(nonce, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`nlbank:hilo:${nonce}:up`)
      .setLabel('أعلى')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`nlbank:hilo:${nonce}:down`)
      .setLabel('أقل')
      .setEmoji('📉')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
  )];
}

async function hilo(message, raw) {
  const state = getUser(message.guildId, message.author.id);
  const wager = parseAmount(raw, Math.min(state.balance, MAX_BET));
  if (!Number.isFinite(wager)) {
    await replyInfo(message, 'طريقة الاستخدام', `هايلو كامل / نص / ربع / 500 • رصيدك ${money(state.balance)}`);
    return;
  }

  let started = false;
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const fresh = getUser(message.guildId, message.author.id);
    const left = commandCooldownLeft(fresh, 'hilo');
    if (left > 0) {
      await replyInfo(message, 'هايلو غير متاح', `الوقت الباقي ${formatDuration(left)}`);
      return;
    }
    if (fresh.balance < wager) {
      await replyInfo(message, 'رصيد غير كافٍ', `رصيدك ${money(fresh.balance)}`);
      return;
    }
    setCommandCooldown(fresh, 'hilo');
    if (!await persistUser(message.guild, message.author.id)) {
      await replyInfo(message, 'تعذر حفظ الجولة', 'جرّب مرة ثانية');
      return;
    }
    started = true;
  });
  if (!started) return;

  const current = 2 + Math.floor(Math.random() * 13);
  const nonce = crypto.randomBytes(4).toString('hex');
  const sent = await replyImage(
    message,
    hiloCard(current, null, null, wager),
    `hilo-${nonce}.png`,
    `<@${message.author.id}> — اختر أعلى أو أقل`,
    hiloButtons(nonce),
  );
  const collector = sent.createMessageComponentCollector({ time: 45_000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({ content: 'هذه الجولة ليست لك.', ephemeral: true }).catch(() => {});
      return;
    }
    collector.stop('done');
    await interaction.deferUpdate().catch(() => {});
    const up = interaction.customId.endsWith(':up');
    let output;

    await withLock(accountLockKey(message.guildId, message.author.id), async () => {
      const fresh = getUser(message.guildId, message.author.id);
      if (fresh.balance < wager) {
        output = { error: `رصيدك أصبح أقل من ${money(wager)}.` };
        return;
      }

      let next = current;
      while (next === current) next = 2 + Math.floor(Math.random() * 13);
      const won = up ? next > current : next < current;
      const payout = won ? wager * 2 : 0;
      const net = payout - wager;
      debitBalance(fresh, wager); fresh.balance += payout;
      fresh.games += 1;
      if (net > 0) {
        fresh.wins += 1;
        fresh.earned += net;
      } else if (net < 0) {
        fresh.lost += -net;
      }
      const persisted = await persistUser(message.guild, message.author.id);
      output = persisted ? { next, won, payout, net, balance: fresh.balance } : { error: 'تعذر حفظ نتيجة الجولة.' };
    });

    if (output.error) {
      await sent.edit({ content: output.error, components: hiloButtons(nonce, true) }).catch(() => {});
      return;
    }

    await sent.edit({
      content: `<@${message.author.id}> — ${output.won ? `ربحت ${money(output.net)}` : `خسرت ${money(wager)}`}`,
      files: [{ attachment: hiloCard(current, output.next, output.won, wager, output.balance), name: `hilo-result-${nonce}.png` }],
      attachments: [],
      components: hiloButtons(nonce, true),
      allowedMentions: { users: [message.author.id], repliedUser: true },
    }).catch((error) => console.error('[bank] hilo result edit failed:', error));
  });

  collector.on('end', async (_, reason) => {
    if (reason !== 'done') await sent.edit({ components: hiloButtons(nonce, true) }).catch(() => {});
  });
}

function boxButtons(nonce, disabled = false) {
  return [new ActionRowBuilder().addComponents(
    ...Array.from({ length: 5 }, (_, index) => new ButtonBuilder()
      .setCustomId(`nlbank:box:${nonce}:${index}`)
      .setLabel(String(index + 1))
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)),
  )];
}

async function boxes(message, raw) {
  const state = getUser(message.guildId, message.author.id);
  const wager = parseAmount(raw || '500', Math.min(state.balance, MAX_BET));
  if (!Number.isFinite(wager)) {
    await replyInfo(message, 'طريقة الاستخدام', `صناديق كامل / نص / ربع / 500 • رصيدك ${money(state.balance)}`);
    return;
  }

  let started = false;
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const fresh = getUser(message.guildId, message.author.id);
    const left = commandCooldownLeft(fresh, 'boxes');
    if (left > 0) {
      await replyInfo(message, 'الصناديق غير متاحة', `الوقت الباقي ${formatDuration(left)}`);
      return;
    }
    if (fresh.balance < wager) {
      await replyInfo(message, 'رصيد غير كافٍ', `رصيدك ${money(fresh.balance)}`);
      return;
    }
    setCommandCooldown(fresh, 'boxes');
    if (!await persistUser(message.guild, message.author.id)) {
      await replyInfo(message, 'تعذر حفظ الجولة', 'جرّب مرة ثانية');
      return;
    }
    started = true;
  });
  if (!started) return;

  const bomb = Math.floor(Math.random() * 5);
  const multipliers = [0.5, 1, 1.5, 2.5].sort(() => Math.random() - 0.5);
  const list = [];
  let multiplierIndex = 0;
  for (let index = 0; index < 5; index += 1) {
    list.push(index === bomb ? { bomb: true, mult: 0 } : { bomb: false, mult: multipliers[multiplierIndex++] });
  }

  const nonce = crypto.randomBytes(4).toString('hex');
  const sent = await replyImage(
    message,
    boxesCard(wager),
    `boxes-${nonce}.png`,
    `<@${message.author.id}> — اختر صندوقاً`,
    boxButtons(nonce),
  );
  const collector = sent.createMessageComponentCollector({ time: 45_000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({ content: 'هذه الصناديق ليست لك.', ephemeral: true }).catch(() => {});
      return;
    }
    collector.stop('done');
    await interaction.deferUpdate().catch(() => {});
    const pickedIndex = Number(interaction.customId.split(':')[3]);
    const picked = list[pickedIndex];
    let output;

    await withLock(accountLockKey(message.guildId, message.author.id), async () => {
      const fresh = getUser(message.guildId, message.author.id);
      if (fresh.balance < wager) {
        output = { error: `رصيدك أصبح أقل من ${money(wager)}.` };
        return;
      }
      const payout = picked.bomb ? 0 : Math.floor(wager * picked.mult);
      const net = payout - wager;
      debitBalance(fresh, wager); fresh.balance += payout;
      fresh.games += 1;
      if (net > 0) {
        fresh.wins += 1;
        fresh.earned += net;
      } else if (net < 0) {
        fresh.lost += -net;
      }
      const persisted = await persistUser(message.guild, message.author.id);
      output = persisted ? { payout, net, balance: fresh.balance } : { error: 'تعذر حفظ نتيجة الجولة.' };
    });

    if (output.error) {
      await sent.edit({ content: output.error, components: boxButtons(nonce, true) }).catch(() => {});
      return;
    }

    const content = picked.bomb
      ? `<@${message.author.id}> — الصندوق انفجر وخسرت ${money(wager)}`
      : output.net > 0
        ? `<@${message.author.id}> — x${picked.mult} • ربحت ${money(output.net)}`
        : output.net === 0
          ? `<@${message.author.id}> — عاد لك نفس المبلغ`
          : `<@${message.author.id}> — عاد ${money(output.payout)} • خسارة ${money(-output.net)}`;

    await sent.edit({
      content,
      files: [{ attachment: boxesCard(wager, list, pickedIndex, output.balance), name: `boxes-result-${nonce}.png` }],
      attachments: [],
      components: boxButtons(nonce, true),
      allowedMentions: { users: [message.author.id], repliedUser: true },
    }).catch((error) => console.error('[bank] boxes result edit failed:', error));
  });

  collector.on('end', async (_, reason) => {
    if (reason !== 'done') await sent.edit({ components: boxButtons(nonce, true) }).catch(() => {});
  });
}

function gridButtons(prefix, nonce, count, disabled = false, revealed = new Set()) {
  const rows = [];
  for (let start = 0; start < count; start += 3) {
    const row = new ActionRowBuilder();
    for (let i = start; i < Math.min(start + 3, count); i += 1) {
      const opened = revealed.has(i);
      row.addComponents(new ButtonBuilder()
        .setCustomId(`nlbank:${prefix}:${nonce}:${i}`)
        .setLabel(opened ? 'SAFE' : String(i + 1))
        .setStyle(opened ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(disabled || opened));
    }
    rows.push(row);
  }
  return rows;
}

async function mines(message, raw) {
  const state = getUser(message.guildId, message.author.id);
  const wager = parseAmount(raw, Math.min(state.balance, MAX_BET));
  if (!Number.isFinite(wager)) return replyUsage(message, 'الغام', ['الغام كامل', 'الغام نص', 'الغام ربع', 'الغام 5000']);

  let started = false;
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const fresh = getUser(message.guildId, message.author.id);
    const left = commandCooldownLeft(fresh, 'mines');
    if (left > 0) return replyInfo(message, 'الألغام غير متاحة', `الوقت الباقي ${formatDuration(left)}`);
    if (fresh.balance < wager) return replyInfo(message, 'رصيد غير كافٍ', `رصيدك ${money(fresh.balance)}`);
    setCommandCooldown(fresh, 'mines');
    started = await persistUser(message.guild, message.author.id);
  });
  if (!started) return;

  const cells = Array(9).fill('safe');
  const mineIndexes = new Set();
  while (mineIndexes.size < 2) mineIndexes.add(Math.floor(Math.random() * 9));
  for (const i of mineIndexes) cells[i] = 'mine';

  const nonce = crypto.randomBytes(4).toString('hex');
  const revealed = new Set();
  const sent = await replyImage(message, minesCard(wager, cells, [], null, null, 0), `mines-${nonce}.png`, `<@${message.author.id}> — افتح 3 خانات آمنة`, gridButtons('mine', nonce, 9, false, revealed));
  const collector = sent.createMessageComponentCollector({ time: 60_000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) return interaction.reply({ content:'هذه الجولة ليست لك.', ephemeral:true }).catch(()=>{});
    const picked = Number(interaction.customId.split(':')[3]);
    if (revealed.has(picked)) return interaction.deferUpdate().catch(()=>{});
    await interaction.deferUpdate().catch(()=>{});

    if (cells[picked] === 'mine') {
      collector.stop('done');
      let result;
      await withLock(accountLockKey(message.guildId, message.author.id), async () => {
        const fresh = getUser(message.guildId, message.author.id);
        if (fresh.balance < wager) { result={error:'رصيدك أصبح أقل من مبلغ الجولة.'}; return; }
        debitBalance(fresh, wager); fresh.games += 1; fresh.lost += wager;
        result = await persistUser(message.guild,message.author.id) ? {balance:fresh.balance} : {error:'تعذر حفظ الجولة.'};
      });
      if (result.error) return sent.edit({content:result.error,components:gridButtons('mine',nonce,9,true,revealed)}).catch(()=>{});
      await sent.edit({
        content:`<@${message.author.id}> — لغم! خسرت ${money(wager)}`,
        files:[{attachment:minesCard(wager,cells,[...revealed,picked],'loss',result.balance,revealed.size),name:`mines-result-${nonce}.png`}],
        attachments:[],components:gridButtons('mine',nonce,9,true,revealed),allowedMentions:{users:[message.author.id],repliedUser:true}
      }).catch(()=>{});
      return;
    }

    revealed.add(picked);
    if (revealed.size >= 3) {
      collector.stop('done');
      let result;
      await withLock(accountLockKey(message.guildId,message.author.id), async()=>{
        const fresh=getUser(message.guildId,message.author.id);
        if(fresh.balance<wager){result={error:'رصيدك أصبح أقل من مبلغ الجولة.'};return;}
        const payout=Math.floor(wager*2.2),net=payout-wager;
        debitBalance(fresh,wager);fresh.balance+=payout;fresh.games+=1;fresh.wins+=1;fresh.earned+=net;
        result=await persistUser(message.guild,message.author.id)?{balance:fresh.balance,net}:{error:'تعذر حفظ الجولة.'};
      });
      if(result.error)return sent.edit({content:result.error,components:gridButtons('mine',nonce,9,true,revealed)}).catch(()=>{});
      await sent.edit({
        content:`<@${message.author.id}> — نجوت من 3 خانات وربحت ${money(result.net)}`,
        files:[{attachment:minesCard(wager,cells,[...revealed],'win',result.balance,3),name:`mines-win-${nonce}.png`}],
        attachments:[],components:gridButtons('mine',nonce,9,true,revealed),allowedMentions:{users:[message.author.id],repliedUser:true}
      }).catch(()=>{});
      return;
    }

    await sent.edit({
      files:[{attachment:minesCard(wager,cells,[...revealed],null,null,revealed.size),name:`mines-progress-${nonce}.png`}],
      attachments:[],components:gridButtons('mine',nonce,9,false,revealed)
    }).catch(()=>{});
  });
  collector.on('end',async(_,reason)=>{if(reason!=='done') await sent.edit({components:gridButtons('mine',nonce,9,true,revealed)}).catch(()=>{});});
}

function fruitButtons(nonce, board, revealed, disabled=false) {
  const rows=[];
  for(let start=0;start<14;start+=5){
    const row=new ActionRowBuilder();
    for(let i=start;i<Math.min(start+5,14);i+=1){
      const open=revealed.has(i);
      row.addComponents(new ButtonBuilder()
        .setCustomId(`nlbank:fruit:${nonce}:${i}`)
        .setLabel(open ? board[i] : '?')
        .setStyle(open ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(disabled || open));
    }
    rows.push(row);
  }
  return rows;
}

async function fruits(message) {
  let started=false;
  await withLock(accountLockKey(message.guildId,message.author.id),async()=>{
    const fresh=getUser(message.guildId,message.author.id);
    const left=commandCooldownLeft(fresh,'fruits');
    if(left>0)return replyInfo(message,'الفواكه غير متاحة',`الوقت الباقي ${formatDuration(left)}`);
    setCommandCooldown(fresh,'fruits');
    started=await persistUser(message.guild,message.author.id);
  });
  if(!started)return;

  const symbols=['🍒','🍑','🍎','🍓','🍋','🍇','🍉'];
  const board=[...symbols,...symbols];
  for(let i=board.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[board[i],board[j]]=[board[j],board[i]];}
  const revealed=new Set();
  const nonce=crypto.randomBytes(4).toString('hex');
  const maxPicks=10;
  const sent=await replyImage(message,fruitGameCard(0,0,maxPicks,null,null),`fruits-${nonce}.png`,`<@${message.author.id}> — اجمع 3 أزواج قبل انتهاء المحاولات`,fruitButtons(nonce,board,revealed));
  const collector=sent.createMessageComponentCollector({time:90_000});

  collector.on('collect',async interaction=>{
    if(interaction.user.id!==message.author.id)return interaction.reply({content:'هذه الجولة ليست لك.',ephemeral:true}).catch(()=>{});
    const picked=Number(interaction.customId.split(':')[3]);
    if(revealed.has(picked))return interaction.deferUpdate().catch(()=>{});
    revealed.add(picked);await interaction.deferUpdate().catch(()=>{});
    const counts={};for(const i of revealed)counts[board[i]]=(counts[board[i]]||0)+1;
    const pairs=Object.values(counts).filter(n=>n>=2).length;
    const picks=revealed.size;
    const won=pairs>=3;
    const over=won||picks>=maxPicks;

    if(over){
      collector.stop('done');
      let reward=0,balance;
      await withLock(accountLockKey(message.guildId,message.author.id),async()=>{
        const fresh=getUser(message.guildId,message.author.id);fresh.games+=1;
        if(won){reward=25000+Math.floor(Math.random()*25001);fresh.balance+=reward;fresh.earned+=reward;fresh.wins+=1;}
        balance=fresh.balance;await persistUser(message.guild,message.author.id);
      });
      await sent.edit({
        content:won?`<@${message.author.id}> — اكتملت 3 أزواج وربحت ${money(reward)}`:`<@${message.author.id}> — انتهت المحاولات`,
        files:[{attachment:fruitGameCard(picks,pairs,maxPicks,reward,balance,won),name:`fruits-result-${nonce}.png`}],
        attachments:[],components:fruitButtons(nonce,board,revealed,true),allowedMentions:{users:[message.author.id],repliedUser:true}
      }).catch(()=>{});
      return;
    }

    await sent.edit({
      files:[{attachment:fruitGameCard(picks,pairs,maxPicks,null,null),name:`fruits-progress-${nonce}.png`}],
      attachments:[],components:fruitButtons(nonce,board,revealed,false)
    }).catch(()=>{});
  });
  collector.on('end',async(_,reason)=>{if(reason!=='done')await sent.edit({components:fruitButtons(nonce,board,revealed,true)}).catch(()=>{});});
}

function colorButtons(nonce, disabled=false) {
  return [new ActionRowBuilder().addComponents(
    ...['أحمر','أزرق','أخضر','ذهبي'].map((label,i)=>new ButtonBuilder().setCustomId(`nlbank:color:${nonce}:${i}`).setLabel(label).setStyle([ButtonStyle.Danger,ButtonStyle.Primary,ButtonStyle.Success,ButtonStyle.Secondary][i]).setDisabled(disabled))
  )];
}

async function colors(message) {
  let started=false;
  await withLock(accountLockKey(message.guildId,message.author.id),async()=>{
    const fresh=getUser(message.guildId,message.author.id);const left=commandCooldownLeft(fresh,'colors');
    if(left>0)return replyInfo(message,'الألوان غير متاحة',`الوقت الباقي ${formatDuration(left)}`);
    setCommandCooldown(fresh,'colors');started=await persistUser(message.guild,message.author.id);
  });
  if(!started)return;
  const nonce=crypto.randomBytes(4).toString('hex'), names=['red','blue','green','gold'];
  const target=names[Math.floor(Math.random()*names.length)];
  const sent=await replyImage(message,colorsCard(0,target),`colors-${nonce}.png`,`<@${message.author.id}> — اختر اللون`,colorButtons(nonce));
  const collector=sent.createMessageComponentCollector({time:45000});
  collector.on('collect',async interaction=>{
    if(interaction.user.id!==message.author.id)return interaction.reply({content:'هذه الجولة ليست لك.',ephemeral:true}).catch(()=>{});
    collector.stop('done');await interaction.deferUpdate().catch(()=>{});
    const picked=names[Number(interaction.customId.split(':')[3])],won=picked===target;let balance,reward=0;
    await withLock(accountLockKey(message.guildId,message.author.id),async()=>{const fresh=getUser(message.guildId,message.author.id);fresh.games+=1;if(won){reward=7500;fresh.balance+=reward;fresh.earned+=reward;fresh.wins+=1;}balance=fresh.balance;await persistUser(message.guild,message.author.id);});
    await sent.edit({content:won?`<@${message.author.id}> — اختيار صحيح +${money(reward)}`:`<@${message.author.id}> — اختيار خاطئ`,files:[{attachment:colorsCard(0,target,picked,won,balance,reward),name:`colors-result-${nonce}.png`}],attachments:[],components:colorButtons(nonce,true),allowedMentions:{users:[message.author.id],repliedUser:true}}).catch(()=>{});
  });
  collector.on('end',async(_,reason)=>{if(reason!=='done')await sent.edit({components:colorButtons(nonce,true)}).catch(()=>{});});
}

function choiceButtons(prefix, nonce, labels, disabled=false) {
  return [new ActionRowBuilder().addComponents(...labels.map((label,i)=>new ButtonBuilder().setCustomId(`nlbank:${prefix}:${nonce}:${i}`).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled)))];
}

async function coin(message) {
  let started=false;
  await withLock(accountLockKey(message.guildId,message.author.id),async()=>{const fresh=getUser(message.guildId,message.author.id);const left=commandCooldownLeft(fresh,'coin');if(left>0)return replyInfo(message,'العملة غير متاحة',`الوقت الباقي ${formatDuration(left)}`);setCommandCooldown(fresh,'coin');started=await persistUser(message.guild,message.author.id);});
  if(!started)return;
  const nonce=crypto.randomBytes(4).toString('hex'),labels=['وجه','كتابة'];
  const sent=await message.reply({content:`🪙 <@${message.author.id}> — اختر وجه أو كتابة`,components:choiceButtons('coin',nonce,labels),allowedMentions:{users:[message.author.id],repliedUser:true}});
  const collector=sent.createMessageComponentCollector({time:45000});
  collector.on('collect',async interaction=>{
    if(interaction.user.id!==message.author.id)return interaction.reply({content:'هذه الجولة ليست لك.',ephemeral:true}).catch(()=>{});
    collector.stop('done');await interaction.deferUpdate().catch(()=>{});
    const side=Number(interaction.customId.split(':')[3])===0?'heads':'tails',result=Math.random()<.5?'heads':'tails',won=side===result;let balance,reward=0;
    await withLock(accountLockKey(message.guildId,message.author.id),async()=>{const fresh=getUser(message.guildId,message.author.id);fresh.games+=1;if(won){reward=5000;fresh.balance+=reward;fresh.earned+=reward;fresh.wins+=1;}balance=fresh.balance;await persistUser(message.guild,message.author.id);});
    await sent.edit({content:won?`<@${message.author.id}> — ربحت ${money(reward)}`:`<@${message.author.id}> — خسرت الجولة بدون خصم`,files:[{attachment:coinCard(0,side,result,won,balance,reward),name:`coin-${nonce}.png`}],attachments:[],components:choiceButtons('coin',nonce,labels,true),allowedMentions:{users:[message.author.id],repliedUser:true}}).catch(()=>{});
  });
  collector.on('end',async(_,reason)=>{if(reason!=='done')await sent.edit({components:choiceButtons('coin',nonce,labels,true)}).catch(()=>{});});
}

async function numberGuess(message, raw) {
  const state=getUser(message.guildId,message.author.id), wager=parseAmount(raw,Math.min(state.balance,MAX_BET));
  if(!Number.isFinite(wager))return replyUsage(message,'رقم',['رقم كامل','رقم نص','رقم ربع','رقم 5000']);
  const nonce=crypto.randomBytes(4).toString('hex'),labels=['1','2','3','4','5'];
  const sent=await message.reply({content:`🔢 <@${message.author.id}> — اختر رقماً من 1 إلى 5`,components:choiceButtons('number',nonce,labels),allowedMentions:{parse:[]}});
  const collector=sent.createMessageComponentCollector({time:45000});
  collector.on('collect',async interaction=>{
    if(interaction.user.id!==message.author.id)return interaction.reply({content:'هذه الجولة ليست لك.',ephemeral:true}).catch(()=>{});
    collector.stop('done');await interaction.deferUpdate().catch(()=>{});
    const picked=Number(interaction.customId.split(':')[3])+1,result=1+Math.floor(Math.random()*5);let output;
    await withLock(accountLockKey(message.guildId,message.author.id),async()=>{const fresh=getUser(message.guildId,message.author.id);const left=commandCooldownLeft(fresh,'number');if(left>0){output={error:`الوقت الباقي ${formatDuration(left)}`};return;}if(fresh.balance<wager){output={error:'رصيد غير كافٍ'};return;}const won=picked===result,payout=won?wager*4:0,net=payout-wager;debitBalance(fresh,wager);fresh.balance+=payout;fresh.games+=1;if(won){fresh.wins+=1;fresh.earned+=net;}else fresh.lost+=wager;setCommandCooldown(fresh,'number');output=await persistUser(message.guild,message.author.id)?{won,balance:fresh.balance}:{error:'تعذر الحفظ'};});
    if(output.error)return sent.edit({content:output.error,components:choiceButtons('number',nonce,labels,true)}).catch(()=>{});
    await sent.edit({content:`<@${message.author.id}> — ${output.won?`ربحت ${money(wager*3)}`:`خسرت ${money(wager)}`}`,files:[{attachment:numberGuessCard(wager,picked,result,output.won,output.balance),name:`number-${nonce}.png`}],attachments:[],components:choiceButtons('number',nonce,labels,true),allowedMentions:{parse:[]}}).catch(()=>{});
  });
  collector.on('end',async(_,reason)=>{if(reason!=='done') await sent.edit({components:choiceButtons('number',nonce,labels,true)}).catch(()=>{});});
}

async function stock(message) {
  await withLock(marketLockKey(message.guildId), async () => {
    const { market, changed } = updateMarket(message.guildId);
    if (changed && !await persistMarket(message.guild)) {
      await replyInfo(message, 'تعذر تحديث السوق', 'جرّب مرة ثانية');
      return;
    }
    const next = Math.max(0, market.updatedAt + MARKET_STEP - Date.now());
    await replyImage(message, marketCard(market, STOCK_COMPANIES, next), `market-${message.guildId}.png`, '📈 سوق Neverless الحالي');
  });
}

async function tradeStockByValue(message, action, companyRaw, amountRaw) {
  const company = companyFrom(companyRaw);
  if (!company) {
    await replyInfo(message, 'شركة غير موجودة', 'اكتب سهم لعرض الشركات المتاحة');
    return;
  }
  await withLocks([marketLockKey(message.guildId), accountLockKey(message.guildId, message.author.id)], async () => {
    const { market, changed } = updateMarket(message.guildId);
    const state = getUser(message.guildId, message.author.id);
    const price = market.companies[company.code].price;
    const owned = holdingUnits(state, company.code);
    let total;
    let units;
    if (action === 'buy') {
      const available = Math.max(0, Math.floor(Number(state.balance) || 0));
      if (available <= 0) {
        await replyInfo(message, 'رصيد غير كافٍ', 'رصيدك المتاح للشراء هو $0');
        return;
      }
      total = parseAmount(amountRaw, available);
      if (!Number.isFinite(total)) {
        await replyUsage(message, `شراء ${company.code}`, [`شراء ${company.code} كامل`, `شراء ${company.code} نص`, `شراء ${company.code} ربع`, `شراء ${company.code} 5000`]);
        return;
      }
      units = total / price;
      const oldBasis = Number(state.stockBasis?.[company.code] || price);
      const newOwned = owned + units;
      if (!state.stockBasis) state.stockBasis = {};
      state.stockBasis[company.code] = newOwned > 0 ? ((oldBasis * owned) + total) / newOwned : price;
      debitBalance(state, total);
      setHoldingUnits(state, company.code, newOwned);
    } else {
      const ownedValue = owned * price;
      total = parseAmount(amountRaw, ownedValue);
      if (ownedValue <= 0) {
        await replyInfo(message, 'لا تملك أسهماً', `لا تملك أسهم ${company.code}`);
        return;
      }
      if (!Number.isFinite(total)) {
        await replyUsage(message, `بيع ${company.code}`, [`بيع ${company.code} كامل`, `بيع ${company.code} نص`, `بيع ${company.code} ربع`, `بيع ${company.code} 5000`]);
        return;
      }
      units = total / price;
      const basis = Number(state.stockBasis?.[company.code] || price);
      const profit = total - (basis * units);
      setHoldingUnits(state, company.code, Math.max(0, owned - units));
      if (holdingUnits(state,company.code) <= 0 && state.stockBasis) delete state.stockBasis[company.code];
      state.balance += total;
      state.__lastStockProfit = profit;
    }

    const saved = Promise.all([
      persistUser(message.guild, message.author.id),
      changed ? persistMarket(message.guild) : Promise.resolve(true),
    ]).then(x => x.every(Boolean));
    await commitCard(
      message,
      saved,
      stockTradeCard(message.author, action, company, units, total, price, state, portfolioValue(state, market), action === 'sell' ? Number(state.__lastStockProfit || 0) : null),
      `stock-${action}-${company.code}-${message.author.id}.png`,
      `<@${message.author.id}> — ${action === 'buy' ? 'شراء' : 'بيع'} ${company.name} • ${money(total)}`,
    );
    delete state.__lastStockProfit;
  });
}

async function top(message, client) {
  await withLock(marketLockKey(message.guildId), async () => {
    const { market, changed } = updateMarket(message.guildId);
    const rows = [];
    for (const [accountKey, state] of users) {
      if (!accountKey.startsWith(`${message.guildId}:`)) continue;
      const userId = accountKey.slice(message.guildId.length + 1);
      rows.push({ userId, state, portfolio: portfolioValue(state, market), positions: Object.keys(state.stocks || {}).filter(code => holdingUnits(state, code) > 0).length, net: baseNetWorth(state, market) });
    }
    rows.sort((a, b) => b.net - a.net);

    const enriched = await Promise.all(rows.slice(0, 10).map(async (row) => {
      const user = client.users.cache.get(row.userId) || await client.users.fetch(row.userId).catch(() => null);
      return {
        ...row,
        user: user || { id: row.userId, username: `member-${row.userId.slice(-4)}`, globalName: null },
      };
    }));

    if (changed && !await persistMarket(message.guild)) {
      await replyInfo(message, 'تعذر تحديث الترتيب', 'جرّب مرة ثانية');
      return;
    }
    await replyImage(message, await topCard(enriched, market.price), `top-${message.guildId}.png`, '🏆 أغنى 10 أعضاء في Neverless Bank');
  });
}

async function richestId(guildId) {
  const market = normalizeMarketShape(markets.get(guildId) || newMarket());
  let best = null;
  for (const [accountKey,state] of users) {
    if (!accountKey.startsWith(`${guildId}:`)) continue;
    const id = accountKey.slice(guildId.length + 1);
    const net = baseNetWorth(state,market);
    if (!best || net > best.net) best = {id,net};
  }
  return best?.id || null;
}

async function protect(message, cancel = false) {
  await withLock(accountLockKey(message.guildId, message.author.id), async () => {
    const state = getUser(message.guildId, message.author.id);
    const now = Date.now();
    if (cancel) {
      state.protectionUntil = 0;
      await commitCard(message, persistUser(message.guild, message.author.id),
        economyEventCard(message.author, 'تم إلغاء الحماية', 0, state.balance, 'protect'),
        `protection-cancel-${message.author.id}.png`, `<@${message.author.id}> — تم إلغاء الحماية`);
      return;
    }
    if (state.protectionUntil > now) {
      await replyInfo(message, 'الحماية مفعلة', `الوقت المتبقي ${formatDuration(state.protectionUntil - now)}`);
      return;
    }
    state.protectionAt = now;
    state.protectionUntil = now + PROTECTION_DURATION;
    await commitCard(message, persistUser(message.guild, message.author.id),
      economyEventCard(message.author, 'حماية لمدة ساعة', 0, state.balance, 'protect'),
      `protection-${message.author.id}.png`, `<@${message.author.id}> — الحماية مفعلة لمدة ساعة`);
  });
}

async function rob(message) {
  const target = message.mentions.users.first();
  if (!target || target.bot || target.id === message.author.id) return replyInfo(message, 'طريقة الاستخدام', 'سرقة @member');
  await withLocks([accountLockKey(message.guildId, message.author.id), accountLockKey(message.guildId, target.id)], async () => {
    const thief = getUser(message.guildId, message.author.id);
    const victim = getUser(message.guildId, target.id);
    const left = commandCooldownLeft(thief, 'rob');
    if (left > 0) return replyInfo(message, 'السرقة غير متاحة', `الوقت الباقي ${formatDuration(left)}`);
    const { market } = updateMarket(message.guildId);
    if (await richestId(message.guildId) === target.id) return replyInfo(message, 'المركز الأول 👑', 'أغنى شخص في السيرفر محمي من السرقة');
    if (victim.protectionUntil > Date.now()) return replyInfo(message, 'العميل محمي', `العميل <@${target.id}> لديه حماية لمدة ${formatDuration(victim.protectionUntil - Date.now())}`, `<@${target.id}>`);
    setCommandCooldown(thief, 'rob');
    const available = Math.max(0, victim.balance);
    if (available < 1) { await persistUser(message.guild, message.author.id); return replyInfo(message, 'لا يوجد ما يسرق', 'رصيد العميل المتاح فارغ'); }
    const success = Math.random() < 0.52;
    const amount = Math.max(1, Math.min(available, Math.floor(available * (0.02 + Math.random() * 0.06))));
    if (success) { debitBalance(victim, amount); thief.balance += amount; thief.earned += amount; }
    else { const fine = Math.min(thief.balance, Math.max(1, Math.floor(amount * 0.35))); debitBalance(thief, fine); thief.lost += fine; }
    const saved = Promise.all([persistUser(message.guild, message.author.id), persistUser(message.guild, target.id)]).then(x => x.every(Boolean));
    const shown = success ? amount : Math.min(thief.lost, Math.max(1, Math.floor(amount * .35)));
    await commitCard(message, saved, economyEventCard(message.author, success ? 'سرقة ناجحة' : 'فشلت السرقة', shown, thief.balance, success ? 'good' : 'bad'),
      `rob-${message.author.id}.png`, success ? `<@${message.author.id}> سرق ${money(amount)} من <@${target.id}>` : `<@${message.author.id}> فشلت السرقة وتم تغريمه`);
  });
}

function isAdmin(message) { return Boolean(message.member?.permissions?.has?.(ADMIN_PERMISSION)); }

async function adminMoney(message, action, raw) {
  if (!isAdmin(message)) return replyInfo(message, 'غير مصرح', 'هذا الأمر للإدارة فقط');
  if (action === 'reset-server') {
    const ids = [...users.keys()].filter(k => k.startsWith(`${message.guildId}:`)).map(k => k.slice(message.guildId.length + 1));
    await Promise.all(ids.map(id => withLock(accountLockKey(message.guildId,id), async()=>{ const cleared = newUser(); cleared.balance = 0; users.set(key(message.guildId,id), cleared); return persistUser(message.guild,id); })));
    return replyInfo(message, 'تم التصفير', 'تم تصفير حسابات البنك في السيرفر', null);
  }
  const target = message.mentions.users.first();
  if (!target || target.bot) return replyInfo(message, 'طريقة الاستخدام', action === 'add' ? 'زيده 5000000 @member' : 'تصفير كامل @member');
  return withLock(accountLockKey(message.guildId,target.id), async()=>{
    const state=getUser(message.guildId,target.id);
    if(action==='add'){ const amount=parseAmount(raw, Number.MAX_SAFE_INTEGER); if(!Number.isFinite(amount)) return replyInfo(message,'مبلغ غير صالح','مثال: زيده 5000000 @member'); state.balance += amount; await commitCard(message,persistUser(message.guild,target.id),economyEventCard(target,'إضافة إدارية',amount,state.balance,'good'),`admin-add-${target.id}.png`,`<@${target.id}> — تمت إضافة ${money(amount)}`); }
    else { const cleared = newUser(); cleared.balance = 0; users.set(key(message.guildId,target.id),cleared); await commitCard(message,persistUser(message.guild,target.id),economyEventCard(target,'تصفير الحساب',0,0,'bad'),`admin-reset-${target.id}.png`,`<@${target.id}> — تم تصفير الحساب`); }
  });
}

async function sendBusinessImage(message,buffer,name,content,components=[]){return replyImage(message,buffer,name,content,components);}
async function projectCatalog(message){return sendBusinessImage(message,catalogCard(PROJECT_CATALOG),'projects.png','<@'+message.author.id+'> — المشاريع المتاحة');}
function projectUpgradeCost(b,p){return Math.round(p.cost*(.35+b.level*.2));}
function projectButtons(nonce,index,total,b,p,disabled=false){
 const nav=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:prev`).setLabel('السابق').setStyle(ButtonStyle.Secondary).setDisabled(disabled||total<2),
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:harvest`).setLabel('استلام الإنتاج').setStyle(ButtonStyle.Success).setDisabled(disabled),
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:next`).setLabel('التالي').setStyle(ButtonStyle.Secondary).setDisabled(disabled||total<2)
 );
 const upgrades=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:speed`).setLabel('تطوير السرعة').setStyle(ButtonStyle.Primary).setDisabled(disabled),
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:batch`).setLabel('تطوير الإنتاج').setStyle(ButtonStyle.Primary).setDisabled(disabled),
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:storage`).setLabel('توسعة المخزن').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  new ButtonBuilder().setCustomId(`nlbank:biz:${nonce}:line`).setLabel('خط إنتاج').setStyle(ButtonStyle.Secondary).setDisabled(disabled)
 );
 return [nav,upgrades];
}
function productionStatus(b,p){
 const capMs=Math.max(60000,(15*60*1000)/Math.max(1,Number(b.speed)||1)), elapsed=Math.max(0,Date.now()-Number(b.lastProduced||Date.now()));
 const ratio=Math.min(1,elapsed/capMs), cap=p.outputQty*Math.max(1,b.lines)*Math.max(1,b.batch);
 return {ready:Math.floor(cap*ratio),cap,next:Math.max(0,capMs-elapsed),rate:cap/15};
}
async function createProject(message,raw){
 const parts=String(raw||'').trim().split(/\s+/u); let project=null,used=0;
 for(let n=Math.min(3,parts.length);n>=1;n--){project=projectFrom(parts.slice(0,n).join(' '));if(project){used=n;break;}}
 if(!project)return projectCatalog(message);
 const customName=parts.slice(used).join(' ').trim()||project.name;
 return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id));
  if(state.businesses.length>=6)return replyInfo(message,'حد المشاريع','لديك الحد الحالي 6 مشاريع');
  if(state.balance<project.cost)return replyInfo(message,'رصيد غير كافٍ','تكلفة الإنشاء '+money(project.cost));
  debitBalance(state,project.cost);
  const b={id:crypto.randomBytes(4).toString('hex'),type:project.code,name:customName,level:1,lines:1,storageSlots:12,quality:1,speed:1,batch:1,lastProduced:Date.now(),revenue:0,expenses:project.cost};
  state.businesses.push(b);
  state.inventory[project.output]=Number(state.inventory[project.output]||0)+project.outputQty;
  await persistUser(message.guild,message.author.id);
  return myProjects(message,state.businesses.length-1,'افتتاح المشروع • حصلت على '+project.outputQty+' '+project.outputName);
 });
}
function businessByName(state,raw){const q=String(raw||'').trim().toLowerCase();return state.businesses.find(b=>String(b.name||'').toLowerCase()===q||b.id===q)||null;}
async function harvestBusiness(message,b){
 return withLock(accountLockKey(message.guildId,message.author.id),async()=>{
  const state=normalizeBusinessState(getUser(message.guildId,message.author.id)),fresh=state.businesses.find(x=>x.id===b.id);if(!fresh)return {error:'المشروع غير موجود'};
  const p=PROJECT_CATALOG[fresh.type],ps=productionStatus(fresh,p);if(ps.ready<1)return {error:'لا يوجد إنتاج جاهز بعد • '+formatDuration(ps.next)};
  const multiplier=ps.ready/Math.max(1,p.outputQty);
  for(const [code,q] of Object.entries(p.inputs)){const need=Math.max(1,Math.ceil(q*multiplier));if(Number(state.inventory[code]||0)<need)return {error:'مواد ناقصة • تحتاج '+need+' '+PRODUCT_CATALOG[code].name};}
  for(const [code,q] of Object.entries(p.inputs))state.inventory[code]=Math.max(0,Number(state.inventory[code]||0)-Math.max(1,Math.ceil(q*multiplier)));
  state.inventory[p.output]=Number(state.inventory[p.output]||0)+ps.ready;fresh.lastProduced=Date.now();fresh.expenses+=Math.max(1,Math.round(p.cost*.0005*ps.ready));
  await persistUser(message.guild,message.author.id);return {qty:ps.ready,b:fresh,p};
 });
}
async function upgradeBusinessButton(message,b,kind){
 return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id)),fresh=state.businesses.find(x=>x.id===b.id);if(!fresh)return {error:'المشروع غير موجود'};const p=PROJECT_CATALOG[fresh.type],cost=projectUpgradeCost(fresh,p);if(state.balance<cost)return {error:'تحتاج '+money(cost)+' للتطوير'};
 debitBalance(state,cost);fresh.expenses+=cost;fresh.level++;if(kind==='speed')fresh.speed=Number((fresh.speed+.25).toFixed(2));else if(kind==='batch')fresh.batch++;else if(kind==='storage')fresh.storageSlots+=4;else fresh.lines++;
 await persistUser(message.guild,message.author.id);return {b:fresh,p,cost};});
}
async function myProjects(message,startIndex=0,note=''){
 const state=normalizeBusinessState(getUser(message.guildId,message.author.id));if(!state.businesses.length)return projectCatalog(message);
 let index=Math.max(0,Math.min(state.businesses.length-1,Number(startIndex)||0)),b=state.businesses[index],p=PROJECT_CATALOG[b.type],nonce=crypto.randomBytes(4).toString('hex');
 const render=()=>businessCard(b,p,state.inventory,{...productionStatus(b,p),index,total:state.businesses.length,upgradeCost:projectUpgradeCost(b,p)});
 const sent=await sendBusinessImage(message,render(),'my-project.png','<@'+message.author.id+'> — '+(note||`مشروع ${index+1} من ${state.businesses.length}`),projectButtons(nonce,index,state.businesses.length,b,p));
 const collector=sent.createMessageComponentCollector({time:180000});
 collector.on('collect',async interaction=>{if(interaction.user.id!==message.author.id)return interaction.reply({content:'هذه المشاريع ليست لك.',ephemeral:true}).catch(()=>{});await interaction.deferUpdate().catch(()=>{});
  const action=interaction.customId.split(':')[3];
  if(action==='prev'||action==='next'){index=(index+(action==='next'?1:-1)+state.businesses.length)%state.businesses.length;b=state.businesses[index];p=PROJECT_CATALOG[b.type];}
  else if(action==='harvest'){const out=await harvestBusiness(message,b);if(out.error){await interaction.followUp({content:out.error,ephemeral:true}).catch(()=>{});}else{b=out.b;p=out.p;}}
  else {const out=await upgradeBusinessButton(message,b,action);if(out.error){await interaction.followUp({content:out.error,ephemeral:true}).catch(()=>{});}else{b=out.b;p=out.p;}}
  await sent.edit({content:`<@${message.author.id}> — مشروع ${index+1} من ${state.businesses.length}`,files:[{attachment:render(),name:'my-project.png'}],attachments:[],components:projectButtons(nonce,index,state.businesses.length,b,p),allowedMentions:{users:[message.author.id],repliedUser:true}}).catch(()=>{});
 });
 collector.on('end',()=>sent.edit({components:projectButtons(nonce,index,state.businesses.length,b,p,true)}).catch(()=>{}));return sent;
}
async function projectsSummary(message){const state=normalizeBusinessState(getUser(message.guildId,message.author.id));if(!state.businesses.length)return projectCatalog(message);return sendBusinessImage(message,projectsSummaryCard(state.businesses,PROJECT_CATALOG),'projects-summary.png','<@'+message.author.id+'> — ملخص مشاريعك');}
async function produce(message,raw){const state=normalizeBusinessState(getUser(message.guildId,message.author.id)),b=businessByName(state,raw)||state.businesses[0];if(!b)return projectCatalog(message);const out=await harvestBusiness(message,b);if(out.error)return replyInfo(message,'الإنتاج',out.error);return sendBusinessImage(message,businessCard(out.b,out.p,state.inventory,{...productionStatus(out.b,out.p),index:0,total:state.businesses.length,upgradeCost:projectUpgradeCost(out.b,out.p)}),'production.png','<@'+message.author.id+'> — تم استلام '+out.qty+' '+out.p.outputName);}
async function upgradeProject(message,raw){const state=normalizeBusinessState(getUser(message.guildId,message.author.id)),words=String(raw||'').trim().split(/\s+/u),kind=words.shift()||'',b=businessByName(state,words.join(' '))||state.businesses[0];if(!b)return projectCatalog(message);const map=/سرعة/u.test(kind)?'speed':/كمية|دفعة/u.test(kind)?'batch':/خانات|مخزن/u.test(kind)?'storage':'line';const out=await upgradeBusinessButton(message,b,map);if(out.error)return replyInfo(message,'تعذر التطوير',out.error);return myProjects(message,state.businesses.findIndex(x=>x.id===b.id),'تم التطوير مقابل '+money(out.cost));}
async function inventory(message){const state=normalizeBusinessState(getUser(message.guildId,message.author.id));return sendBusinessImage(message,inventoryCard(state.inventory,PRODUCT_CATALOG),'inventory.png','<@'+message.author.id+'> — مخزني');}
async function npcStore(message){const snap=npcSnapshot();return sendBusinessImage(message,npcStoreCard(snap.rows,snap.next),'npc-store.png','<@'+message.author.id+'> — متجر المواد الأولية');}
async function buyNpc(message,raw){const m=String(raw||'').trim().match(/^(.+?)\s+(\d+)$/u);if(!m)return replyUsage(message,'شراء NPC',['شراء npc علف 10','شراء npc قمح 20']);const item=productFrom(m[1]),qty=Math.floor(Number(m[2]));if(!item||qty<1)return replyInfo(message,'طلب غير صالح','حدد المنتج والكمية');const snap=npcSnapshot(),row=snap.rows.find(x=>x.code===item.code);if(!row||qty>row.qty)return replyInfo(message,'الكمية غير متوفرة','المتاح الآن '+(row?.qty||0));
 return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id)),total=row.price*qty;if(state.balance<total)return replyInfo(message,'رصيد غير كافٍ','قيمة الطلب '+money(total));debitBalance(state,total);state.inventory[item.code]=Number(state.inventory[item.code]||0)+qty;await persistUser(message.guild,message.author.id);return replyInfo(message,'تم الشراء',qty+' '+item.name+' • '+money(total));});}
async function createStore(message,name){return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id));if(state.store.name)return replyInfo(message,'لديك متجر','متجرك الحالي: '+state.store.name);const cost=100000;if(state.balance<cost)return replyInfo(message,'رصيد غير كافٍ','إنشاء المتجر يكلف '+money(cost));debitBalance(state,cost);state.store={name:String(name||'').trim().slice(0,32)||('Store '+message.author.username),slots:3,listings:[],revenue:0,expenses:cost,sales:0};await persistUser(message.guild,message.author.id);return viewStore(message,message.author.id);});}
async function viewStore(message,userId){const state=normalizeBusinessState(getUser(message.guildId,userId));if(!state.store.name)return replyInfo(message,'لا يوجد متجر','هذا العضو لم ينشئ متجراً');let owner=message.guild.members.cache.get(userId)?.user;if(!owner)owner=await message.client.users.fetch(userId).catch(()=>null);return sendBusinessImage(message,storeCard(owner?.globalName||owner?.username||'Member',state.store,state.store.listings,PRODUCT_CATALOG),'store.png','<@'+message.author.id+'> — '+state.store.name);}
async function listProduct(message,raw){return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id));if(!state.store.name)return replyInfo(message,'أنشئ متجراً أولاً','إنشاء متجر اسم المتجر');const m=String(raw||'').trim().match(/^(.+?)\s+(\d+)\s+(\d+)$/u);if(!m)return replyUsage(message,'عرض منتج',['عرض بيض 5 100']);const item=productFrom(m[1]),qty=Math.floor(Number(m[2])),price=Math.floor(Number(m[3]));if(!item||qty<1||price<1)return replyInfo(message,'بيانات غير صالحة','حدد المنتج والكمية وسعر الوحدة');if(Number(state.inventory[item.code]||0)<qty)return replyInfo(message,'كمية غير كافية','المنتج غير متوفر بهذه الكمية');const old=state.store.listings.find(l=>l.code===item.code);if(!old&&state.store.listings.length>=state.store.slots)return replyInfo(message,'خانات المتجر ممتلئة','اشترِ خانة متجر إضافية');state.inventory[item.code]-=qty;if(old){old.qty+=qty;old.price=price;}else state.store.listings.push({code:item.code,qty,price});await persistUser(message.guild,message.author.id);return viewStore(message,message.author.id);});}
async function buyListing(message,sellerUser,raw){const m=String(raw||'').trim().match(/^(.+?)\s+(\d+)$/u);if(!sellerUser||!m)return replyUsage(message,'شراء من متجر',['شراء من متجر @member بيض 2']);const item=productFrom(m[1]),qty=Math.floor(Number(m[2]));if(!item||qty<1)return replyInfo(message,'طلب غير صالح','حدد المنتج والكمية');return withLocks([accountLockKey(message.guildId,message.author.id),accountLockKey(message.guildId,sellerUser.id)],async()=>{const buyer=normalizeBusinessState(getUser(message.guildId,message.author.id)),seller=normalizeBusinessState(getUser(message.guildId,sellerUser.id));const l=seller.store.listings.find(x=>x.code===item.code);if(!l||l.qty<qty)return replyInfo(message,'غير متوفر','الكمية المطلوبة غير موجودة');const total=l.price*qty;if(buyer.balance<total)return replyInfo(message,'رصيد غير كافٍ','قيمة الطلب '+money(total));debitBalance(buyer,total);seller.balance+=total;buyer.inventory[item.code]=Number(buyer.inventory[item.code]||0)+qty;l.qty-=qty;if(l.qty<=0)seller.store.listings=seller.store.listings.filter(x=>x!==l);seller.store.revenue+=total;seller.store.sales++;seller.earned+=total;await Promise.all([persistUser(message.guild,message.author.id),persistUser(message.guild,sellerUser.id)]);return replyInfo(message,'تم الشراء',qty+' '+item.name+' مقابل '+money(total));});}
async function expandStore(message){return withLock(accountLockKey(message.guildId,message.author.id),async()=>{const state=normalizeBusinessState(getUser(message.guildId,message.author.id));if(!state.store.name)return replyInfo(message,'لا يوجد متجر','أنشئ متجراً أولاً');const cost=50000*Math.pow(2,state.store.slots-3);if(state.balance<cost)return replyInfo(message,'رصيد غير كافٍ','الخانة الجديدة '+money(cost));debitBalance(state,cost);state.store.slots++;state.store.expenses+=cost;await persistUser(message.guild,message.author.id);return replyInfo(message,'تمت التوسعة','خانات متجرك الآن '+state.store.slots+' • التكلفة '+money(cost));});}
async function businessIncome(message){const state=normalizeBusinessState(getUser(message.guildId,message.author.id));return sendBusinessImage(message,incomeCard(state.store,state.businesses),'business-income.png','<@'+message.author.id+'> — تقرير أعمالك');}

function normalized(content) {
  return digits(content)
    .trim()
    .replace(/^[-#]+\s*/u, '')
    .replace(/^<@!?\d{15,22}>\s*/u, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function handleBankMessage(message, client) {
  if (String(process.env.BANK_ACTIVE || '0') !== '1') return false;
  if (!message?.guildId || message.author?.bot || !BANK_CHANNELS.has(message.channelId)) return false;
  const text = normalized(message.content);
  if (!text) return false;

  const known = /^(?:حماية|الغاء حماية|إلغاء حماية|سرقة|سرقه|زيده|تصفير كامل السيرفر|تصفير كامل|تصفير|اوامر|أوامر|bank|bank help|رصيد|رصيدي|balance|bal|بروفايل|profile|محفظة|wallet|ثروتي|وقت|cooldowns?|راتب|salary|daily|بخشيش|tip|قرض|loan|تسديد قرض|سداد قرض|مشاريع|مشاريعي|مشروعي|إنشاء مشروع|انشاء مشروع|إنتاج|انتاج|تطوير مشروع|مخزني|إنشاء متجر|انشاء متجر|متجر المواد|npc|متجر npc|متجر|عرض|شراء npc|شراء من متجر|توسعة متجر|دخل المتجر|توب|top|سهم|اسهم|أسهم|stock|تحويل|transfer|ايداع|إيداع|deposit|سحب|withdraw|رهان|bet|استثمار|invest|نرد|dice|قمار|gamble|تداول|تدوال|trade|روليت|roulette|هايلو|هاي لو|hilo|صناديق|boxes|شراء سهم|شراء اسهم|شراء أسهم|buy|بيع سهم|بيع اسهم|بيع أسهم|sell|ممتلكات|عقار|عقارات|سيارة|سياره|سيارات|طائرة|طائره|طيارة|طياره|طائرات|ذهب|gold|شراء|بيع|الغام|ألغام|mines|فواكه|fruits|الوان|ألوان|colors|عملة|coin|رقم|number)(?:\s|$)/u.test(text);
  if (!known) return false;

  try {
    await ensureLoaded(message.guild);

    if (/^(?:اوامر|أوامر|bank|bank help)$/u.test(text)) {
      await message.reply({
        content: `<@${message.author.id}>`,
        embeds: [helpEmbed()],
        allowedMentions: { repliedUser: true, users: [message.author.id] },
      });
      return true;
    }
    if (/^(?:رصيد|رصيدي|balance|bal|بروفايل|profile|محفظة|wallet|ثروتي)(?:\s|$)/u.test(text)) {
      await balance(message);
      return true;
    }
    if (/^(?:وقت|cooldowns?)$/u.test(text)) {
      await message.reply({
        content: `<@${message.author.id}>`,
        embeds: [cooldownEmbed(message.author, getUser(message.guildId, message.author.id))],
        allowedMentions: { repliedUser: true, users: [message.author.id] },
      });
      return true;
    }
    if (/^(?:راتب|salary|daily)$/u.test(text)) {
      await income(message, 'salary');
      return true;
    }
    if (/^(?:بخشيش|tip)$/u.test(text)) {
      await income(message, 'tip');
      return true;
    }
    if (/^(?:قرض|loan)$/u.test(text)) {
      await loan(message);
      return true;
    }
    let loanRepay = text.match(/^(?:تسديد قرض|سداد قرض)(?:\s+(.+))?$/u);
    if (loanRepay) {
      await repayLoan(message, loanRepay[1] || 'كامل');
      return true;
    }
if (/^(?:مشاريع)$/u.test(text)) { await projectCatalog(message); return true; }
    if (/^(?:مشاريعي)$/u.test(text)) { await projectsSummary(message); return true; }
    let bm=text.match(/^(?:إنشاء مشروع|انشاء مشروع)\s+(.+)$/u); if(bm){await createProject(message,bm[1]);return true;}
    if (/^(?:مشروعي)$/u.test(text)) { await myProjects(message); return true; }
    if (/^(?:متجر المواد|متجر npc|npc)$/u.test(text)){await npcStore(message);return true;}
    bm=text.match(/^شراء npc\s+(.+)$/u);if(bm){await buyNpc(message,bm[1]);return true;}
    bm=text.match(/^(?:إنتاج|انتاج)(?:\s+(.+))?$/u); if(bm){await produce(message,bm[1]||'');return true;}
    bm=text.match(/^تطوير مشروع\s+(سرعة|كمية|دفعة|خانات|مخزن|جودة|خطوط)(?:\s+(.+))?$/u);if(bm){await upgradeProject(message,bm[1]+' '+(bm[2]||''));return true;}
    if (/^مخزني$/u.test(text)){await inventory(message);return true;}
    bm=text.match(/^(?:إنشاء متجر|انشاء متجر)\s+(.+)$/u);if(bm){await createStore(message,bm[1]);return true;}
    if(/^متجر$/u.test(text)){await viewStore(message,message.author.id);return true;}
    if(/^متجر\s+<@!?\d{15,22}>$/u.test(text)){await viewStore(message,message.mentions.users.first().id);return true;}
    bm=text.match(/^عرض\s+(.+)$/u);if(bm){await listProduct(message,bm[1]);return true;}
    bm=text.match(/^شراء من متجر\s+<@!?\d{15,22}>\s+(.+)$/u);if(bm){await buyListing(message,message.mentions.users.first(),bm[1]);return true;}
    if(/^توسعة متجر$/u.test(text)){await expandStore(message);return true;}
    if(/^دخل المتجر$/u.test(text)){await businessIncome(message);return true;}
    if (/^(?:حماية)$/u.test(text)) { await protect(message, false); return true; }
    if (/^(?:الغاء حماية|إلغاء حماية)$/u.test(text)) { await protect(message, true); return true; }
    if (/^(?:سرقة|سرقه)\s+<@!?\d{15,22}>$/u.test(text)) { await rob(message); return true; }
    let adminMatch = text.match(/^زيده\s+([^ ]+)\s+<@!?\d{15,22}>$/u);
    if (adminMatch) { await adminMoney(message, 'add', adminMatch[1]); return true; }
    if (/^تصفير كامل السيرفر$/u.test(text)) { await adminMoney(message, 'reset-server', ''); return true; }
    if (/^(?:تصفير كامل|تصفير)\s+<@!?\d{15,22}>$/u.test(text)) { await adminMoney(message, 'reset-user', ''); return true; }
    if (/^(?:توب|top)$/u.test(text)) {
      await top(message, client);
      return true;
    }
    let explicitStock = text.match(/^(?:شراء سهم|شراء اسهم|شراء أسهم)\s+([^\s]+)\s+(.+)$/u);
    if (explicitStock) { await tradeStockByValue(message,'buy',explicitStock[1],explicitStock[2]); return true; }
    explicitStock = text.match(/^(?:بيع سهم|بيع اسهم|بيع أسهم)\s+([^\s]+)\s+(.+)$/u);
    if (explicitStock) { await tradeStockByValue(message,'sell',explicitStock[1],explicitStock[2]); return true; }

    let reverseStock = text.match(/^(?:شراء|buy)\s+(كامل|الكل|كل|نص|نصف|ربع|full|all|half|quarter|[0-9٠-٩۰-۹.,]+)\s+([^\s]+)$/u);
    if (reverseStock && companyFrom(reverseStock[2])) {
      await tradeStockByValue(message, 'buy', reverseStock[2], reverseStock[1]);
      return true;
    }
    reverseStock = text.match(/^(?:بيع|sell)\s+(كامل|الكل|كل|نص|نصف|ربع|full|all|half|quarter|[0-9٠-٩۰-۹.,]+)\s+([^\s]+)$/u);
    if (reverseStock && companyFrom(reverseStock[2])) {
      await tradeStockByValue(message, 'sell', reverseStock[2], reverseStock[1]);
      return true;
    }

    let stockMatch = text.match(/^(?:شراء|buy)\s+([^\s]+)\s+(.+)$/u);
    if (stockMatch && companyFrom(stockMatch[1])) {
      await tradeStockByValue(message, 'buy', stockMatch[1], stockMatch[2]);
      return true;
    }
    stockMatch = text.match(/^(?:بيع|sell)\s+([^\s]+)\s+(.+)$/u);
    if (stockMatch && companyFrom(stockMatch[1])) {
      await tradeStockByValue(message, 'sell', stockMatch[1], stockMatch[2]);
      return true;
    }
    stockMatch = text.match(/^(?:أسهم|اسهم|stocks?)\s+([^\s]+)\s+(.+)$/u);
    if (stockMatch) {
      await tradeStockByValue(message, 'buy', stockMatch[1], stockMatch[2]);
      return true;
    }
    stockMatch = text.match(/^(?:بيع أسهم|بيع اسهم|sell stocks?)\s+([^\s]+)\s+(.+)$/u);
    if (stockMatch) {
      await tradeStockByValue(message, 'sell', stockMatch[1], stockMatch[2]);
      return true;
    }

    if (/^(?:ممتلكات|properties)$/u.test(text)) { await properties(message); return true; }

    if (/^(?:ذهب|gold)$/u.test(text)) { await goldMarket(message); return true; }
    if (/^(?:عقار|عقارات|ارض|أرض|اراضي|أراضي)$/u.test(text)) { await assetCatalog(message,'PROPERTY'); return true; }
    if (/^(?:سيارة|سياره|سيارات)$/u.test(text)) { await assetCatalog(message,'CAR'); return true; }
    if (/^(?:طائرة|طائره|طيارة|طياره|طائرات)$/u.test(text)) { await assetCatalog(message,'PLANE'); return true; }

    const categoryBuy = text.match(/^(?:شراء|buy)\s+(عقار|عقارات|ارض|أرض|اراضي|أراضي|سيارة|سياره|سيارات|طائرة|طائره|طيارة|طياره|طائرات)$/u);
    if (categoryBuy) { await assetCatalog(message, categoryFromText(categoryBuy[1])); return true; }
    const categorySell = text.match(/^(?:بيع|sell)\s+(عقار|عقارات|ارض|أرض|اراضي|أراضي|سيارة|سياره|سيارات|طائرة|طائره|طيارة|طياره|طائرات)$/u);
    if (categorySell) { await assetCatalog(message, categoryFromText(categorySell[1])); return true; }
    let goldTrade = text.match(/^(?:شراء|buy)\s+(?:ذهب|gold)\s+(.+)$/u);
    if (goldTrade) { await tradeAsset(message,'buy',`ذهب ${goldTrade[1]}`); return true; }
    goldTrade = text.match(/^(?:بيع|sell)\s+(?:ذهب|gold)\s+(.+)$/u);
    if (goldTrade) { await tradeAsset(message,'sell',`ذهب ${goldTrade[1]}`); return true; }
    if (/^(?:شراء|buy)\s+(?:ذهب|gold)$/u.test(text) || /^(?:بيع|sell)\s+(?:ذهب|gold)$/u.test(text)) { await goldMarket(message); return true; }

    let assetMatch = text.match(/^(?:شراء|buy)\s+(.+)$/u);
    if (assetMatch && (assetFrom(assetMatch[1]) || assetMatch[1].includes('ذهب'))) { await tradeAsset(message,'buy',assetMatch[1]); return true; }
    assetMatch = text.match(/^(?:بيع|sell)\s+(.+)$/u);
    if (assetMatch && (assetFrom(assetMatch[1]) || assetMatch[1].includes('ذهب'))) { await tradeAsset(message,'sell',assetMatch[1]); return true; }

    if (/^(?:سهم|اسهم|أسهم|stock)$/u.test(text)) {
      await stock(message);
      return true;
    }

    let match = text.match(/^(?:تحويل|transfer)\s+(?:<@!?\d{15,22}>\s+(.+)|(.+?)\s+<@!?\d{15,22}>)$/u);
    if (match) {
      await transfer(message, match[1] || match[2]);
      return true;
    }

    match = text.match(/^(?:ايداع|إيداع|deposit)\s+(.+)$/u);
    if (match) {
      await vault(message, 'deposit', match[1]);
      return true;
    }

    match = text.match(/^(?:سحب|withdraw)\s+(.+)$/u);
    if (match) {
      await vault(message, 'withdraw', match[1]);
      return true;
    }

    match = text.match(/^(?:نرد|dice)\s+(.+)$/u);
    if (match) {
      if (message.mentions.users.size) await diceChallenge(message, match[1]);
      else await moneyGame(message, 'dice', match[1]);
      return true;
    }

    const moneyGames = [
      [/^(?:رهان|bet)\s+(.+)$/u, 'bet'],
      [/^(?:استثمار|invest)\s+(.+)$/u, 'invest'],
      [/^(?:قمار|gamble)\s+(.+)$/u, 'gamble'],
      [/^(?:تداول|تدوال|trade)\s+(.+)$/u, 'trade'],
    ];
    for (const [pattern, type] of moneyGames) {
      match = text.match(pattern);
      if (match) {
        await moneyGame(message, type, match[1]);
        return true;
      }
    }

    match = text.match(/^(?:روليت|roulette)\s+(.+)$/u);
    if (match) {
      await roulette(message, match[1]);
      return true;
    }

    match = text.match(/^(?:هايلو|هاي لو|hilo)\s+(.+)$/u);
    if (match) {
      await hilo(message, match[1]);
      return true;
    }

    match = text.match(/^(?:صناديق|boxes)\s+(.+)$/u);
    if (match) {
      await boxes(message, match[1]);
      return true;
    }

    match = text.match(/^(?:الغام|ألغام|mines)\s+(.+)$/u);
    if (match) { await mines(message, match[1]); return true; }
    if (/^(?:فواكه|fruits)(?:\s|$)/u.test(text)) { await fruits(message); return true; }
    if (/^(?:الوان|ألوان|colors)(?:\s|$)/u.test(text)) { await colors(message); return true; }
    if (/^(?:عملة|coin)(?:\s|$)/u.test(text)) { await coin(message); return true; }
    match = text.match(/^(?:رقم|number)\s+(.+)$/u);
    if (match) { await numberGuess(message, match[1]); return true; }

    if (/^(?:تداول|تدوال|trade)$/u.test(text)) return replyUsage(message, 'تداول', ['تداول كامل', 'تداول نص', 'تداول ربع', 'تداول 5000']);
    if (/^(?:استثمار|invest)$/u.test(text)) return replyUsage(message, 'استثمار', ['استثمار كامل', 'استثمار نص', 'استثمار ربع', 'استثمار 5000']);
    if (/^(?:رهان|bet)$/u.test(text)) return replyUsage(message, 'رهان', ['رهان كامل', 'رهان نص', 'رهان ربع', 'رهان 5000']);
    if (/^(?:قمار|gamble)$/u.test(text)) return replyUsage(message, 'قمار', ['قمار كامل', 'قمار نص', 'قمار ربع', 'قمار 5000']);
    if (/^(?:نرد|dice)$/u.test(text)) return replyUsage(message, 'نرد', ['نرد كامل', 'نرد 5000', 'نرد 5000 @member']);
    if (/^(?:روليت|roulette)$/u.test(text)) return replyUsage(message, 'روليت', ['روليت كامل', 'روليت نص', 'روليت ربع', 'روليت 5000']);
    if (/^(?:هايلو|هاي لو|hilo)$/u.test(text)) return replyUsage(message, 'هايلو', ['هايلو كامل', 'هايلو نص', 'هايلو ربع', 'هايلو 5000']);
    if (/^(?:صناديق|boxes)$/u.test(text)) return replyUsage(message, 'صناديق', ['صناديق كامل', 'صناديق نص', 'صناديق ربع', 'صناديق 5000']);
    if (/^(?:الغام|ألغام|mines)$/u.test(text)) return replyUsage(message, 'الغام', ['الغام كامل', 'الغام نص', 'الغام ربع', 'الغام 5000']);
    if (/^(?:رقم|number)$/u.test(text)) return replyUsage(message, 'رقم', ['رقم كامل', 'رقم نص', 'رقم ربع', 'رقم 5000']);
    if (/^(?:ايداع|إيداع|deposit)$/u.test(text)) return replyUsage(message, 'ايداع', ['ايداع كامل', 'ايداع نص', 'ايداع ربع', 'ايداع 5000']);
    if (/^(?:سحب|withdraw)$/u.test(text)) return replyUsage(message, 'سحب', ['سحب كامل', 'سحب نص', 'سحب ربع', 'سحب 5000']);
    const stockInfo = text.match(/^(?:سهم|stock)\s+([^\s]+)$/u);
    if (stockInfo && companyFrom(stockInfo[1])) return replyUsage(message, stockInfo[1].toUpperCase(), [`شراء ${stockInfo[1].toUpperCase()} كامل`, `شراء ${stockInfo[1].toUpperCase()} 5000`, `بيع ${stockInfo[1].toUpperCase()} كامل`, `بيع ${stockInfo[1].toUpperCase()} 5000`]);
    if (/^(?:شراء سهم|شراء اسهم|شراء أسهم)$/u.test(text)) return replyUsage(message, 'شراء الأسهم', ['شراء اسم السهم كامل', 'شراء اسم السهم نص', 'شراء اسم السهم ربع', 'شراء اسم السهم 5000']);
    if (/^(?:بيع سهم|بيع اسهم|بيع أسهم)$/u.test(text)) return replyUsage(message, 'بيع الأسهم', ['بيع اسم السهم كامل', 'بيع اسم السهم نص', 'بيع اسم السهم ربع', 'بيع اسم السهم 5000']);
    const incompleteBuy = text.match(/^(?:شراء|buy)\s+([^\s]+)$/u);
    if (incompleteBuy && companyFrom(incompleteBuy[1])) return replyUsage(message, `شراء ${incompleteBuy[1].toUpperCase()}`, [`شراء ${incompleteBuy[1].toUpperCase()} كامل`, `شراء ${incompleteBuy[1].toUpperCase()} نص`, `شراء ${incompleteBuy[1].toUpperCase()} ربع`, `شراء ${incompleteBuy[1].toUpperCase()} 5000`]);
    const incompleteSell = text.match(/^(?:بيع|sell)\s+([^\s]+)$/u);
    if (incompleteSell && companyFrom(incompleteSell[1])) return replyUsage(message, `بيع ${incompleteSell[1].toUpperCase()}`, [`بيع ${incompleteSell[1].toUpperCase()} كامل`, `بيع ${incompleteSell[1].toUpperCase()} نص`, `بيع ${incompleteSell[1].toUpperCase()} ربع`, `بيع ${incompleteSell[1].toUpperCase()} 5000`]);
    if (/^(?:شراء)$/u.test(text)) return replyUsage(message, 'شراء', ['شراء اسم السهم كامل', 'شراء فيلا', 'شراء سيارة رياضية', 'شراء طائرة خاصة', 'شراء ذهب 50000']);
    if (/^(?:بيع)$/u.test(text)) return replyUsage(message, 'بيع', ['بيع اسم السهم كامل', 'بيع فيلا', 'بيع سيارة رياضية', 'بيع طائرة خاصة', 'بيع ذهب كامل']);

        await replyInfo(message, 'الأمر غير مكتمل', 'اكتب اوامر لعرض جميع أوامر البنك');
    return true;
  } catch (error) {
    console.error('[bank] command failed:', error);
    await replyInfo(message, 'خطأ مؤقت', 'تعذر تنفيذ الأمر الآن • جرّب مرة ثانية').catch(() => {});
    return true;
  }
}

function warmBank(client) {
  const guilds = [...client.guilds.cache.values()];
  if (!guilds.length) return;
  Promise.allSettled(guilds.map((guild) => ensureLoaded(guild)))
    .then((results) => {
      const failed = results.filter((result) => result.status === 'rejected').length;
      if (failed) console.warn(`[bank] warmup finished with ${failed} failure(s)`);
      else console.log(`[bank] warmup ready for ${guilds.length} guild(s)`);
    })
    .catch(() => {});
}

function installBankSystem(client) {
  if (client.__neverlessBankInstalled) return;
  client.__neverlessBankInstalled = true;

  client.on('messageCreate', (message) => {
    handleBankMessage(message, client).catch((error) => console.error('[bank] unhandled:', error));
  });

  client.on('guildCreate', (guild) => {
    ensureLoaded(guild).catch((error) => console.error('[bank] guild warmup failed:', error));
  });

  if (client.isReady?.()) setImmediate(() => warmBank(client));
  else client.once('ready', () => setImmediate(() => warmBank(client)));

  console.log(`[bank] installed for ${[...BANK_CHANNELS].join(', ')}`);
}

module.exports = {
  installBankSystem,
  handleBankMessage,
  parseAmount,
  parseShares,
  parseRecord,
  unpackUser,
  commandCooldownLeft,
  cooldownStatus,
  BANK_CHANNEL_ID,
  BANK_TEST_CHANNEL_ID,
  BANK_EXTRA_CHANNEL_ID,
  COMMAND_CD,
};
