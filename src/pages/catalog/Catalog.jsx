import React, { useEffect, useState } from "react";
import Header from "../../components/header/Header";
import style from "./Catalog.module.css";
import Card from "../../components/card/Card";
import Footer from "../../components/footer/Footer";
import search from "../../assets/searchIcon.svg";
import { ClipLoader } from "react-spinners";
import { useLanguage } from "../../context/LanguageContext";
import { API_URL } from "../../config/api";

const Catalog = () => {
	const [cards, setCards] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 2;
	const { language } = useLanguage();
	
	const fetchAllData = async () => {
		let allCards = [];
		let page = 1;
		let hasMore = true;

		while (hasMore) {
			setLoading(true)
			try {
				const response = await fetch(
					`${API_URL}/posts/${language}?page=${page}`,
					{
						headers: {
							'Content-Type': 'application/json',
							// 'Accept-Language': language,
						},
					}
				);
				const resJson = await response.json();
				console.log(resJson.data)
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
		card[language]?.title.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
	const paginatedCards = filteredCards.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	const handlePageChange = (pageNumber) => {
		setCurrentPage(pageNumber);
	};

	if (loading) {
		return (
			<>
				<Header />
				<div className={style.mainDiv}>
					<div className="my-auto flex flex-col gap-[20px] md:gap-[40px] justify-center items-center px-4 md:px-0">
						<p className="text-3xl md:text-[50px] font-unbounded font-bold text-white text-center w-[90%] md:w-[70%]">
							{language === "en" ? "Catalog" : "Каталог"}
						</p>
					</div>
				</div>
				<div className="flex justify-center items-center min-h-screen flex-col">
					<ClipLoader size={100} color="#000000" loading={loading} />
					<p className="text-lg mt-4">
						{language === "en" ? "Loading..." : "Загрузка..."}
					</p>
				</div>
				<Footer />
			</>
		);
	}

	if (error) {
		return <p className="text-center text-lg text-red-500">{error}</p>;
	}

	return (
		<>
			<Header />
			<div className={style.mainDiv}>
				<div className="my-auto flex flex-col gap-[20px] md:gap-[40px] justify-center items-center px-4 md:px-0">
					<p className="text-3xl md:text-[50px] font-unbounded font-bold text-white text-center w-[90%] md:w-[70%]">
						{language === "en" ? "Catalog" : "Каталог"}
					</p>
				</div>
			</div>
			<div className="relative my-auto flex gap-3 items-center mx-4 md:mx-10 mt-10 font-sf font-light">
				<input
					type="text"
					className="w-screen relative py-2 pr-14 pl-4 border h-[60px] border-black rounded-[20px] focus:outline-none"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder={language === "en" ? "Search by title" : "Поиск по названию"}
				/>
				<button className="absolute right-[7px] top-1/2 transform -translate-y-1/2 text-gray-500">
					<img src={search} alt="Search" />
				</button>
			</div>
			<div className="m-4 md:m-10 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3 lg:gap-11">
				{paginatedCards.map((card) => (
					<Card
						id={card._id}
						key={card._id}
						img={card.previewImage}
						text={card[language]?.title || "card title"}
						bgColor="bg-[#E5E5E5]"
					/>
				))}
			</div>
			<div className="mt-[52px] mb-[52px] flex justify-center gap-2">
				{[...Array(totalPages)].map((_, index) => (
					<button
						key={index}
						onClick={() => handlePageChange(index + 1)}
						className={`rounded-full text-white text-[22px] font-medium px-4 py-2 transition-all duration-300 ease-in-out ${
							currentPage === index + 1 ? "bg-[#333335]" : "bg-gray-400 hover:bg-[#333335]"
						}`}
					>
						{index + 1}
					</button>
				))}
			</div>
			<Footer />
		</>
	);
};

export default Catalog;
