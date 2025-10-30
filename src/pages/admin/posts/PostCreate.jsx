import React, { useEffect, useRef, useState } from "react";
import api from '../../../api';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import useDraftStore from "../../../stores/draftStore";
import * as Dialog from '@radix-ui/react-dialog';
import { List, Save, Trash2, Plus } from "lucide-react";

/*
  Изменённый PostCreate:
  - автосохранение черновика в zustand (localStorage)
  - простая панель Drafts (Radix Dialog) для просмотра/загрузки/удаления
  - небольшие UI-изменения (Tailwind + иконки) — минималистичный современный вид
*/

/* Новая логика: встроенный редактор Test рядом с Post.
   - опция "Include test" (по-умолчанию выключена)
   - тест привязан к post id (schema: test._id === post._id)
   - при создании нового поста сначала создаём/обновляем post, затем создаём/обновляем test
   - минималистичный UI: список вопросов, редактирование текста на текущем языке, добавление опций
*/

const emptyQuestion = () => ({
  id: Date.now().toString(),
  type: 'single', // single | multiple | open
  en: { text: '', options: [] },
  ru: { text: '', options: [] },
  kg: { text: '', options: [] }
});

const PostCreate = () => {
  // post/editor state (existing)
  const formDataRef = useRef({
    previewImageUrl: {public_id: "", url: ""},
    ru: {title: "", desc: "", blocks: []},
    en: {title: "", desc: "", blocks: []},
    kg: {title: "", desc: "", blocks: []},
  });

  const { user } = useAuth();
  const { lang } = useLanguage();

  const [currLang, setCurrLang] = useState(lang || 'ru');
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [idCount, setIdCount] = useState(1);
  const [status, setStatus] = useState('draft');

  // draft store (existing)
  const setDraft = useDraftStore(state => state.setDraft);
  const updateDraft = useDraftStore(state => state.updateDraft);
  const deleteDraft = useDraftStore(state => state.deleteDraft);
  const listDrafts = useDraftStore(state => state.listDrafts);

  // edit mode
  const [searchParams] = useSearchParams();
  const postIdRef = useRef(searchParams.get('post') || null);
  const navigate = useNavigate();

  // Test related state
  const [includeTest, setIncludeTest] = useState(false);
  const [testLoaded, setTestLoaded] = useState(false);
  const [questions, setQuestions] = useState([]); // array of question objects (see emptyQuestion)
  const [testSaving, setTestSaving] = useState(false);

  // load post (existing) and its test when editing
  useEffect(() => {
    (async () => {
      const pid = postIdRef.current;
      if (!pid) return;
      try {
        const res = await api.get(`/posts/${pid}`);
        const p = res.data?.data || res.data;
        if (p) {
          // fill formDataRef from returned payload (handle single-lang or multi-lang)
          if (p.title || p.desc) {
            formDataRef.current[currLang] = { title: p.title || "", desc: p.desc || "", blocks: p.blocks || [] };
          } else {
            formDataRef.current.ru = p.ru || formDataRef.current.ru;
            formDataRef.current.en = p.en || formDataRef.current.en;
            formDataRef.current.kg = p.kg || formDataRef.current.kg;
          }
          setStatus(p.status || 'draft');
          setPreviewImageUrl(p.previewPhoto?.url || formDataRef.current.previewImage?.url || "");
          setTitle(formDataRef.current[currLang]?.title || "");
          setDesc(formDataRef.current[currLang]?.desc || "");
          setBlocks(formDataRef.current[currLang]?.blocks || []);
        }
      } catch (e) {
        console.error("Load post failed", e);
      }

      // load test for this post id (test._id === post._id per backend)
      try {
        const tRes = await api.get(`/tests/${postIdRef.current}`);
        const t = tRes.data?.data || tRes.data;
        if (t && Array.isArray(t.questions)) {
          setQuestions(t.questions.map((q) => ({ ...q, id: q._id || q.id || Date.now().toString() })));
          setIncludeTest(true);
          setTestLoaded(true);
        }
      } catch (e) {
        // no test exists — okay
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // helper: collect post payload
  const collectPostPayload = () => {
    formDataRef.current[currLang] = { title, desc, blocks };
    return {
      ru: formDataRef.current.ru,
      en: formDataRef.current.en,
      kg: formDataRef.current.kg,
      previewPhoto: formDataRef.current.previewImage || null,
      status
    };
  };

  // --- Test helpers ---
  const addQuestion = (type = 'single') => {
    setQuestions(prev => [...prev, { ...emptyQuestion(), type }]);
  };

  const removeQuestion = (qid) => {
    setQuestions(prev => prev.filter(q => q.id !== qid));
  };

  const updateQuestionField = (qid, fieldPath, value) => {
    // fieldPath e.g. "en.text" or "ru.options" or "type"
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      if (fieldPath === 'type') return { ...q, type: value };
      const [langKey, key] = fieldPath.split('.');
      return { ...q, [langKey]: { ...q[langKey], [key]: value } };
    }));
  };

  const addOption = (qid) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const forLang = currLang;
      const opts = q[forLang]?.options || [];
      const newOpt = { text: '', isCorrect: false };
      return { ...q, [forLang]: { ...q[forLang], options: [...opts, newOpt] } };
    }));
  };

  const updateOption = (qid, optIndex, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const langKey = currLang;
      const opts = (q[langKey]?.options || []).map((o, i) => i === optIndex ? { ...o, text: value } : o);
      return { ...q, [langKey]: { ...q[langKey], options: opts } };
    }));
  };

  const toggleOptionCorrect = (qid, optIndex) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qid) return q;
      const langKey = currLang;
      let opts = q[langKey]?.options || [];
      if (q.type === 'single') {
        opts = opts.map((o, i) => ({ ...o, isCorrect: i === optIndex }));
      } else {
        opts = opts.map((o, i) => i === optIndex ? { ...o, isCorrect: !o.isCorrect } : o);
      }
      return { ...q, [langKey]: { ...q[langKey], options: opts } };
    }));
  };

  // save test for given postId (create or patch). backend expects test._id === postId
  const saveTest = async (postId) => {
    if (!includeTest) return;
    setTestSaving(true);
    const payload = { questions };
    try {
      // try create/update: try PATCH first, fallback to POST
      await api.patch(`/tests/${postId}`, payload);
    } catch (e) {
      try {
        await api.post(`/tests`, { _id: postId, ...payload });
      } catch (e2) {
        console.error('Save test failed', e2);
        throw e2;
      }
    } finally {
      setTestSaving(false);
    }
  };

  // Save post (create/patch). if includeTest -> saveTest after post saved/created
  const savePost = async () => {
    const pid = postIdRef.current;
    const payload = collectPostPayload();
    try {
      if (pid) {
        await api.patch(`/posts/${pid}`, payload);
      } else {
        const { data } = await api.post('/posts', payload);
        const createdId = data?.data?._id || data?.data?.id || data?._id;
        if (createdId) {
          postIdRef.current = createdId;
          // update URL
          navigate(`?post=${createdId}`, { replace: true });
        }
      }
      // if test included, save it (test._id === postIdRef.current)
      if (includeTest) {
        if (!postIdRef.current) throw new Error('Post id missing after save');
        await saveTest(postIdRef.current);
      }
      // autosave draft
      if (postIdRef.current) setDraft(postIdRef.current, { createdAt: Date.now(), updatedAt: Date.now(), currLang, formData: formDataRef.current, idCount, status });
    } catch (e) {
      console.error("Save failed", e);
      throw e;
    }
  };

  // delete test endpoint
  const deleteTest = async () => {
    if (!postIdRef.current) return;
    try {
      await api.delete(`/tests/${postIdRef.current}`);
      setQuestions([]);
      setIncludeTest(false);
      setTestLoaded(false);
    } catch (e) {
      console.error('Delete test failed', e);
    }
  };

  // --- UI render ---
  return (
    <>
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{postIdRef.current ? "Edit Post & Test" : "Create Post & Test"}</h1>

        <div className="flex items-center gap-3">
          <select value={status} onChange={e=>setStatus(e.target.value)} className="bg-gray-900 px-3 py-2 rounded">
            <option value="draft">Draft</option>
            <option value="public">Public</option>
            <option value="hidden">Hidden</option>
          </select>

          <button onClick={savePost} className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 flex items-center gap-2">
            <Save size={14}/> Save
          </button>

          <button onClick={async()=>{ setStatus('public'); await savePost(); }} className="px-3 py-2 bg-green-600 rounded hover:bg-green-500 flex items-center gap-2">
            Publish
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {["ru", "en", "kg"].map(l => (
          <button key={l} onClick={() => {
            // persist current lang values to ref and switch
            formDataRef.current[currLang] = { title, desc, blocks };
            setCurrLang(l);
            setTitle(formDataRef.current[l]?.title || "");
            setDesc(formDataRef.current[l]?.desc || "");
            setBlocks(formDataRef.current[l]?.blocks || []);
          }} className={`py-2 rounded ${currLang === l ? 'bg-violet-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {/* Post editor */}
        <div>
          <input className="w-full p-4 bg-transparent border-b border-gray-700 text-4xl font-bold" name="title" type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)}/>
          <input className="w-full p-2 bg-transparent border-b border-gray-700 mt-2 text-xl" name="desc" type="text" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)}/>
        </div>

        {/* Blocks (kept minimal) */}
        <div className="space-y-4">
          {blocks.map(block => {
            return <div key={block.id} className="p-2 bg-gray-900 rounded">Block {block.type}</div>;
          })}
        </div>

        <div className="flex gap-2 mt-4">
          {['h','p','img','div'].map(t => (
            <button key={t} onClick={()=> {
              const newBlock = { id: idCount, type: t, content: '' };
              setBlocks(prev => [...prev, newBlock]);
              setIdCount(c => c+1);
            }} className="px-3 py-2 bg-gray-800 rounded hover:bg-gray-700 flex items-center gap-2">
              <Plus size={12}/> Add {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Test editor */}
        <section className="mt-6 p-4 bg-gray-900 rounded">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <input id="includeTest" type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} />
              <label htmlFor="includeTest" className="text-sm">Include Test for this post</label>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => addQuestion('single')} className="px-2 py-1 bg-gray-800 rounded">Add Q</button>
              <button onClick={async () => { if (postIdRef.current) await deleteTest(); }} className="px-2 py-1 bg-red-700 rounded text-sm">Delete Test</button>
            </div>
          </div>

          {includeTest ? (
            <div className="space-y-3">
              {questions.length === 0 && <div className="text-sm text-gray-500">No questions yet. Add one.</div>}
              {questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-gray-800 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Q{idx+1}</div>
                    <div className="flex items-center gap-2">
                      <select value={q.type} onChange={(e)=> updateQuestionField(q.id, 'type', e.target.value)} className="bg-gray-900 px-2 py-1 rounded text-sm">
                        <option value="single">Single</option>
                        <option value="multiple">Multiple</option>
                        <option value="open">Open</option>
                      </select>
                      <button onClick={() => removeQuestion(q.id)} className="px-2 py-1 bg-red-700 rounded text-sm">Delete</button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <input className="w-full p-2 bg-transparent border border-gray-700 rounded" value={q[currLang]?.text || ''} placeholder={`Question (${currLang})`}
                      onChange={(e) => updateQuestionField(q.id, `${currLang}.text`, e.target.value)} />
                  </div>

                  {(q.type === 'single' || q.type === 'multiple') && (
                    <div className="space-y-2">
                      {(q[currLang]?.options || []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input type={q.type === 'single' ? 'radio' : 'checkbox'} checked={!!opt.isCorrect} onChange={()=> toggleOptionCorrect(q.id, oi)} />
                          <input className="flex-1 p-2 bg-transparent border border-gray-700 rounded" value={opt.text || ''} onChange={(e)=> updateOption(q.id, oi, e.target.value)} placeholder="Option text"/>
                        </div>
                      ))}
                      <div>
                        <button onClick={()=> addOption(q.id)} className="px-2 py-1 bg-gray-800 rounded text-sm">Add option</button>
                      </div>
                    </div>
                  )}

                  {q.type === 'open' && (
                    <div className="text-xs text-gray-400">Open question — no options.</div>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <button onClick={()=> addQuestion('single')} className="px-3 py-2 bg-gray-800 rounded">Add Single</button>
                <button onClick={()=> addQuestion('multiple')} className="px-3 py-2 bg-gray-800 rounded">Add Multiple</button>
                <button onClick={()=> addQuestion('open')} className="px-3 py-2 bg-gray-800 rounded">Add Open</button>
              </div>

              <div className="pt-3">
                <button disabled={testSaving} onClick={async ()=>{
                  if (!postIdRef.current) {
                    // save post first to obtain id
                    await savePost();
                  }
                  if (postIdRef.current) {
                    await saveTest(postIdRef.current);
                    setTestLoaded(true);
                  }
                }} className="px-3 py-2 bg-violet-700 rounded">
                  Save Test
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Test disabled — enable "Include Test" to add questions.</div>
          )}
        </section>
      </div>
    </>
  )
}

export default PostCreate;