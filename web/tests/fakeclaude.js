// Simula db e user do claude.ai (o necessário para a biblioteca da equipe).
window.__fakeTeam = (uid, owner, seed) => {
  const store = new Map(Object.entries(seed || {})), subs = new Set();
  const snap = () => { const docs = [...store].filter(([p]) => p.startsWith("equipe/")).map(([p, v]) => ({ id: p.split("/")[1], exists: true, data: () => v, metadata: {} })); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const db = {
    collection: path => ({ path, onSnapshot: (next) => { subs.add(next); setTimeout(() => next(snap()), 0); return () => subs.delete(next); } }),
    doc: path => ({ path, set: async data => { if (path !== "equipe/" + uid && !owner) throw { code: "invalid_argument", message: "x" }; store.set(path, JSON.parse(JSON.stringify(data))); subs.forEach(f => setTimeout(() => f(snap()), 0)); } })
  };
  const user = { id: async () => uid, isOwner: async () => owner, profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: i === uid ? "Edson" : "Ana Projetista", isMe: i === uid }])) };
  window.__store = store;
  window.claude = { use: async n => (n === "db" ? db : n === "user" ? user : null) };
};
