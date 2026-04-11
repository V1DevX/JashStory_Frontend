import { useEffect, useState } from "react";
import api from "@/api";
import { Plus, Pencil, Trash2, RefreshCw, X, Check } from "lucide-react";

const TAG_TYPES = ["person", "event", "place", "era", "dynasty", "concept"];

const EMPTY_FORM = {
  type: "person",
  name: { en: "", ru: "", kg: "" },
  status: "active",
};

const StatusBadge = ({ status }) => {
  const cls = status === "active" ? "bg-green-700" : "bg-gray-600";
  return <span className={`text-xs px-2 py-0.5 rounded ${cls} text-white`}>{status}</span>;
};

export default function TagList() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Фильтры
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Диалог создания / редактирования
  const [dialog, setDialog] = useState(null); // null | { mode: "create" | "edit", data: {...} }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── Загрузка ───────────────────────────────
  const fetchTags = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const params = { size: 100 };
      if (q) params.q = q;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get("/tags", { params, timeout: 10000 });
      if (res.status === 204 || !res.data) { setTags([]); return; }
      const raw = res.data?.data ?? res.data;
      const list = Array.isArray(raw) ? raw
        : Array.isArray(raw?.tags)       ? raw.tags
        : Array.isArray(raw?.categories) ? raw.categories
        : Array.isArray(raw?.docs)       ? raw.docs
        : Array.isArray(raw?.items)      ? raw.items
        : [];
      setTags(list);
    } catch (e) {
      console.error("Failed to load tags:", e);
      setFetchError(e?.message || "Failed to load tags. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTags(); }, [typeFilter]);

  // ─── Диалог ─────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setDialog({ mode: "create" });
  };

  const openEdit = (tag) => {
    setForm({
      type: tag.type || "person",
      name: { en: tag.name?.en || "", ru: tag.name?.ru || "", kg: tag.name?.kg || "" },
      status: tag.status || "active",
    });
    setFormError("");
    setDialog({ mode: "edit", id: tag._id });
  };

  const closeDialog = () => { setDialog(null); setFormError(""); };

  // ─── Изменение поля формы ────────────────────
  const setField = (path, value) => {
    setForm(prev => {
      const copy = { ...prev };
      if (path.startsWith("name.")) {
        const lang = path.split(".")[1];
        copy.name = { ...copy.name, [lang]: value };
      } else {
        copy[path] = value;
      }
      return copy;
    });
  };

  // ─── Сохранение ─────────────────────────────
  const handleSave = async () => {
    if (!form.name.en && !form.name.ru) {
      setFormError("Name EN or RU is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (dialog.mode === "create") {
        await api.post("/tags", { type: form.type, name: form.name, status: form.status });
      } else {
        await api.put(`/tags/${dialog.id}`, { type: form.type, name: form.name, status: form.status });
      }
      closeDialog();
      fetchTags();
    } catch (e) {
      // Бэкенд возвращает { field: "msg" } при ошибках валидации
      const errMsg = e?.message || Object.values(e || {}).join(", ") || "Save failed";
      setFormError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Удаление ───────────────────────────────
  const handleDelete = async (tag) => {
    const name = tag.name?.ru || tag.name?.en || tag._id;
    if (!window.confirm(`Delete tag "${name}"? This is irreversible.`)) return;
    try {
      setTags(prev => prev.filter(t => t._id !== tag._id));
      await api.delete(`/tags/${tag._id}`);
    } catch (e) {
      console.error("Delete failed:", e);
      fetchTags();
    }
  };

  // ─── Фильтрация на клиенте ──────────────────
  const filtered = tags.filter(tag => {
    if (!q) return true;
    const ql = q.toLowerCase();
    return (
      tag.name?.en?.toLowerCase().includes(ql) ||
      tag.name?.ru?.toLowerCase().includes(ql) ||
      tag.name?.kg?.toLowerCase().includes(ql)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Tags</h2>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchTags()}
            placeholder="Search by name..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:border-violet-500 w-52"
          />

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm"
          >
            <option value="">All types</option>
            {TAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button onClick={fetchTags} className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700">
            <RefreshCw size={14} /> Refresh
          </button>

          <button onClick={openCreate} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-500">
            <Plus size={14} /> New Tag
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
              <th className="p-2">Name (RU / EN)</th>
              <th className="p-2 w-28">Type</th>
              <th className="p-2 w-20 text-center">Posts</th>
              <th className="p-2 w-24">Status</th>
              <th className="p-2 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={5} className="p-6 text-center text-red-400">{fetchError}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-gray-500">No tags found</td></tr>
            ) : filtered.map(tag => (
              <tr key={tag._id} className="border-b border-gray-800 hover:bg-gray-900">
                <td className="p-2">
                  <div className="font-medium">{tag.name?.ru || tag.name?.en || "—"}</div>
                  {tag.name?.ru && tag.name?.en && (
                    <div className="text-xs text-gray-500">{tag.name.en}</div>
                  )}
                </td>
                <td className="p-2">
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded">{tag.type}</span>
                </td>
                <td className="p-2 text-center text-gray-400">{tag.postsCount ?? 0}</td>
                <td className="p-2"><StatusBadge status={tag.status || "active"} /></td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => openEdit(tag)} className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(tag)} className="px-2 py-1 bg-red-700 rounded hover:bg-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Диалог создания / редактирования */}
      {dialog && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 bg-black/60 z-40" onClick={closeDialog} />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold">
                  {dialog.mode === "create" ? "New Tag" : "Edit Tag"}
                </h3>
                <button onClick={closeDialog} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-4 space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setField("type", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                  >
                    {TAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Name */}
                {["en", "ru", "kg"].map(lang => (
                  <div key={lang}>
                    <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">
                      Name {lang.toUpperCase()} {lang !== "kg" ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      value={form.name[lang]}
                      onChange={e => setField(`name.${lang}`, e.target.value)}
                      placeholder={`Name in ${lang.toUpperCase()}`}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                ))}

                {/* Status */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setField("status", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                {formError && <p className="text-red-400 text-sm">{formError}</p>}
              </div>

              {/* Modal footer */}
              <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
                <button onClick={closeDialog} className="px-4 py-2 bg-gray-800 rounded text-sm hover:bg-gray-700">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 rounded text-sm hover:bg-violet-500 disabled:opacity-50"
                >
                  <Check size={14} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
