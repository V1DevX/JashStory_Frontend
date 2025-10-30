import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { Edit, Trash2, Search, Download, Plus, RefreshCw, EyeOff, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/*
  Изменения:
  - фикс bug: lang может быть undefined -> используем fallback
  - добавил кнопку Refresh
  - добавил toggle статуса Hidden <-> public/draft (через PATCH /posts/:id)
  - перевод UI по lang
  - edit ведёт на create?post=ID (открывается в PostCreate)
*/

const UI = {
  en: {
    title: "Posts & Tests",
    searchPlaceholder: "Search title or author",
    all: "All",
    public: "Public",
    draft: "Draft",
    hidden: "Hidden",
    archived: "Archived",
    recent: "Recent",
    oldest: "Oldest",
    export: "Export",
    new: "New",
    viewTests: "View",
    noPosts: "No posts found",
    deleteConfirm: (t) => `Delete post "${t}"? This action is irreversible.`,
    publishSuccess: "Status updated",
  },
  ru: {
    title: "Посты и Тесты",
    searchPlaceholder: "Поиск по заголовку или автору",
    all: "Все",
    public: "Опубликовано",
    draft: "Черновик",
    hidden: "Скрыто",
    archived: "Архив",
    recent: "Сначала новые",
    oldest: "Сначала старые",
    export: "Экспорт",
    new: "Новый",
    viewTests: "Просмотр",
    noPosts: "Посты не найдены",
    deleteConfirm: (t) => `Удалить пост "${t}"? Это действие необратимо.`,
    publishSuccess: "Статус обновлён",
  },
  kg: {
    title: "Посттор & Тесттер",
    searchPlaceholder: "Аталышын же авторун изде",
    all: "Бардыгы",
    public: "Жарыяланган",
    draft: "Черновик",
    hidden: "Жашырын",
    archived: "Архив",
    recent: "Жакында",
    oldest: "Эски",
    export: "Экспорт",
    new: "Жаңы",
    viewTests: "Көрүү",
    noPosts: "Посттор табылган жок",
    deleteConfirm: (t) => `Постту өчүрүү "${t}"? Бул иш-чара кайтпайт.`,
    publishSuccess: "Статус жаңыртылды",
  }
}

const StatusBadge = ({ status }) => {
  const cls = status === "public" ? "bg-green-700" :
              status === "draft" ? "bg-yellow-600" :
              status === "hidden" ? "bg-gray-600" : "bg-gray-700";
  return <span className={`text-xs px-2 py-1 rounded ${cls} text-white`}>{status}</span>
}

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLanguage();
  const labels = UI[lang] || UI.en;

  // UI
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDesc, setSortDesc] = useState(true);

  const navigate = useNavigate();

  const fetchList = async () => {
    setLoading(true);
    try {
      // ensure lang fallback so we don't call /tests/undefined
      const l = lang || "en";

      const [pRes, tRes] = await Promise.all([
        api.get(`/posts/${l}`),    // backend expects lang param
        api.get(`/tests/${l}`),
      ]);
      const postsData = pRes.data?.data || pRes.data || [];
      const testsData = tRes.data?.data || tRes.data || [];
      setPosts(postsData);
      setTests(testsData);
    } catch (e) {
      console.error("Failed load posts/tests:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // refetch when lang changes
  }, [lang]);

  // map tests by postId/_id for quick access
  const testsByPost = useMemo(() => {
    const map = new Map();
    for (const t of tests) {
      // test schema: _id is the post's id (shared id). keep fallbacks
      const pid = t._id || t.postId || t.post || t.post_id;
      if (!pid) continue;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid).push(t);
    }
    return map;
  }, [tests]);

  const filtered = useMemo(() => {
    const qlow = q.trim().toLowerCase();
    return posts
      .filter(p => {
        if (statusFilter !== "all" && (p.status || "draft") !== statusFilter) return false;
        if (!qlow) return true;
        const title = (p.title || "").toLowerCase();
        const author = (p.author?.name || p.author || "").toLowerCase();
        return title.includes(qlow) || author.includes(qlow);
      })
      .sort((a,b) => {
        const ta = new Date(a.createdAt || a.created_at || Date.now()).getTime();
        const tb = new Date(b.createdAt || b.created_at || Date.now()).getTime();
        return sortDesc ? tb - ta : ta - tb;
      });
  }, [posts, q, statusFilter, sortDesc]);

  const onEdit = (post) => {
    // open PostCreate in edit mode
    navigate(`create?post=${post._id || post.id}`);
  }

  const onDelete = async (post) => {
    const title = post.title || 'Untitled';
    const ok = window.confirm(labels.deleteConfirm(title));
    if (!ok) return;
    try {
      setPosts(prev => prev.filter(p => (p._id || p.id) !== (post._id || post.id)));
      await api.delete(`/posts/${post._id || post.id}`);
    } catch (e) {
      console.error("Delete failed:", e);
      await fetchList();
    }
  }

  // toggle between hidden and previous (public/draft). For simplicity: if currently hidden -> set to 'public'
  // otherwise set to 'hidden'
  const toggleHidden = async (post) => {
    const id = post._id || post.id;
    const prev = post.status || "draft";
    const newStatus = prev === "hidden" ? "public" : "hidden";
    // optimistic
    setPosts(prevList => prevList.map(p => ((p._id || p.id) === id ? { ...p, status: newStatus } : p)));
    try {
      await api.patch(`/posts/${id}`, { status: newStatus });
      // optional: show toast (omitted)
    } catch (e) {
      console.error("Status update failed", e);
      await fetchList();
    }
  }

  const exportCSV = () => {
    const rows = [
      ["id","title","author","date","status","tests_count","tests_ids"].join(",")
    ];
    for (const p of filtered) {
      const id = p._id || p.id;
      const title = `"${(p.title || "").replace(/"/g, '""')}"`;
      const author = `"${(p.author?.name || p.author || "").replace(/"/g, '""')}"`;
      const date = new Date(p.createdAt || p.created_at || Date.now()).toISOString();
      const status = p.status || "draft";
      const tlist = testsByPost.get(id) || [];
      const tcount = tlist.length;
      const tids = `"${tlist.map(t => t._id || t.id).join(";")}"`;
      rows.push([id, title, author, date, status, tcount, tids].join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `posts_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{labels.title}</h2>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-800 rounded px-2">
            <Search className="text-gray-300" size={14}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={labels.searchPlaceholder} className="bg-transparent outline-none px-2 py-1 text-sm w-64"/>
          </div>

          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-gray-900 px-2 py-1 rounded text-sm">
            <option value="all">{labels.all}</option>
            <option value="public">{labels.public}</option>
            <option value="draft">{labels.draft}</option>
            <option value="hidden">{labels.hidden}</option>
            <option value="archived">{labels.archived}</option>
          </select>

          <button onClick={()=>setSortDesc(s => !s)} className="px-3 py-1 bg-gray-800 rounded text-sm">{sortDesc ? labels.recent : labels.oldest}</button>

          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1 bg-violet-700 rounded text-sm">
            <Download size={14}/> {labels.export}
          </button>

          <button onClick={fetchList} className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded text-sm">
            <RefreshCw size={14}/> Refresh
          </button>

          <button onClick={()=>navigate("create")} className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded text-sm">
            <Plus size={14}/> {labels.new}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-transparent">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-800">
              <th className="p-2">Title</th>
              <th className="p-2 w-40">Author</th>
              <th className="p-2 w-36">Date</th>
              <th className="p-2 w-28">Status</th>
              <th className="p-2 w-40">Tests</th>
              <th className="p-2 w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(post => {
              const id = post._id || post.id;
              const tlist = testsByPost.get(id) || [];
              return (
                <tr key={id} className="border-b border-gray-800 hover:bg-gray-900">
                  <td className="p-2">
                    <div className="flex flex-col">
                      <button onClick={()=>onEdit(post)} className="text-left text-sm font-medium hover:underline">{post.title || 'Untitled'}</button>
                      <div className="text-xs text-gray-500">{(post.desc || "").slice(0, 120)}</div>
                    </div>
                  </td>
                  <td className="p-2">{post.author?.name || post.author || (post.createdBy?.name) || "—"}</td>
                  <td className="p-2">{new Date(post.createdAt || post.created_at || Date.now()).toLocaleString()}</td>
                  <td className="p-2"><StatusBadge status={post.status || "draft"} /></td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm">{tlist.length} test{tlist.length === 1 ? "" : "s"}</div>
                      {tlist.length > 0 && <div className="text-xs text-gray-400">[{(tlist[0].title || "").slice(0,20)}{tlist.length>1?` +${tlist.length-1}`:""}]</div>}
                      <button onClick={() => navigate(`tests?post=${id}`)} className="text-xs text-violet-400 hover:underline">{labels.viewTests}</button>
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={()=>onEdit(post)} title="Edit" className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
                        <Edit size={14}/>
                      </button>

                      <button onClick={() => toggleHidden(post)} title={post.status === 'hidden' ? 'Unhide' : 'Hide'} className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
                        {post.status === 'hidden' ? <Eye size={14}/> : <EyeOff size={14}/>}
                      </button>

                      <button onClick={()=>onDelete(post)} title="Delete" className="px-2 py-1 bg-red-700 rounded hover:bg-red-600">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">{labels.noPosts}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
