import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api";
import { Edit, Trash2, Search, Plus, RefreshCw, EyeOff, Eye, ExternalLink  } from "lucide-react";
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
		title: "Posts",
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
		loading: "Loading...",
		noPosts: "No posts found",
		deleteConfirm: (t) => `Delete post "${t}"? This action is irreversible.`,
		publishSuccess: "Status updated",
	},
	ru: {
		title: "Посты",
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
		loading: "Загрузка...",
		noPosts: "Посты не найдены",
		deleteConfirm: (t) => `Удалить пост "${t}"? Это действие необратимо.`,
		publishSuccess: "Статус обновлён",
	},
	kg: {
		title: "Посттор",
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
		loading: "Жүктөлүүдө...",
		noPosts: "Посттор табылган жок",
		deleteConfirm: (t) => `Постту өчүрүү "${t}"? Бул иш-чара кайтпайт.`,
		publishSuccess: "Статус жаңыртылды",
	}
}

const StatusBadge = ({ status }) => {
	const cls = status === "public" ? "bg-green-700" :
							status === "hidden" ? "bg-gray-600" : "bg-yellow-600";
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
			const pRes = await api.get(`/posts/list/`, {params: { lang: lang || "en", details: true }});
			const postsData = pRes.data?.data || pRes.data || [];
			console.log("Posts:", postsData);
			setPosts(postsData);
		} catch (e) {
			console.error("Failed load posts:", e);
			setPosts([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchList();
	}, [lang]); // refetch when lang changes

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
		const id = post._id;
		const prev = post.status;
		if (!prev) return;

		const newStatus = prev === "hidden" ? "public" : "hidden";
		// optimistic
		setPosts(prevList => prevList.map(p => ((p._id || p.id) === id ? { ...p, status: newStatus } : p)));
		try {
			await api.patch(`/posts/${id}`, { status: newStatus });
			// optional: show toast (omitted)
		} catch (e) {
			console.error("Status update failed", e);
			setPosts(prevList => prevList.map(p => ((p._id || p.id) === id ? { ...p, status: prev } : p)));
		}
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold">{labels.title}</h2>

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

					{/* TODO: some button */}
					<button onClick={()=>{}} className="flex items-center gap-2 px-3 py-1 bg-violet-700 rounded text-sm">
						Button
					</button>

					<button onClick={fetchList} className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded text-sm">
						<RefreshCw size={14}/> Refresh
					</button>

					<button onClick={()=>navigate("editor")} className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded text-sm">
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
							<th className="p-2 w-40">Test</th>
							<th className="p-2 w-36 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{!loading ? filtered.map(post => {
							const id = post._id;
							
							return (
								<tr key={id} className="border-b border-gray-800 hover:bg-gray-900">
									<td className="p-2">
										<div className="flex flex-col">
											<button onClick={()=>navigate(`/article/${post._id}`)} className="text-left text-sm font-medium hover:underline">{post.title || 'Untitled'}</button>
											<div className="text-xs text-gray-500">{(post.desc || "").slice(0, 120)}</div>
										</div>
									</td>
									<td className="p-2">{post.createdBy?.name || "Unknown"}</td>
									<td className="p-2">{new Date(post.updatedAt || null).toLocaleString()}</td>
									<td className="p-2"><StatusBadge status={post.status || "Unknown"} /></td>
									<td className="p-2">
										<div className="flex items-center gap-2">
											{!post?.hasTest ?
											<button onClick={() => navigate(`../tests/editor/${id}?mode=create`)} title="Add test" className="text-xs text-green-400 hover:underline">
												<Plus size={18}/>
											</button>
											:
											<button onClick={() => navigate(`../tests/editor/${id}?mode=edit`)} title="Open test" className="text-xs text-blue-400 hover:underline">
												<ExternalLink size={18}/>
											</button>}
										</div>
									</td>
									<td className="p-2 text-right">
										<div className="inline-flex gap-2">
											<button onClick={()=>navigate(`editor?id=${post._id}`)} title="Edit" className="px-2 py-1 bg-gray-800 rounded hover:bg-gray-700">
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
						}) : (
							<tr>
								<td colSpan={6} className="p-6 text-center text-gray-500">{labels.loading}</td>
							</tr>
						)}
						{!loading && filtered.length === 0 && (
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
