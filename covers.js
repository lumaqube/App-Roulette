// Template covers for the wheel. The Local API gives ids and names only; the covers sit in the
// event's own folder on this PC (read only, never written):
//   <qboothDir>\events\<eventId>\event.json  -> templates[].cover  (an image file in the event)
//   or, without one, the template file's own preview (templates[].path, JSON event_info.preview_image[0])
// A booth on another PC (Allow LAN): no files here, the wheel draws placeholders instead.
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' };
const cache = new Map(); // "event|template" -> { type, data } or null
const events = new Map(); // eventId -> { mtime, templates }

const eventDir = (dir, eventId) => path.join(dir, 'events', String(eventId).replace(/[\\/:*?"<>|]/g, ''));

// The saved templates of an event (also used by the mock booth).
export function savedTemplates(dir, eventId) {
  const file = path.join(eventDir(dir, eventId), 'event.json');
  let st;
  try { st = fs.statSync(file); } catch { return null; }
  const known = events.get(eventId);
  if (known && known.mtime === st.mtimeMs) return known.templates;
  try {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    const cats = new Map((j.categories || []).map(c => [c.id, c]));
    const templates = (j.templates || [])
      .filter(t => t.enabled !== false && (!t.categoryId || cats.get(t.categoryId)?.enabled !== false))
      .map(t => ({ id: t.id, name: t.caption || t.defaultCaption || t.id, cover: t.cover || '', path: t.path || '' }));
    events.set(eventId, { mtime: st.mtimeMs, templates });
    for (const k of [...cache.keys()]) if (k.startsWith(eventId + '|')) cache.delete(k); // event edited
    return templates;
  } catch { return null; }
}

// { type, data } of a template's cover, or null.
export function coverOf(dir, eventId, templateId) {
  const key = eventId + '|' + templateId;
  if (cache.has(key)) return cache.get(key);
  let found = null;
  const t = savedTemplates(dir, eventId)?.find(x => x.id === templateId);
  if (t) {
    const base = eventDir(dir, eventId);
    const inside = p => { const abs = path.resolve(base, p); return abs.startsWith(base + path.sep) ? abs : null; };
    const file = t.cover && inside(t.cover);
    if (file && fs.existsSync(file)) {
      found = { type: TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', data: fs.readFileSync(file) };
    } else if (t.path && inside(t.path) && fs.existsSync(inside(t.path))) {
      try {
        const doc = JSON.parse(fs.readFileSync(inside(t.path), 'utf8'));
        const p = doc.event_info?.preview_image?.[0];
        if (p?.mBase64) found = { type: TYPES['.' + String(p.mFileExt || 'jpg').replace(/^\./, '').toLowerCase()] || 'image/jpeg', data: Buffer.from(p.mBase64, 'base64') };
      } catch { }
    }
  }
  cache.set(key, found);
  return found;
}
