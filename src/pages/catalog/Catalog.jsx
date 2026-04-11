import { useEffect, useState, useRef } from "react";
import Header from "@/components/header/Header";
import style from "./Catalog.module.css";
import Card from "@/components/card/Card";
import Footer from "@/components/footer/Footer";
import search from "@/assets/searchIcon.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import Loader from "@/components/loader/Loader";
import api from "@/api";
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from "lucide-react";

const TAG_TYPES = ["person", "event", "place", "era", "dynasty", "concept"];

const UI = {
	en: {
		title: "Catalog",
		searchPlaceholder: "Search by title",
		filterByTags: "Filter by tags",
		allTypes: "All",
		noArticles: "No articles found",
		clearFilters: "Clear filters",
	},
	ru: {
		title: "Каталог",
		searchPlaceholder: "Поиск по названию",
		filterByTags: "Фильтр по тегам",
		allTypes: "Все",
		noArticles: "Статьи не найдены",
		clearFilters: "Сбросить фильтры",
	},
	kg: {
		title: "Каталог",
		searchPlaceholder: "Аталышы боюнча издөө",
		filterByTags: "Тегтер боюнча чыпкалоо",
		allTypes: "Баары",
		noArticles: "Макалалар табылган жок",
		clearFilters: "Чыпкаларды тазалоо",
	},
};

const itemsPerPage = 16;

