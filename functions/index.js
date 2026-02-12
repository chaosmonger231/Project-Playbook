/**
 * Project Playbook - Weekly Cyber News Aggregator
 * - Runs weekly (Event trigger: Scheduler)
 * - Fetches multiple RSS feeds
 * - Stores items in Firestore (deduped by URL)
 * - Has hard usage limits:
 *   - maxInstances: 1
 *   - timeoutSeconds: 60
 *   - Cooldown check: refuses to run if last run < 7 days ago
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

const admin = require("firebase-admin");
const fetch = require("node-fetch");
const xml2js = require("xml2js");

admin.initializeApp();
const db = admin.firestore();

// Global limit (applies to v2 functions)
setGlobalOptions({ maxInstances: 1 });

/** Optional: simple HTTP sanity test */
exports.helloWorld = onRequest((req, res) => {
  res.send("Project Playbook Functions are live!");
});

/** RSS sources (add/remove anytime) */
const FEEDS = [
  { name: "CyberWire", url: "https://thecyberwire.com/feeds/rss.xml" },
  { name: "KrebsOnSecurity", url: "https://krebsonsecurity.com/feed/" },
  { name: "CISA Advisories", url: "https://www.cisa.gov/cybersecurity-advisories/all.xml" },
  { name: "BleepingComputer", url: "https://www.bleepingcomputer.com/feed/" },
  { name: "The Hacker News", url: "https://feeds.feedburner.com/TheHackersNews" },
  { name: "NIST News", url: "https://www.nist.gov/news-events/news/rss.xml" }
];

/** How many items per feed to ingest each run (balances sources) */
const PER_FEED_LIMIT = 2;

/** Cooldown: function will skip if it ran within the last 7 days */
const COOLDOWN_DAYS = 7;

function safeId(str) {
  // Firestore doc IDs cannot contain slashes reliably; base64 makes it safe.
  return Buffer.from(str).toString("base64").replace(/=+$/g, "");
}

async function parseFeedXml(xml) {
  const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

  // RSS 2.0
  if (parsed?.rss?.channel?.item) return [].concat(parsed.rss.channel.item);

  // Atom
  if (parsed?.feed?.entry) return [].concat(parsed.feed.entry);

  return [];
}

function getItemFields(item) {
  // Title
  const title = item?.title?._ || item?.title || "Untitled";

  // Link handling differs between RSS and Atom
  const link =
    item?.link?.href || // Atom style
    item?.link ||       // RSS style
    item?.guid?._ ||    // Some RSS feeds
    item?.id ||         // Atom id
    null;

  // Date handling differs too
  const publishedRaw =
    item?.pubDate ||
    item?.published ||
    item?.updated ||
    item?.["dc:date"] ||
    null;

  // Try to parse date; fallback to now
  const publishedAt = publishedRaw ? new Date(publishedRaw) : new Date();
  const publishedAtIso = isNaN(publishedAt.getTime())
    ? new Date().toISOString()
    : publishedAt.toISOString();

  return { title: String(title).trim(), link: link ? String(link).trim() : null, publishedAt: publishedAtIso };
}

async function shouldRunNow() {
  const metaRef = db.collection("meta").doc("newsRefresh");
  const snap = await metaRef.get();

  if (!snap.exists) return true;

  const lastRun = snap.data()?.lastRun?.toDate?.();
  if (!lastRun) return true;

  const now = new Date();
  const ms = now.getTime() - lastRun.getTime();
  const days = ms / (1000 * 60 * 60 * 24);

  return days >= COOLDOWN_DAYS;
}

async function markRan() {
  await db.collection("meta").doc("newsRefresh").set(
    { lastRun: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

/**
 * ✅ Weekly scheduled job
 * You can change the schedule string to:
 * - "every sunday 00:00"
 * - "every monday 06:00"
 */
exports.refreshCyberNews = onSchedule(
  {
    schedule: "every monday 06:00",
    timeZone: "America/New_York",
    maxInstances: 1,
    timeoutSeconds: 60,
  },
  async () => {
    // Cooldown safety: refuses to run too often
    const ok = await shouldRunNow();
    if (!ok) {
      console.log(`Skipping refresh: last run was within ${COOLDOWN_DAYS} days.`);
      return;
    }

    console.log("Starting weekly cyber news refresh...");

    const batch = db.batch();
    const nowTs = admin.firestore.FieldValue.serverTimestamp();

    for (const feed of FEEDS) {
      try {
        const res = await fetch(feed.url, { timeout: 15000 });
        if (!res.ok) {
          console.log(`Feed failed (${feed.name}): HTTP ${res.status}`);
          continue;
        }

        const xml = await res.text();
        const items = await parseFeedXml(xml);

        // Balanced ingestion: only take N per source
        const limited = items.slice(0, PER_FEED_LIMIT);

        for (const item of limited) {
          const { title, link, publishedAt } = getItemFields(item);
          if (!link) continue;

          const docId = safeId(link);
          const ref = db.collection("cyberNews").doc(docId);

          batch.set(
            ref,
            {
              title,
              source: feed.name,
              link,
              publishedAt,
              fetchedAt: nowTs,
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.log(`Feed error (${feed.name}):`, err?.message || err);
      }
    }

    await batch.commit();
    await markRan();

    console.log("Weekly cyber news refresh complete.");
  }
);
