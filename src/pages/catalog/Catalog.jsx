import React, { useEffect, useState, useRef } from "react";
import Header from "@/components/header/Header";
import style from "./Catalog.module.css";
import Card from "@/components/card/Card";
import Footer from "@/components/footer/Footer";
import search from "@/assets/searchIcon.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/config";
import Loader from "@/components/loader/Loader";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

const Catalog = () => {
	const [ cards, setCards ] = useState([]);
	const [ loading, setLoading ] = useState(true);
	const [ error, setError ] = useState(null);
	const searchRef = useRef(null);
	const [ searchQuery, setSearchQuery ] = useState("");
	const [ currentPage, setCurrentPage ] = useState(1);
	const itemsPerPage = 9;
	const { language } = useLanguage();

	const fetchAllData = async () => {
		let allCards = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
			setLoading(true)
			try {
				const response = await fetch(
					`${API_URL}/posts/list?lang=${language}&page=${page}`,
					{
						headers: {
							'Content-Type': 'application/json',
							// 'Accept-Language': language,
						},
					}
				);
				const resJson = await response.json();

				allCards = [...allCards, ...resJson.data]
				if (resJson?.next) {
					page++;
				} else {
					hasMore = false;
				}
			} catch (error) {
				console.error("Error loading articles:", error);
				setError(
					language === "en"
						? "Failed to load articles"
						: "Не удалось загрузить статью"
				);
				hasMore = false;
			}
		}

		setCards(allCards);
		setLoading(false);
	};

	useEffect(() => {
		fetchAllData();
	}, [language]);


	const filteredCards = cards.filter((card) =>
		// {console.log(card);return card}
		card?.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
	const paginatedCards = filteredCards.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);

		searchRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	function buildPagination(current, total) {
		// not enought: 1 2 3 4 5 6 7
		if (total <= 7)
			return Array.from({ length: total }, (_, i) => i + 1)

		// Start: 1 2 3 4 5 ... n
		if (current <= 4)
			return [1, 2, 3, 4, 5, "...", total];

		// End: 1 ... n-4 n-3 n-2 n-1 n
		if (current >= total - 3)
			return [ 1, "...", total - 4, total - 3, total - 2, total - 1, total ];

		// Center: 1 ... i-1 i i+1 ... n
		return [ 1, "...", current - 1, current, current + 1, "...", total ];
	}

	function buildPaginationMobile(current, total) {
		// not enought: 1 2 3 4 5
		if (total <= 5)
			return Array.from({ length: total }, (_, i) => i + 1);

		// Start: 1 2 3 ... n
		if (current <= 3)
			return [1, 2, 3, "...", total];

		// End: 1 ... n-2 n-1 n
		if (current >= total - 2)
			return [1, "...", total - 2, total - 1, total];

		// Center: 1 ... i ... n
		return [1, "...", current, "...", total];
	}

	if (error) {
		return <p className="text-center text-lg text-red-500">{error}</p>;
	}

	return <>
		<Header />
			{/* Main div */}
			<div className={style.mainDiv}>
				<div className="my-auto flex flex-col gap-[20px] md:gap-[40px] justify-center items-center px-4 md:px-0">
					<p className="text-3xl md:text-[50px] font-unbounded font-bold text-white text-center w-[90%] md:w-[70%]">
						{language === "en" ? "Catalog" : "Каталог"}
					</p>
				</div>
			</div>

			{/* Search */}
			<div 
				ref={searchRef} // 
				className="relative my-auto flex gap-3 items-center mx-4 md:mx-10 mt-10 font-sf font-light"
			>
				<input
					type="text"
					className="w-screen relative py-2 pr-14 pl-4 border h-[60px] border-black rounded-[20px] focus:outline-none"
					value={searchQuery}
					onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1)}}
					placeholder={language === "en" ? "Search by title" : "Поиск по названию"}
				/>
				<button className="absolute right-[7px] top-1/2 transform -translate-y-1/2 text-gray-500">
					<img src={search} alt="Search" />
				</button>
			</div>
			<div className="m-4 md:m-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
				{loading ? (
					<Loader />
				) : (
					paginatedCards.map((card) => (
						<Card
							id={card._id}
							key={card._id}
							img={card.previewImage?.url}
							text={card?.title || "card title"}
							bgColor="bg-[#E5E5E5]"
						/>
					))
				)}
			</div>
			<div className="w-full flex justify-center mt-[52px] mb-[52px]">
				<div className="flex items-center gap-2">

					{/* Prev */}
					<button
						onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
						className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px]
							flex items-center justify-center rounded-full
							bg-gray-400 text-white disabled:opacity-40"
					>
						<ChevronLeft size={20} />
					</button>

					{/* DESKTOP */}
					<div className="hidden sm:flex items-center gap-2">
						{buildPagination(currentPage, totalPages).map((item, i) => {
							if (item === "...") {
								return (
									<div
										key={`d-dots-${i}`}
										className="w-[44px] h-[44px] rounded-full bg-gray-200
											flex items-center justify-center text-gray-500"
									>
										<MoreHorizontal size={20} />
									</div>
								);
							}

							const isActive = item === currentPage;

							return (
								<button
									key={`d-${item}`}
									onClick={() => handlePageChange(item)}
									className={`w-[44px] h-[44px] rounded-full text-[18px] font-medium
										flex items-center justify-center transition
										${isActive
											? "bg-[#333335] text-white"
											: "bg-gray-400 text-white hover:bg-[#333335]"
										}`}
								>
									{item}
								</button>
							);
						})}
					</div>

					{/* MOBILE */}
					<div className="flex sm:hidden items-center gap-2">
						{buildPaginationMobile(currentPage, totalPages).map((item, i) => {
							if (item === "...") {
								return (
									<div
										key={`m-dots-${i}`}
										className="w-[40px] h-[40px] rounded-full bg-gray-200
											flex items-center justify-center text-gray-500"
									>
										<MoreHorizontal size={18} />
									</div>
								);
							}

							const isActive = item === currentPage;

							return (
								<button
									key={`m-${item}`}
									onClick={() => handlePageChange(item)}
									className={`w-[40px] h-[40px] rounded-full text-[16px] font-medium
										flex items-center justify-center transition
										${isActive
											? "bg-[#333335] text-white"
											: "bg-gray-400 text-white hover:bg-[#333335]"
										}`}
								>
									{item}
								</button>
							);
						})}
					</div>

					{/* Next */}
					<button
						onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage === totalPages}
						className="w-[40px] h-[40px] sm:w-[44px] sm:h-[44px]
							flex items-center justify-center rounded-full
							bg-gray-400 text-white disabled:opacity-40"
					>
						<ChevronRight size={20} />
					</button>

				</div>
			</div>
		<Footer />
	</>
};

export default Catalog;
