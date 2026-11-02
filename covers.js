// Template covers for the wheel, from the booth app's Local API (API 1.1): templates?covers=1 sends
// every cover inline ({ mime, width, height, video, hash, data: "data:image/jpeg;base64,..." }), at
// the size the booth's own picker shows it. Read once per template list (covers aren't polled) and
// kept here as Buffers for /cover/<id>. A booth app with API 1 sends none: the wheel draws placeholders.
// Nothing is read from the booth app's folder, so a booth on another PC gets its covers too.
//   const covers = createCovers(read);   read = (cmd, timeoutMs) => Local API GET reply
//   await covers.get(templateId)          -> { type, data, hash } | null
//   covers.forget()                       the template list changed: fetch again on the next ask

// "data:image/jpeg;base64,...." -> { type, data (Buffer) }
export function decodeDataUri(uri) {
  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(uri || '');
  if (!m) return null;
  return { type: m[1], data: m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3])) };
}

export function createCovers(read) {
  let set = null; // Promise<Map templateId -> { type, data, hash } | null>
  async function load() {
    const r = await read('templates?covers=1', 30000);
    if (!r.ok) { set = null; return new Map(); } // offline / no event: ask again next time
    return new Map(r.data.map(t => {
      const img = t.cover?.data ? decodeDataUri(t.cover.data) : null;
      return [t.id, img && { type: t.cover.mime || img.type, data: img.data, hash: t.cover.hash || '' }];
    }));
  }
  return {
    async get(id) { set ||= load(); return (await set).get(id) || null; },
    forget() { set = null; },
  };
}
