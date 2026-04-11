import { useEffect, useRef, useState } from "react";
import api from '@/api';
import { useSearchParams } from "react-router-dom";
import useDraftStore from "@/stores/draftStore";
import * as Dialog from '@radix-ui/react-dialog';
import { List, Save, Trash2, Plus, X, ChevronDown } from "lucide-react";

const PostEditor = () => {
  const [searchParams] = useSearchParams();

  // --- Режим: edit если есть ?id=, иначе create ---
  const postId = searchParams.get("id");
  const isEdit = !!postId;

  // --- Данные формы (ref, не вызывает ре-рендер) ---
  const formDataRef = useRef(
    isEdit
      ? { previewImage: { public_id: "", url: "" }, en: { title: "", desc: "", blocks: [] }, ru: { title: "", desc: "", blocks: [] }, kg: { title: "", desc: "", blocks: [] } }
      : JSON.parse(localStorage.getItem('newPost')) || { previewImage: { public_id: "", url: "" }, en: { title: "", desc: "", blocks: [] }, ru: { title: "", desc: "", blocks: [] }, kg: { title: "", desc: "", blocks: [] } }
  );

  // --- Состояния редактора ---
  const [currLang, setCurrLang] = useState('ru');
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [idCount, setIdCount] = useState(1);

  // --- Новые поля: статус, категория, теги ---
  const [status, setStatus] = useState("draft");
  const [category, setCategory] = useState("");        // _id выбранной категории
  const [selectedTags, setSelectedTags] = useState([]); // массив объектов тега {_id, name, type}

  // --- Данные для селекторов ---
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagSearch, setTagSearch] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  // --- Состояния загрузки ---
  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // --- Черновики (только create mode) ---
  const setDraft = useDraftStore(state => state.setDraft);
  const updateDraft = useDraftStore(state => state.updateDraft);
  const deleteDraft = useDraftStore(state => state.deleteDraft);
  const listDrafts = useDraftStore(state => state.listDrafts);
  const draftIdRef = useRef(searchParams.get('draft') || `draft-${Date.now()}`);
  const [openDrafts, setOpenDrafts] = useState(false);

  // ─────────────────────────────────────────────
  // Загрузка категорий и тегов при монтировании
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          api.get('/category'),
          api.get('/tags', { params: { size: 100 } }),
        ]);
        const catRaw = catRes.data?.data;
        const tagRaw = tagRes.data?.data;
        setCategories(Array.isArray(catRaw) ? catRaw : []);
        setAllTags(Array.isArray(tagRaw) ? tagRaw : []);
      } catch (e) {
        console.error("Не удалось загрузить категории/теги:", e);
      }
    };
    fetchMeta();
  }, []);

  // ─────────────────────────────────────────────
  // Загрузка статьи для редактирования
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;

    const fetchPost = async () => {
      try {
        setLoadingPost(true);
        const res = await api.get(`/posts/${postId}`, { params: { lang: 'en', details: true } });
        const post = res.data?.data || res.data;

        // Заполняем formDataRef (kg может быть null если не переведено)
        const normLang = (obj) => ({
          title: obj?.title || "",
          desc: obj?.desc || "",
          blocks: Array.isArray(obj?.blocks) ? obj.blocks : [],
        });
        formDataRef.current = {
          previewImage: post.previewImage || { public_id: "", url: "" },
          en: normLang(post.en),
          ru: normLang(post.ru),
          kg: normLang(post.kg),
        };

        // Вычисляем maxId из существующих блоков
        const allBlocks = [
          ...(post.en?.blocks || []),
          ...(post.ru?.blocks || []),
          ...(post.kg?.blocks || []),
        ];
        const maxId = allBlocks.reduce((max, b) => Math.max(max, typeof b.id === 'number' ? b.id : 0), 0);
        const nextId = maxId + 1;
        formDataRef.current.idCount = nextId;
        setIdCount(nextId);

        // Устанавливаем отображаемый язык
        const lang = 'ru';
        setCurrLang(lang);
        setTitle(post[lang]?.title || "");
        setDesc(post[lang]?.desc || "");
        setBlocks(post[lang]?.blocks || []);
        setPreviewImageUrl(post.previewImage?.url || "");

        // Новые поля
        setStatus(post.status || "draft");
        setCategory(post.category?._id || post.category || "");
        setSelectedTags(Array.isArray(post.tags) ? post.tags : []);
      } catch (e) {
        console.error("Не удалось загрузить статью:", e);
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPost();
  }, [postId]);

  // ─────────────────────────────────────────────
  // Автосохранение черновика (только create mode)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (isEdit) return;

    const id = draftIdRef.current;
    formDataRef.current[currLang] = { title, desc, blocks };
    formDataRef.current.previewImage = formDataRef.current.previewImage || {};
    formDataRef.current.idCount = idCount;

    const stored = useDraftStore.getState().drafts[id];
    if (stored && stored?.formData) {
      updateDraft(id, { updatedAt: Date.now(), currLang, formData: formDataRef.current });
    } else {
      setDraft(id, { createdAt: Date.now(), updatedAt: Date.now(), currLang, formData: formDataRef.current, idCount });
    }
  }, [title, desc, blocks, previewImageUrl, currLang, idCount, isEdit]);

  // ─────────────────────────────────────────────
  // Черновики: загрузка
  // ─────────────────────────────────────────────
  const loadDraft = (id) => {
    const stored = useDraftStore.getState().drafts[id];
    if (!stored || !stored.formData) return;
    formDataRef.current = stored.formData;
    const lang = stored.currLang || 'ru';
    setCurrLang(lang);
    setPreviewImageUrl(formDataRef.current.previewImage?.url || "");
    setTitle(formDataRef.current[lang]?.title || "");
    setDesc(formDataRef.current[lang]?.desc || "");
    setBlocks(formDataRef.current[lang]?.blocks || []);
    setIdCount(formDataRef.current.idCount || 1);
    draftIdRef.current = id;
    setOpenDrafts(false);
  };

  // ─────────────────────────────────────────────
  // Смена языка: сохранить текущий, загрузить новый
  // ─────────────────────────────────────────────
  const updateAllData = (lang = currLang) => {
    formDataRef.current[currLang] = { title, desc, blocks };

    setTitle(formDataRef.current[lang]?.title || "");
    setDesc(formDataRef.current[lang]?.desc || "");
    setBlocks(syncBlocks(formDataRef.current[lang]?.blocks || [], blocks));
    setCurrLang(lang);
  };

  // ─────────────────────────────────────────────
  // Синхронизация блоков между языками
  // ─────────────────────────────────────────────
  const syncBlocks = (oldBlocks, newBlocks) => {
    const oldMap = oldBlocks.reduce((map, block) => {
      switch (block.type) {
        case 'img': map[block.id] = { desc: block.desc }; break;
        case 'div': map[block.id] = { desc: block.desc, content: block.content }; break;
        case 'h': case 'p': map[block.id] = { content: block.content }; break;
        default: map[block.id] = { Error: true };
      }
      return map;
    }, {});

    return newBlocks.map(block => {
      switch (block.type) {
        case "img": return { ...block, desc: oldMap[block.id]?.desc || "" };
        case "div": return { ...block, desc: oldMap[block.id]?.desc || "", content: oldMap[block.id]?.content || "" };
        default: return { ...block, content: oldMap[block.id]?.content || "" };
      }
    });
  };

  // ─────────────────────────────────────────────
  // Блоки: добавить / обновить / удалить
  // ─────────────────────────────────────────────
  const addBlock = (type) => {
    const newBlock = { id: idCount, type };
    switch (type) {
      case "h": case "p": newBlock.content = ''; break;
      case 'img': newBlock.public_id = ''; newBlock.url = ''; newBlock.desc = ''; break;
      case 'div':
        newBlock.content = ''; newBlock.url = ''; newBlock.public_id = '';
        newBlock.desc = ''; newBlock.side = 'right'; newBlock.shape = 'square';
        break;
      default: console.error("❌ Неизвестный тип блока"); break;
    }
    setBlocks(prev => [...prev, newBlock]);
    setIdCount(prev => prev + 1);
  };

  const uploadImage = async (file, public_id, tags = []) => {
    if (!file) return false;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tags", tags);
    if (public_id && public_id !== "") formData.append("public_id", public_id.split('/')[1]);
    const res = await api.post('/media/upload', formData);
    return res.data;
  };

  const deleteImage = async (public_id) => {
    if (!public_id) return false;
    const res = await api.delete('/media/delete-file', { params: { public_id } });
    return res.data;
  };

  const previewImageHandle = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (formDataRef.current.previewImage?.public_id) {
      await deleteImage(formDataRef.current.previewImage.public_id);
    }
    const imageData = await uploadImage(file, formDataRef.current.previewImage?.public_id, ['post_preview']);
    formDataRef.current.previewImage = imageData;
    setPreviewImageUrl(imageData.url);
  };

  const updateBlock = async (id, e) => {
    const newBlocks = [];
    for (let block of blocks) {
      if (block.id !== id) { newBlocks.push(block); continue; }
      if (e.target?.name === "file") {
        const file = e.target.files[0];
        if (!file) { newBlocks.push(block); continue; }
        const imageData = await uploadImage(file, block.public_id, ['block_image']);
        newBlocks.push({ ...block, ...imageData });
      } else {
        newBlocks.push({ ...block, [e.target?.name]: e.target?.value });
      }
    }
    setBlocks(newBlocks);
  };

  const deleteBlock = (id) => {
    setBlocks(blocks.filter(block => {
      if (block.id === id) {
        if ((block.type === 'img' || block.type === 'div') && block.public_id) {
          deleteImage(block.public_id);
        }
        return false;
      }
      return true;
    }));
  };

  // ─────────────────────────────────────────────
  // Теги: добавить / удалить
  // ─────────────────────────────────────────────
  const addTag = (tag) => {
    const alreadyAdded = selectedTags.some(t => (t._id || t) === (tag._id || tag));
    if (!alreadyAdded) setSelectedTags(prev => [...prev, tag]);
    setTagSearch("");
    setTagDropdownOpen(false);
  };

  const removeTag = (tagId) => {
    setSelectedTags(prev => prev.filter(t => (t._id || t) !== tagId));
  };

  const getTagName = (tag) => {
    if (!tag) return "";
    if (typeof tag === 'string') {
      const found = allTags.find(t => t._id === tag);
      return found?.name?.[currLang] || found?.name?.en || tag;
    }
    return tag.name?.[currLang] || tag.name?.en || tag._id || "";
  };

  const filteredTagOptions = allTags.filter(tag => {
    const alreadySelected = selectedTags.some(s => (s._id || s) === tag._id);
    if (alreadySelected) return false;
    if (!tagSearch) return true;
    const q = tagSearch.toLowerCase();
    return (
      tag.name?.en?.toLowerCase().includes(q) ||
      tag.name?.ru?.toLowerCase().includes(q) ||
      tag.name?.kg?.toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────
  // Сохранение поста (create → POST, edit → PATCH)
  // ─────────────────────────────────────────────
  const savePost = async () => {
    // Записываем текущий язык в ref напрямую (не через updateAllData —
    // она вызывает setState, которые применятся только на следующем рендере)
    formDataRef.current[currLang] = { title, desc, blocks };

    // Синхронизируем блоки других языков со структурой текущего
    for (const lang of ['en', 'ru', 'kg']) {
      if (lang === currLang) continue;
      formDataRef.current[lang].blocks = syncBlocks(
        formDataRef.current[lang].blocks,
        blocks
      );
    }

    const payload = {
      en: formDataRef.current.en,
      ru: formDataRef.current.ru,
      kg: formDataRef.current.kg,
      previewImage: formDataRef.current.previewImage,
      status,
      category: category || undefined,
      tags: selectedTags.map(t => t._id || t),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/posts/${postId}`, payload);
        alert('Статья успешно обновлена');
      } else {
        await api.post('/posts/', payload);
        alert('Статья успешно создана');
        deleteDraft(draftIdRef.current);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Компоненты блоков
  // ─────────────────────────────────────────────
  const DeleteButton = (id) => (
    <button
      className="absolute top-2 right-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded"
      onClick={() => deleteBlock(id)}
    >
      Delete
    </button>
  );

  const HeadingBlock = (block) => (
    <div className="relative m-2" key={block.id}>
      <input
        className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent text-2xl font-semibold"
        type="text" placeholder="Heading"
        name="content" value={block.content}
        onChange={(e) => updateBlock(block.id, e)}
      />
      {DeleteButton(block.id)}
    </div>
  );

  const ParagraphBlock = (block) => (
    <div className="relative m-2" key={block.id}>
      <textarea
        className="border-b-2 border-gray-700 focus:border-violet-600 w-full p-3 bg-transparent"
        placeholder="Paragraph"
        name="content" value={block.content}
        onChange={(e) => updateBlock(block.id, e)}
      />
      {DeleteButton(block.id)}
    </div>
  );

  const ImageBlock = (block) => (
    <div className="relative flex flex-col justify-center gap-3" key={block.id}>
      <input className="hidden" type="file" id={`file-${block.id}`} name="file" accept="image/*" onChange={(e) => updateBlock(block.id, e)} />
      <div className="flex flex-col items-center gap-3">
        <label className='cursor-pointer' htmlFor={`file-${block.id}`}>
          {block.url
            ? <img className="max-h-64" src={block.url} alt={block.desc} />
            : <div className="h-64 w-96 bg-gray-800 flex items-center justify-center text-4xl"><Plus /></div>}
        </label>
        <input
          className="w-full max-w-xl border-b border-gray-700 p-2 bg-transparent"
          type="text" placeholder="Description"
          name="desc" value={block.desc}
          onChange={(e) => updateBlock(block.id, e)}
        />
      </div>
      {DeleteButton(block.id)}
    </div>
  );

  const DivBlock = (block) => (
    <div className="relative m-2" key={block.id}>
      <div className={`flex ${block.side === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
        <textarea
          className="basis-2/3 p-4 bg-transparent border-b border-gray-700 min-h-[200px]"
          placeholder="Paragraph" name="content" value={block.content}
          onChange={(e) => updateBlock(block.id, e)}
        />
        <div className="basis-1/3 flex flex-col items-center gap-3 p-3">
          <input className="hidden" type="file" id={`file-div-${block.id}`} name="file" accept="image/*" onChange={(e) => updateBlock(block.id, e)} />
          <label className='cursor-pointer h-48 flex items-center justify-center' htmlFor={`file-div-${block.id}`}>
            {block.url
              ? <img className={block.shape === "circle" ? 'rounded-full' : ''} src={block.url} alt={block.desc} />
              : <div className={`h-48 w-48 bg-gray-800 flex items-center justify-center text-2xl ${block.shape === "circle" ? 'rounded-full' : ''}`}>+</div>}
          </label>
          <input className="w-full border-b border-gray-700 p-2 bg-transparent" type="text" placeholder="Description" name="desc" value={block.desc} onChange={(e) => updateBlock(block.id, e)} />
          <label className="flex gap-2 items-center">
            <span className="text-sm">Shape</span>
            <select className="bg-transparent" name="shape" onChange={(e) => updateBlock(block.id, e)}>
              <option value="square">Square</option>
              <option value="circle">Circle</option>
            </select>
          </label>
          <label className="flex gap-2 items-center">
            <span className="text-sm">Side</span>
            <select className="bg-transparent" name="side" onChange={(e) => updateBlock(block.id, e)}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </label>
        </div>
      </div>
      {DeleteButton(block.id)}
    </div>
  );

  // ─────────────────────────────────────────────
  // Загрузка статьи в edit mode
  // ─────────────────────────────────────────────
  if (loadingPost) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Загрузка статьи...
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Рендер
  // ─────────────────────────────────────────────
  return (
    <>
      {/* Шапка */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          {isEdit ? "Edit Post" : "Create Post"}
        </h1>

        <div className="flex items-center gap-3">
          {/* Черновики (только create mode) */}
          {!isEdit && (
            <Dialog.Root open={openDrafts} onOpenChange={setOpenDrafts}>
              <Dialog.Trigger className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700">
                <List size={16} />
                <span className="text-sm">Drafts</span>
              </Dialog.Trigger>
              <Dialog.Content className="fixed right-6 top-16 w-96 bg-[#0b0b0b] border border-gray-800 p-4 rounded shadow-lg z-50">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Drafts</h3>
                  <button
                    className="text-sm text-violet-400"
                    onClick={() => setDraft(draftIdRef.current, { createdAt: Date.now(), currLang, formData: formDataRef.current })}
                  >
                    <Save size={14} /> Save
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {listDrafts().length === 0
                    ? <div className="text-sm text-gray-500">No drafts</div>
                    : listDrafts().map(d => (
                      <div key={d.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                        <div>
                          <div className="text-sm font-medium">{d.formData?.[d.currLang || 'ru']?.title || 'Untitled'}</div>
                          <div className="text-xs text-gray-500">{new Date(d.updatedAt || d.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-violet-600 rounded text-sm" onClick={() => loadDraft(d.id)}>Open</button>
                          <button className="px-2 py-1 bg-red-700 rounded text-sm" onClick={() => deleteDraft(d.id)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </Dialog.Content>
            </Dialog.Root>
          )}

          {/* Кнопка сохранения */}
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

      {/* Превью изображение */}
      <div>
        <input className="hidden" type="file" id="preview-image" name="preview-image" accept="image/*" onChange={previewImageHandle} />
        {previewImageUrl
          ? <div className="mb-4 relative">
              <img className="max-h-64 mx-auto" src={previewImageUrl} alt="Preview" />
              <button
                className="absolute top-2 right-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded"
                onClick={async () => {
                  await deleteImage(formDataRef.current.previewImage.public_id);
                  formDataRef.current.previewImage = { public_id: "", url: "" };
                  setPreviewImageUrl("");
                }}
              >
                Delete
              </button>
            </div>
          : <label
              className="mb-4 flex items-center justify-center h-32 border-2 border-dashed border-gray-700 rounded cursor-pointer hover:border-violet-600"
              htmlFor="preview-image"
            >
              <span className="text-gray-500">Click to upload preview image</span>
            </label>
        }
      </div>

      {/* Метаданные: статус, категория, теги */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-4 bg-gray-900 rounded border border-gray-800">
        {/* Статус */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        {/* Категория */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="">— No category —</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.title}</option>
            ))}
          </select>
        </div>

        {/* Теги */}
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tags</label>

          {/* Поле поиска тега */}
          <div className="relative">
            <div
              className="flex items-center bg-gray-800 border border-gray-700 rounded px-3 py-2 cursor-text"
              onClick={() => setTagDropdownOpen(true)}
            >
              <input
                type="text"
                value={tagSearch}
                onChange={e => { setTagSearch(e.target.value); setTagDropdownOpen(true); }}
                onFocus={() => setTagDropdownOpen(true)}
                placeholder="Search tags..."
                className="bg-transparent text-sm outline-none flex-1 min-w-0"
              />
              <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </div>

            {/* Дропдаун */}
            {tagDropdownOpen && (
              <>
                {/* Клик вне → закрыть */}
                <div className="fixed inset-0 z-10" onClick={() => setTagDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filteredTagOptions.length === 0
                    ? <div className="px-3 py-2 text-sm text-gray-500">No tags found</div>
                    : filteredTagOptions.map(tag => (
                      <button
                        key={tag._id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center justify-between"
                        onClick={() => addTag(tag)}
                      >
                        <span>{tag.name?.[currLang] || tag.name?.en || tag.name?.ru}</span>
                        <span className="text-xs text-gray-500 ml-2">{tag.type}</span>
                      </button>
                    ))
                  }
                </div>
              </>
            )}
          </div>

          {/* Выбранные теги — chips */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedTags.map(tag => {
                const tagId = tag._id || tag;
                return (
                  <span
                    key={tagId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-800 rounded-full text-xs"
                  >
                    {getTagName(tag)}
                    <button
                      onClick={() => removeTag(tagId)}
                      className="hover:text-red-300"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Переключатель языка */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {["ru", "en", "kg"].map(lang => (
          <button
            key={lang}
            onClick={() => updateAllData(lang)}
            className={`py-2 rounded ${currLang === lang ? 'bg-violet-700' : 'bg-gray-900 hover:bg-gray-800'}`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Заголовок и описание */}
      <div className="space-y-4">
        <div>
          <input
            className="w-full p-4 bg-transparent border-b border-gray-700 text-4xl font-bold focus:outline-none focus:border-violet-600"
            name="title" type="text" placeholder="Title"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full p-2 bg-transparent border-b border-gray-700 mt-2 text-xl focus:outline-none focus:border-violet-600"
            name="desc" type="text" placeholder="Description"
            value={desc} onChange={(e) => setDesc(e.target.value)}
          />
        </div>

        {/* Блоки контента */}
        <div className="space-y-4">
          {blocks.map(block => {
            switch (block.type) {
              case "h": return HeadingBlock(block);
              case "p": return ParagraphBlock(block);
              case "img": return ImageBlock(block);
              case "div": return DivBlock(block);
              default: return <p key={block.id} className="text-red-500">UNDEFINED BLOCK</p>;
            }
          })}
        </div>

        {/* Добавить блок */}
        <div className="flex gap-2 mt-4">
          {['h', 'p', 'img', 'div'].map(type => (
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
