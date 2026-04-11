import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X, Plus, Check, Tags, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import api from "@/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG_TYPES = ["person", "event", "place", "era", "dynasty", "concept"];

const TYPE_LABELS = {
  person:  "Личность",
  event:   "Событие",
  place:   "Место",
  era:     "Эпоха",
  dynasty: "Династия",
  concept: "Понятие",
};

// Muted, non-aggressive colors for each tag type
export const TYPE_COLORS = {
  person:  {
    chip:   "bg-emerald-900/50 text-emerald-200 border border-emerald-700/60",
    dot:    "bg-emerald-400",
    filter: "bg-emerald-900/60 text-emerald-300 border-emerald-700/70",
    card:   "bg-emerald-900/20 border-emerald-700/40 hover:bg-emerald-900/40",
    cardSel:"bg-emerald-900/50 border-emerald-500/60",
  },
  event:   {
    chip:   "bg-amber-900/50 text-amber-200 border border-amber-700/60",
    dot:    "bg-amber-400",
    filter: "bg-amber-900/60 text-amber-300 border-amber-700/70",
    card:   "bg-amber-900/20 border-amber-700/40 hover:bg-amber-900/40",
    cardSel:"bg-amber-900/50 border-amber-500/60",
  },
  place:   {
    chip:   "bg-sky-900/50 text-sky-200 border border-sky-700/60",
    dot:    "bg-sky-400",
    filter: "bg-sky-900/60 text-sky-300 border-sky-700/70",
    card:   "bg-sky-900/20 border-sky-700/40 hover:bg-sky-900/40",
    cardSel:"bg-sky-900/50 border-sky-500/60",
  },
  era:     {
    chip:   "bg-violet-900/50 text-violet-200 border border-violet-700/60",
    dot:    "bg-violet-400",
    filter: "bg-violet-900/60 text-violet-300 border-violet-700/70",
    card:   "bg-violet-900/20 border-violet-700/40 hover:bg-violet-900/40",
    cardSel:"bg-violet-900/50 border-violet-500/60",
  },
  dynasty: {
    chip:   "bg-rose-900/50 text-rose-200 border border-rose-700/60",
    dot:    "bg-rose-400",
    filter: "bg-rose-900/60 text-rose-300 border-rose-700/70",
    card:   "bg-rose-900/20 border-rose-700/40 hover:bg-rose-900/40",
    cardSel:"bg-rose-900/50 border-rose-500/60",
  },
  concept: {
    chip:   "bg-slate-700/60 text-slate-200 border border-slate-600/60",
    dot:    "bg-slate-400",
    filter: "bg-slate-700/60 text-slate-300 border-slate-600/70",
    card:   "bg-slate-800/40 border-slate-700/40 hover:bg-slate-700/40",
    cardSel:"bg-slate-700/60 border-slate-500/60",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTagName = (tag, lang) =>
  tag?.name?.[lang] || tag?.name?.ru || tag?.name?.en || tag?.name?.kg || "";

const isSelected = (tag, selectedTags) =>
  selectedTags.some((s) => (s._id || s) === (tag._id || tag));

// ─── Tag chip (shown in the selected strip) ───────────────────────────────────
export const TagChip = ({ tag, lang, onRemove }) => {
  const colors = TYPE_COLORS[tag.type] || TYPE_COLORS.concept;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium whitespace-nowrap ${colors.chip}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
      {getTagName(tag, lang)}
      {onRemove && (
        <button
          onClick={() => onRemove(tag._id || tag)}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
          title="Убрать тег"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

// ─── Create tag mini-form ─────────────────────────────────────────────────────
const CreateTagForm = ({ onCreated }) => {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ type: "person", en: "", ru: "", kg: "" });
  const [error,   setError]   = useState("");

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const submit = async () => {
    if (!form.en || !form.ru || !form.kg) {
      setError("Заполните название на всех трёх языках");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/tags", {
        type: form.type,
        name: { en: form.en, ru: form.ru, kg: form.kg },
      });
      const newTag = res.data?.data;
      setForm({ type: "person", en: "", ru: "", kg: "" });
      setOpen(false);
      onCreated(newTag);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Ошибка при создании");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-800 mt-2 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-1 py-1"
      >
        {open ? <ChevronUp size={14} /> : <Plus size={14} />}
        Создать новый тег
      </button>

      {open && (
        <div className="mt-3 space-y-3 p-3 bg-gray-900 rounded-lg border border-gray-800">
          {/* Type */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Тип</label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_TYPES.map((t) => {
                const c = TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    onClick={() => set("type", t)}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                      form.type === t
                        ? c.filter + "text-white ring-1 ring-offset-1 ring-offset-gray-900"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Names */}
          <div className="text-white grid grid-cols-3 gap-2">
            {[["ru", "Рус"], ["en", "Eng"], ["kg", "Кырг"]].map(([lang, label]) => (
              <div key={lang}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <input
                  type="text"
                  value={form[lang]}
                  onChange={(e) => set(lang, e.target.value)}
                  placeholder={label}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-md text-sm disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Создать
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main dialog ──────────────────────────────────────────────────────────────
const TagPickerDialog = ({ selectedTags, allTags, onTagsChange, onTagCreated, lang }) => {
  const [open,       setOpen]       = useState(false);
  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter tag list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTags.filter((tag) => {
      if (typeFilter !== "all" && tag.type !== typeFilter) return false;
      if (!q) return true;
      return (
        tag.name?.ru?.toLowerCase().includes(q) ||
        tag.name?.en?.toLowerCase().includes(q) ||
        tag.name?.kg?.toLowerCase().includes(q)
      );
    });
  }, [allTags, search, typeFilter]);

  const toggle = (tag) => {
    if (isSelected(tag, selectedTags)) {
      onTagsChange(selectedTags.filter((s) => (s._id || s) !== (tag._id || tag)));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreated = (newTag) => {
    onTagCreated(newTag);
    onTagsChange([...selectedTags, newTag]);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* ── Trigger button ── */}
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-all">
          <Tags size={14} />
          Управление тегами
          {selectedTags.length > 0 && (
            <span className="bg-violet-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {selectedTags.length}
            </span>
          )}
        </button>
      </Dialog.Trigger>

      {/* ── Dialog ── */}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="text-white fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
            <Dialog.Title className="text-base font-semibold flex items-center gap-2">
              <Tags size={16} className="text-violet-400" />
              Теги
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-white transition-colors rounded-md p-1 hover:bg-gray-800">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Selected tags strip */}
          {selectedTags.length > 0 && (
            <div className="px-5 py-3 border-b border-gray-800 flex-shrink-0">
              <p className="text-xs text-gray-500 mb-2">Выбрано ({selectedTags.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <TagChip
                    key={tag._id || tag}
                    tag={tag}
                    lang={lang}
                    onRemove={(id) =>
                      onTagsChange(selectedTags.filter((s) => (s._id || s) !== id))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-5 py-3 border-b border-gray-800 flex-shrink-0 space-y-2.5">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск тегов..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  typeFilter === "all"
                    ? "bg-gray-700 text-white border-gray-500"
                    : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-300"
                }`}
              >
                Все
              </button>
              {TAG_TYPES.map((t) => {
                const c = TYPE_COLORS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      typeFilter === t
                        ? c.filter
                        : "bg-transparent text-gray-400 border-gray-700 hover:border-gray-600 hover:text-gray-300"
                    }`}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${c.dot}`} />
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag list */}
          <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm gap-2">
                <Tags size={24} className="opacity-40" />
                {search ? `Нет тегов по запросу «${search}»` : "Теги не найдены"}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filtered.map((tag) => {
                  const sel    = isSelected(tag, selectedTags);
                  const colors = TYPE_COLORS[tag.type] || TYPE_COLORS.concept;
                  return (
                    <button
                      key={tag._id}
                      onClick={() => toggle(tag)}
                      className={`relative text-left rounded-lg border px-3 py-2.5 transition-all ${
                        sel ? colors.cardSel : colors.card
                      } border`}
                    >
                      {/* Check mark */}
                      {sel && (
                        <span className="absolute top-2 right-2 text-white/80">
                          <Check size={12} />
                        </span>
                      )}
                      {/* Type badge */}
                      <span className="flex items-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <span className="text-xs text-gray-500">{TYPE_LABELS[tag.type]}</span>
                      </span>
                      {/* Name */}
                      <p className="text-sm font-medium leading-tight line-clamp-2">
                        {getTagName(tag, lang)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create new tag */}
          <div className="px-5 pb-4 flex-shrink-0">
            <CreateTagForm onCreated={handleCreated} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TagPickerDialog;
