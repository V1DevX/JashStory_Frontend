import { useEffect, useState } from "react";
import api from "@/api";
import { Plus, Pencil, Trash2, RefreshCw, X, Check } from "lucide-react";

const EMPTY_FORM = { title: "", desc: "" };

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // Диалог
  const [dialog, setDialog] = useState(null); // null | { mode: "create" | "edit", id? }
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── Загрузка ───────────────────────────────
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = { size: 100 };
      if (q) params.q = q;
      const res = await api.get("/category", { params });
      const raw = res.data?.data;
      setCategories(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error("Failed to load categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // ─── Диалог ─────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setDialog({ mode: "create" });
  };

  const openEdit = (cat) => {
    setForm({ title: cat.title || "", desc: cat.desc || "" });
    setFormError("");
    setDialog({ mode: "edit", id: cat._id });
  };

  const closeDialog = () => { setDialog(null); setFormError(""); };

  // ─── Сохранение ─────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (dialog.mode === "create") {
        await api.post("/category", { title: form.title, desc: form.desc });
      } else {
        await api.put(`/category/${dialog.id}`, { title: form.title, desc: form.desc });
      }
      closeDialog();
      fetchCategories();
    } catch (e) {
      const errMsg = e?.message || Object.values(e || {}).join(", ") || "Save failed";
      setFormError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Удаление ───────────────────────────────
  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.title}"? This is irreversible.`)) return;
    try {
      setCategories(prev => prev.filter(c => c._id !== cat._id));
      await api.delete(`/category/${cat._id}`);
    } catch (e) {
      console.error("Delete failed:", e);
      fetchCategories();
    }
  };

  const filtered = categories.filter(c =>
    !q || c.title?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Categories</h2>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchCategories()}
            placeholder="Search..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:border-violet-500 w-44"
          />
          <button onClick={fetchCategories} className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 rounded text-sm hover:bg-gray-700">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={openCreate} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-500">
            <Plus size={14} /> New Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
              <th className="p-2">Title</th>
              <th className="p-2">Description</th>
              <th className="p-2 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="p-6 text-center text-gray-500">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="p-6 text-center text-gray-500">No categories found</td></tr>
            ) : filtered.map(cat => (
              <tr key={cat._id} className="border-b border-gray-800 hover:bg-gray-900">
                <td className="p-2 font-medium">{cat.title}</td>
                <td className="p-2 text-gray-400 text-sm">
                  <span className="line-clamp-1">{cat.desc || "—"}</span>
                </td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => openEdit(cat)} className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(cat)} className="px-2 py-1 bg-red-700 rounded hover:bg-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Диалог */}
      {dialog && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={closeDialog} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold">
                  {dialog.mode === "create" ? "New Category" : "Edit Category"}
                </h3>
                <button onClick={closeDialog} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Category title"
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wide">Description</label>
                  <textarea
                    value={form.desc}
                    onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                    placeholder="Short description"
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none resize-none"
                  />
                </div>
                {formError && <p className="text-red-400 text-sm">{formError}</p>}
              </div>

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
