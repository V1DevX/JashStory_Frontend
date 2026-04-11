import { useEffect, useRef, useState } from "react";
import api from "@/api";
import { useSearchParams } from "react-router-dom";
import useDraftStore from "@/stores/draftStore";
import * as Dialog from "@radix-ui/react-dialog";
import { List, Save, Trash2, Plus } from "lucide-react";
import TagPickerDialog, { TagChip } from "./TagPickerDialog";

const LANGS = ["ru", "en", "kg"];

const emptyLang = () => ({ title: "", desc: "", blocks: [] });

const emptyForm = () => ({
  previewImage: { public_id: "", url: "" },
  ru: emptyLang(),
  en: emptyLang(),
  kg: emptyLang(),
});

// Guard against null/non-object from backend
const normLang = (obj) => ({
  title: typeof obj?.title === "string" ? obj.title : "",
  desc: typeof obj?.desc === "string" ? obj.desc : "",
  blocks: Array.isArray(obj?.blocks) ? obj.blocks : [],
});

const extract = (raw, key) =>
  Array.isArray(raw)          ? raw
  : Array.isArray(raw?.[key]) ? raw[key]
  : Array.isArray(raw?.docs)  ? raw.docs
  : Array.isArray(raw?.items) ? raw.items
  : [];

// ─────────────────────────────────────────────────────────────
const PostEditor = () => {
  const [searchParams] = useSearchParams();
  const postId   = searchParams.get("id");
  const isEdit   = !!postId;

  // Single source of truth for all language content
  const [formData, setFormData] = useState(
    isEdit
      ? emptyForm()
      : JSON.parse(localStorage.getItem("newPost")) || emptyForm()
  );
  const [currLang, setCurrLang] = useState("ru");
  const [idCount,  setIdCount]  = useState(1);

  // Metadata
  const [status,       setStatus]       = useState("draft");
  const [category,     setCategory]     = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Selector options
  const [categories, setCategories] = useState([]);
  const [allTags,    setAllTags]    = useState([]);

  // UI flags
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);

  // Drafts (create mode only)
  const setDraft    = useDraftStore((s) => s.setDraft);
  const updateDraft = useDraftStore((s) => s.updateDraft);
  const deleteDraft = useDraftStore((s) => s.deleteDraft);
  const listDrafts  = useDraftStore((s) => s.listDrafts);
  const draftIdRef      = useRef(searchParams.get("draft") || `draft-${Date.now()}`);
  const initialDataRef  = useRef(null); // snapshot loaded from API — used to build diff on save
  const [openDrafts, setOpenDrafts] = useState(false);

  // ── Load categories & tags ──────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          api.get("/category"),
          api.get("/tags", { params: { size: 200 } }),
        ]);
        setCategories(extract(catRes.data?.data, "categories"));
        setAllTags(extract(tagRes.data?.data, "tags"));
      } catch (e) {
        console.error("Failed to load meta:", e);
      }
    };
    fetchMeta();
  }, []);

  // ── Load post for editing ───────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    const fetchPost = async () => {
      setLoading(true);
      try {
        // details=true → backend returns all languages (en/ru/kg) + status + category
        const res  = await api.get(`/posts/${postId}`, { params: { details: true } });
        const post = res.data?.data || res.data;

        const loadedFormData = {
          previewImage: post.previewImage || { public_id: "", url: "" },
          en: normLang(post.en),
          ru: normLang(post.ru),
          kg: normLang(post.kg),
        };
        const loadedStatus   = post.status || "draft";
        const loadedCategory = post.category?._id || post.category || "";
        const loadedTags     = Array.isArray(post.tags) ? post.tags : [];
        const loadedTagIds   = loadedTags.map((t) => t._id || t);

        setFormData(loadedFormData);

        // Compute next block id from all language blocks
        const allBlocks = [
          ...(post.en?.blocks || []),
          ...(post.ru?.blocks || []),
          ...(post.kg?.blocks || []),
        ];
        const maxId = allBlocks.reduce(
          (m, b) => Math.max(m, typeof b.id === "number" ? b.id : 0),
          0
        );
        setIdCount(maxId + 1);

        setStatus(loadedStatus);
        setCategory(loadedCategory);
        setSelectedTags(loadedTags);

        // Save snapshot for diff on save
        initialDataRef.current = {
          formData: loadedFormData,
          status:   loadedStatus,
          category: loadedCategory,
          tags:     loadedTagIds,
        };
      } catch (e) {
        console.error("Failed to load post:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  // ── Autosave draft (create mode only) ──────────────────────
  useEffect(() => {
    if (isEdit) return;
    const id     = draftIdRef.current;
    const stored = useDraftStore.getState().drafts[id];
    if (stored?.formData) {
      updateDraft(id, { updatedAt: Date.now(), currLang, formData });
    } else {
      setDraft(id, { createdAt: Date.now(), updatedAt: Date.now(), currLang, formData });
    }
  }, [formData, currLang, isEdit]);

  // ── Helpers: update current language field ──────────────────
  const setField = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      [currLang]: { ...prev[currLang], [field]: value },
    }));

  // ── Language switch with block structure sync ───────────────
  const syncBlocks = (targetBlocks, sourceBlocks) => {
    const contentMap = targetBlocks.reduce((m, b) => {
      if (b.type === "img")  m[b.id] = { desc: b.desc };
      else if (b.type === "div") m[b.id] = { desc: b.desc, content: b.content };
      else                   m[b.id] = { content: b.content };
      return m;
    }, {});
    return sourceBlocks.map((b) => {
      if (b.type === "img")  return { ...b, desc: contentMap[b.id]?.desc ?? "" };
      if (b.type === "div")  return { ...b, desc: contentMap[b.id]?.desc ?? "", content: contentMap[b.id]?.content ?? "" };
      return { ...b, content: contentMap[b.id]?.content ?? "" };
    });
  };

  const switchLang = (lang) => {
    if (lang === currLang) return;
    // Sync block structure from current lang into target lang
    setFormData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        blocks: syncBlocks(prev[lang].blocks, prev[currLang].blocks),
      },
    }));
    setCurrLang(lang);
  };

  // ── Blocks ──────────────────────────────────────────────────
  const addBlock = (type) => {
    const block = { id: idCount, type };
    if (type === "h" || type === "p")  block.content = "";
    if (type === "img")  { block.public_id = ""; block.url = ""; block.desc = ""; }
    if (type === "div")  { block.content = ""; block.url = ""; block.public_id = ""; block.desc = ""; block.side = "right"; block.shape = "square"; }
    setFormData((prev) => ({
      ...prev,
      [currLang]: { ...prev[currLang], blocks: [...prev[currLang].blocks, block] },
    }));
    setIdCount((c) => c + 1);
  };

  const deleteBlock = (id) => {
    setFormData((prev) => {
      const block = prev[currLang].blocks.find((b) => b.id === id);
      if (block && (block.type === "img" || block.type === "div") && block.public_id) {
        deleteImage(block.public_id);
      }
      return {
        ...prev,
        [currLang]: {
          ...prev[currLang],
          blocks: prev[currLang].blocks.filter((b) => b.id !== id),
        },
      };
    });
  };

  const updateBlock = async (id, e, lang = currLang) => {
    if (e.target?.name === "file") {
      const file = e.target.files[0];
      if (!file) return;
      // Read current block's public_id before async gap
      const blockSnap = formData[lang].blocks.find((b) => b.id === id);
      const imageData  = await uploadImage(file, blockSnap?.public_id, ["block_image"]);
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          blocks: prev[lang].blocks.map((b) =>
            b.id === id ? { ...b, ...imageData } : b
          ),
        },
      }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [lang]: {
          ...prev[lang],
          blocks: prev[lang].blocks.map((b) =>
            b.id === id ? { ...b, [name]: value } : b
          ),
        },
      }));
    }
  };

  // ── Images ──────────────────────────────────────────────────
  const uploadImage = async (file, public_id, tags = []) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tags", tags);
    if (public_id) fd.append("public_id", public_id.split("/")[1]);
    const res = await api.post("/media/upload", fd);
    return res.data;
  };

  const deleteImage = async (public_id) => {
    if (!public_id) return;
    await api.delete("/media/delete-file", { params: { public_id } });
  };

  const handlePreviewImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formData.previewImage?.public_id) {
      await deleteImage(formData.previewImage.public_id);
    }
    const imageData = await uploadImage(file, formData.previewImage?.public_id, ["post_preview"]);
    setFormData((prev) => ({ ...prev, previewImage: imageData }));
  };

  // ── Build diff for edit mode (only changed fields) ─────────
  const buildEditPatch = () => {
    const init  = initialDataRef.current;
    const patch = {};

    // Language content — include only languages that changed
    for (const lang of LANGS) {
      if (JSON.stringify(formData[lang]) !== JSON.stringify(init?.formData?.[lang])) {
        patch[lang] = formData[lang];
      }
    }

    // Preview image
    if (JSON.stringify(formData.previewImage) !== JSON.stringify(init?.formData?.previewImage)) {
      patch.previewImage = formData.previewImage;
    }

    // Scalar metadata
    if (status   !== init?.status)   patch.status   = status;
    if (category !== init?.category) patch.category = category || null;

    // Tags — compare sorted ID lists
    const currentTagIds = selectedTags.map((t) => t._id || t).sort();
    const initTagIds    = [...(init?.tags ?? [])].sort();
    if (currentTagIds.join(",") !== initTagIds.join(",")) {
      patch.tags = currentTagIds;
    }

    return patch;
  };

  // ── Save ────────────────────────────────────────────────────
  const savePost = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        const patch = buildEditPatch();

        if (Object.keys(patch).length === 0) {
          alert("Нет изменений для сохранения");
          return;
        }

        await api.put(`/posts/${postId}`, patch);

        // Update snapshot so next save computes diff from new state
        initialDataRef.current = {
          formData: { ...formData },
          status,
          category,
          tags: selectedTags.map((t) => t._id || t),
        };

        alert("Статья обновлена");
      } else {
        const payload = {
          en: formData.en,
          ru: formData.ru,
          kg: formData.kg,
          previewImage: formData.previewImage,
          status,
          category: category || undefined,
          tags: selectedTags.map((t) => t._id || t),
        };
        await api.post("/posts/", payload);
        alert("Статья создана");
        deleteDraft(draftIdRef.current);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  // ── Draft load ───────────────────────────────────────────────
  const loadDraft = (id) => {
    const stored = useDraftStore.getState().drafts[id];
    if (!stored?.formData) return;
    setFormData(stored.formData);
    setCurrLang(stored.currLang || "ru");
    setIdCount(stored.formData.idCount || 1);
    draftIdRef.current = id;
    setOpenDrafts(false);
  };

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Загрузка статьи...
      </div>
    );
  }

  const cur = formData[currLang];

  // ── Block delete button ──────────────────────────────────────
  const DeleteBtn = ({ id }) => (
    <button
      className="absolute top-2 right-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
      onClick={() => deleteBlock(id)}
    >
      Delete
    </button>
  );

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Post" : "Create Post"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Drafts — create mode only */}
          {!isEdit && (
            <Dialog.Root open={openDrafts} onOpenChange={setOpenDrafts}>
              <Dialog.Trigger className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700">
                <List size={16} />
                <span className="text-sm">Drafts</span>
              </Dialog.Trigger>
              <Dialog.Content className="fixed right-6 top-16 w-96 bg-[#0b0b0b] border border-gray-800 p-4 rounded shadow-lg z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Drafts</h3>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {listDrafts().length === 0 ? (
                    <div className="text-sm text-gray-500">No drafts</div>
                  ) : (
                    listDrafts().map((d) => (
                      <div key={d.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                        <div>
                          <div className="text-sm font-medium">
                            {d.formData?.[d.currLang || "ru"]?.title || "Untitled"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(d.updatedAt || d.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-violet-600 rounded text-sm" onClick={() => loadDraft(d.id)}>
                            Open
                          </button>
                          <button className="px-2 py-1 bg-red-700 rounded text-sm" onClick={() => deleteDraft(d.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Root>
          )}

          <button
            className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50"
            onClick={savePost}
            disabled={saving}
          >
            <Save size={14} />
            {saving ? "Saving..." : isEdit ? "Save changes" : "Publish"}
          </button>
        </div>
      </header>

      {/* Preview image */}
      <div className="mb-4">
        <input
          className="hidden"
          type="file"
          id="preview-image"
          accept="image/*"
          onChange={handlePreviewImage}
        />
        {formData.previewImage?.url ? (
          <div className="relative">
            <img className="max-h-64 mx-auto" src={formData.previewImage.url} alt="Preview" />
            <button
              className="absolute top-2 right-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded"
              onClick={async () => {
                await deleteImage(formData.previewImage.public_id);
                setFormData((prev) => ({ ...prev, previewImage: { public_id: "", url: "" } }));
              }}
            >
              Delete
            </button>
          </div>
        ) : (
          <label
            className="flex items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded cursor-pointer hover:border-violet-600"
            htmlFor="preview-image"
          >
            <span className="text-gray-500">Click to upload preview image</span>
          </label>
        )}
      </div>

      {/* Metadata: status · category · tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-900 rounded border border-gray-800">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">— No category —</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.title?.ru || cat.title?.en || cat.title?.kg || "—"}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2 md:col-span-3">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tags</label>
          <TagPickerDialog
            selectedTags={selectedTags}
            allTags={allTags}
            onTagsChange={setSelectedTags}
            onTagCreated={(tag) => setAllTags((prev) => [tag, ...prev])}
            lang={currLang}
          />
          {/* Selected tags strip */}
          {selectedTags.length > 0 && (
            <div className="text-gray-400 flex flex-wrap gap-1.5 mt-0.5">
              {selectedTags.map((tag) => (
                <TagChip
                  key={tag._id || tag}
                  tag={tag}
                  lang={currLang}
                  onRemove={(id) =>
                    setSelectedTags((prev) => prev.filter((t) => (t._id || t) !== id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Language tabs */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {LANGS.map((lang) => (
          <button
            key={lang}
            onClick={() => switchLang(lang)}
            className={`py-2 rounded transition ${
              currLang === lang ? "bg-violet-700" : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Title & description */}
      <div className="space-y-4">
        <div>
          <input
            className="w-full p-4 bg-transparent border-b border-gray-700 text-4xl font-bold focus:outline-none focus:border-violet-600"
            type="text"
            placeholder="Title"
            value={cur.title}
            onChange={(e) => setField("title", e.target.value)}
          />
          <input
            className="w-full p-2 bg-transparent border-b border-gray-700 mt-2 text-xl focus:outline-none focus:border-violet-600"
            type="text"
            placeholder="Description"
            value={cur.desc}
            onChange={(e) => setField("desc", e.target.value)}
          />
        </div>

        {/* Content blocks */}
        <div className="space-y-4">
          {cur.blocks.map((block) => {
            switch (block.type) {
              case "h":
                return (
                  <div className="relative m-2" key={block.id}>
                    <input
                      className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent text-2xl font-semibold"
                      type="text"
                      placeholder="Heading"
                      name="content"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e)}
                    />
                    <DeleteBtn id={block.id} />
                  </div>
                );

              case "p":
                return (
                  <div className="relative m-2" key={block.id}>
                    <textarea
                      className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent"
                      placeholder="Paragraph"
                      name="content"
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, e)}
                    />
                    <DeleteBtn id={block.id} />
                  </div>
                );

              case "img":
                return (
                  <div className="relative flex flex-col justify-center gap-3" key={block.id}>
                    <input
                      className="hidden"
                      type="file"
                      id={`file-${block.id}`}
                      name="file"
                      accept="image/*"
                      onChange={(e) => updateBlock(block.id, e)}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <label className="cursor-pointer" htmlFor={`file-${block.id}`}>
                        {block.url ? (
                          <img className="max-h-64" src={block.url} alt={block.desc} />
                        ) : (
                          <div className="h-64 w-96 bg-gray-800 flex items-center justify-center text-4xl">
                            <Plus />
                          </div>
                        )}
                      </label>
                      <input
                        className="w-full max-w-xl border-b border-gray-700 p-2 bg-transparent"
                        type="text"
                        placeholder="Description"
                        name="desc"
                        value={block.desc}
                        onChange={(e) => updateBlock(block.id, e)}
                      />
                    </div>
                    <DeleteBtn id={block.id} />
                  </div>
                );

              case "div":
                return (
                  <div className="relative m-2" key={block.id}>
                    <div className={`flex ${block.side === "left" ? "flex-row-reverse" : "flex-row"}`}>
                      <textarea
                        className="basis-2/3 p-4 bg-transparent border-b border-gray-700 min-h-[200px]"
                        placeholder="Paragraph"
                        name="content"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, e)}
                      />
                      <div className="basis-1/3 flex flex-col items-center gap-3 p-3">
                        <input
                          className="hidden"
                          type="file"
                          id={`file-div-${block.id}`}
                          name="file"
                          accept="image/*"
                          onChange={(e) => updateBlock(block.id, e)}
                        />
                        <label
                          className="cursor-pointer h-48 flex items-center justify-center"
                          htmlFor={`file-div-${block.id}`}
                        >
                          {block.url ? (
                            <img
                              className={block.shape === "circle" ? "rounded-full" : ""}
                              src={block.url}
                              alt={block.desc}
                            />
                          ) : (
                            <div
                              className={`h-48 w-48 bg-gray-800 flex items-center justify-center text-2xl ${
                                block.shape === "circle" ? "rounded-full" : ""
                              }`}
                            >
                              +
                            </div>
                          )}
                        </label>
                        <input
                          className="w-full border-b border-gray-700 p-2 bg-transparent"
                          type="text"
                          placeholder="Description"
                          name="desc"
                          value={block.desc}
                          onChange={(e) => updateBlock(block.id, e)}
                        />
                        <label className="flex gap-2 items-center">
                          <span className="text-sm">Shape</span>
                          <select
                            className="bg-transparent"
                            name="shape"
                            value={block.shape}
                            onChange={(e) => updateBlock(block.id, e)}
                          >
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                          </select>
                        </label>
                        <label className="flex gap-2 items-center">
                          <span className="text-sm">Side</span>
                          <select
                            className="bg-transparent"
                            name="side"
                            value={block.side}
                            onChange={(e) => updateBlock(block.id, e)}
                          >
                            <option value="right">Right</option>
                            <option value="left">Left</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <DeleteBtn id={block.id} />
                  </div>
                );

              default:
                return <p key={block.id} className="text-red-500">UNDEFINED BLOCK</p>;
            }
          })}
        </div>

        {/* Add block */}
        <div className="flex gap-2 mt-4">
          {["h", "p", "img", "div"].map((type) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700"
            >
              <Plus size={14} /> Add {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default PostEditor;