const Catalog = () => {
	const { language } = useLanguage();
	const labels = UI[language] || UI.ru;
	const searchRef = useRef(null);

	// Статьи
	const [cards, setCards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	// Теги
	const [allTags, setAllTags] = useState([]);
	const [selectedTags, setSelectedTags] = useState([]); // массив _id
	const [activeType, setActiveType] = useState("");    // фильтр по type внутри панели

	// ─── Загрузка тегов ─────────────────────────
	useEffect(() => {
		api.get("/tags", { params: { size: 200, lang: language } })
			.then(res => {
				const raw = res.data?.data;
				const list = Array.isArray(raw) ? raw
					: Array.isArray(raw?.tags)   ? raw.tags
					: Array.isArray(raw?.docs)   ? raw.docs
					: Array.isArray(raw?.items)  ? raw.items
					: [];
				setAllTags(list);
			})
			.catch(e => console.error("Tags load failed:", e));
	}, [language]);

	// ─── Загрузка статей ────────────────────────
	const fetchCards = async () => {
		setLoading(true);
		setError(null);
		try {
			const params = new URLSearchParams();
			params.append("lang", language);

			// Передаём выбранные теги как tags[and]=id1&tags[and]=id2
			selectedTags.forEach(id => params.append("tags[and]", id));

			const res = await api.get(`/posts/list?${params.toString()}`);
			const raw = res.data?.data;
			setCards(Array.isArray(raw) ? raw : []);
		} catch (e) {
			console.error("Articles load failed:", e);
			setError(language === "en" ? "Failed to load articles" : "Не удалось загрузить статьи");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
		fetchCards();
	}, [language, selectedTags]);

	// ─── Теги: добавить / убрать ─────────────────
	const toggleTag = (tagId) => {
		setSelectedTags(prev =>
			prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
		);
	};

	const clearFilters = () => setSelectedTags([]);

	// ─── Фильтрация на клиенте (поиск по заголовку) ─
	const filteredCards = cards.filter(card =>
		card?.title?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// ─── Пагинация ──────────────────────────────
	const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
	const paginatedCards = filteredCards.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);
		searchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	// Отображаемые теги в панели фильтров
	const visibleTags = activeType
		? allTags.filter(t => t.type === activeType)
		: allTags;

	const getTagName = (tag) =>
		tag.name?.[language] || tag.name?.ru || tag.name?.en || "";

	// ─── Пагинация: построение массива страниц ──
	function buildPagination(current, total) {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
		if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
		return [1, "...", current - 1, current, current + 1, "...", total];
	}

	function buildPaginationMobile(current, total) {
		if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
		if (current <= 3) return [1, 2, 3, "...", total];
		if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
		return [1, "...", current, "...", total];
	}

	if (error) {
		return <p className="text-center text-lg text-red-500 mt-20">{error}</p>;
	}

	return (
		<>
			<Header />

			{/* Hero */}
			<div className={style.mainDiv}>
				<p className="text-3xl md:text-[50px] font-unbounded font-bold text-white text-center w-[90%] md:w-[70%]">
					{labels.title}
				</p>
			</div>

			{/* Поиск */}
			<div
				ref={searchRef}
				className="relative flex gap-3 items-center mx-4 md:mx-10 mt-10 font-sf font-light"
			>
				<input
					type="text"
					className="w-full py-2 pr-14 pl-4 border h-[60px] border-black rounded-[20px] focus:outline-none"
					value={searchQuery}
					onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
					placeholder={labels.searchPlaceholder}
				/>
				<button className="absolute right-[7px] top-1/2 -translate-y-1/2 text-gray-500">
					<img src={search} alt="Search" />
				</button>
			</div>

			{/* Фильтр по тегам */}
			{allTags.length > 0 && (
				<div className="mx-4 md:mx-10 mt-6">
					<div className="flex items-center justify-between mb-3 flex-wrap gap-2">
						<span className="text-sm font-medium text-gray-600">{labels.filterByTags}</span>
						<div className="flex items-center gap-2">
							{/* Фильтр по типу тега */}
							<div className="flex gap-1 flex-wrap">
								<button
									onClick={() => setActiveType("")}
									className={`px-3 py-1 rounded-full text-xs font-medium transition ${
										activeType === "" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{labels.allTypes}
								</button>
								{TAG_TYPES.filter(type => allTags.some(t => t.type === type)).map(type => (
									<button
										key={type}
										onClick={() => setActiveType(prev => prev === type ? "" : type)}
										className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
											activeType === type ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
										}`}
									>
										{type}
									</button>
								))}
							</div>
							{/* Сбросить */}
							{selectedTags.length > 0 && (
								<button
									onClick={clearFilters}
									className="flex items-center gap-1 px-3 py-1 text-xs text-red-500 hover:text-red-700"
								>
									<X size={12} /> {labels.clearFilters}
								</button>
							)}
						</div>
					</div>

					{/* Чипы тегов */}
					<div className="flex flex-wrap gap-2">
						{visibleTags.map(tag => {
							const isActive = selectedTags.includes(tag._id);
							return (
								<button
									key={tag._id}
									onClick={() => toggleTag(tag._id)}
									className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
										isActive
											? "bg-gray-800 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{isActive && <span className="mr-1">✓</span>}
									{getTagName(tag)}
								</button>
							);
						})}
					</div>

					{/* Активные фильтры */}
					{selectedTags.length > 0 && (
						<div className="flex flex-wrap gap-2 mt-3">
							{selectedTags.map(id => {
								const tag = allTags.find(t => t._id === id);
								if (!tag) return null;
								return (
									<span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-white rounded-full text-sm">
										{getTagName(tag)}
										<button onClick={() => toggleTag(id)} className="hover:text-red-300 ml-1">
											<X size={12} />
										</button>
									</span>
								);
							})}
						</div>
					)}
				</div>
			)}

			{/* Грид статей */}
			<div className="m-4 md:m-10 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-8">
				{loading ? (
					<Loader />
				) : paginatedCards.length === 0 ? (
					<p className="col-span-full text-center text-gray-400 py-16">{labels.noArticles}</p>
				) : (
					paginatedCards.map((card) => (
						<Card
							key={card._id}
							id={card._id}
							img={card.previewImage?.url}
							text={card?.title || ""}
							bgColor="bg-[#E5E5E5]"
						/>
					))
				)}
			</div>

			{/* Пагинация */}
			{totalPages > 1 && (
				<div className="w-full flex justify-center mt-[52px] mb-[52px]">
					<div className="flex items-center gap-2">
						<button
							onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] flex items-center justify-center rounded-full bg-gray-400 text-white disabled:opacity-40"
						>
							<ChevronLeft size={20} />
						</button>

						{/* Desktop */}
						<div className="hidden sm:flex items-center gap-2">
							{buildPagination(currentPage, totalPages).map((item, i) => {
								if (item === "...") return (
									<div key={`d-dots-${i}`} className="w-[44px] h-[44px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
										<MoreHorizontal size={20} />
									</div>
								);
								return (
									<button
										key={`d-${item}`}
										onClick={() => handlePageChange(item)}
										className={`w-[44px] h-[44px] rounded-full text-[18px] font-medium flex items-center justify-center transition ${
											item === currentPage ? "bg-[#333335] text-white" : "bg-gray-400 text-white hover:bg-[#333335]"
										}`}
									>
										{item}
									</button>
								);
							})}
						</div>

						{/* Mobile */}
						<div className="flex sm:hidden items-center gap-2">
							{buildPaginationMobile(currentPage, totalPages).map((item, i) => {
								if (item === "...") return (
									<div key={`m-dots-${i}`} className="w-[40px] h-[40px] rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
										<MoreHorizontal size={18} />
									</div>
								);
								return (
									<button
										key={`m-${item}`}
										onClick={() => handlePageChange(item)}
										className={`w-[40px] h-[40px] rounded-full text-[16px] font-medium flex items-center justify-center transition ${
											item === currentPage ? "bg-[#333335] text-white" : "bg-gray-400 text-white hover:bg-[#333335]"
										}`}
									>
										{item}
									</button>
								);
							})}
						</div>

						<button
							onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px] flex items-center justify-center rounded-full bg-gray-400 text-white disabled:opacity-40"
						>
							<ChevronRight size={20} />
						</button>
					</div>
				</div>
			)}

			<Footer />
		</>
	);
};

export default Catalog;
