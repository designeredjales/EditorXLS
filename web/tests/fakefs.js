// Pasta em memória com a mesma interface da File System Access API (o necessário para o editor).
window.__fakeFs = (seed) => {
  class FFile { constructor(name, data) { this.kind = "file"; this.name = name; this.data = data; }
    async getFile() { return new File([this.data], this.name); }
    async createWritable() { const self = this, parts = []; return { write: async b => { parts.push(b); }, close: async () => { self.data = new Uint8Array(await new Blob(parts).arrayBuffer()); } }; }
    async queryPermission() { return "granted"; } async requestPermission() { return "granted"; } }
  class FDir { constructor(name) { this.kind = "directory"; this.name = name; this.children = new Map(); }
    async *entries() { for (const e of this.children) yield e; }
    async getDirectoryHandle(n, o = {}) { let d = this.children.get(n); if (!d) { if (!o.create) throw new DOMException("x", "NotFoundError"); d = new FDir(n); this.children.set(n, d); } return d; }
    async getFileHandle(n, o = {}) { let f = this.children.get(n); if (!f) { if (!o.create) throw new DOMException("x", "NotFoundError"); f = new FFile(n, new Uint8Array()); this.children.set(n, f); } return f; }
    async queryPermission() { return "granted"; } async requestPermission() { return "granted"; } }
  const root = new FDir("Promob");
  const put = (path, text) => { const segs = path.split("/"), name = segs.pop(); let d = root; for (const s of segs) { if (!d.children.has(s)) d.children.set(s, new FDir(s)); d = d.children.get(s); } d.children.set(name, new FFile(name, new TextEncoder().encode(text))); };
  for (const [p, t] of Object.entries(seed)) put(p, t);
  root.read = path => { const segs = path.split("/"); let d = root; for (const s of segs) { d = d.children.get(s); if (!d) return null; } return d.data ? new TextDecoder().decode(d.data) : [...d.children.keys()]; };
  return root;
};
