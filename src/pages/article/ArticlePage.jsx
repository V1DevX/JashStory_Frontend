import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { ClipLoader } from "react-spinners";
import Placeholder from 'react-bootstrap/Placeholder';
import { useLanguage } from "../../context/LanguageContext";
import { API_URL } from "../../config";

const ArticlePage = () => {
	const { id } = useParams();
	const { language } = useLanguage();
	const [previewImageUrl, setPreviewImageUrl] = useState(null)
	const [articleData, setArticleData] = useState(null);
	const [articleContent, setArticleContent] = useState([])
	const [firstLoading, setFirstLoading] = useState(true)
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const transformContent = (data) => {
		if(!data) return <>nothing's here...</>

		const newData = data.map(block => {
			
			switch(block.type){
				case "p":
					return <p 
						className="w-[100%] font-[600] md:text-[16px] text-white">
						{block.content}</p>
				
				case "h": 
					return <h2
						className="w-[100%] text-3xl font-[800] text-[32px] leading-[44px] text-white">
						{block.content}</h2>
				
				case "img":
					return (
					<div className="flex flex-col items-center m-2 px-4">
						<img className="w-full max-h-[500px]" src={block.url} alt={block.desc} /> 
						<i className="text-[16px] text-white">{block.desc}</i>
					</div>
					)
				
				case "div":
					return (
						// <div className='flex justify-center items-center'>
							<div className={`md:flex w-full ${block.side==='left' ?'flex-row-reverse' : 'flex-row'}`}>

								<p className="md:flex-auto flex items-center font-[600] text-[16px] text-white">
								{block.content}</p>
								
								<div className="flex-none mt-[20px] md:mt-[0px] md:ml-[30px] flex md:flex-1/2 basis-1/3 flex-col justify-center items-center m-2 px-4">
									<img className={`flex-3/4 md:max-h-[500px] ${block.shape==="circle" ? 'rounded-full' : ''}`} src={block.url} alt={block.desc} /> 
									<i className="w-[100%] text-center text-[16px] text-white">{block.desc}</i>
								</div>
							</div>
						// {/* </div> */}
					)
				default:
					return <p 
						className="font-[700] md:text-[16px] text-[#f00] bg-black">
						*UNDEFINED_{block.id}*</p>
			}
		});

		return <>{...newData}</>
	}

	const fetchArticle = async () => {
		try {
			const response = await fetch(
				`${API_URL}/posts/${id}/${language}`
			).then(res => res.json())
			return response.data

		} catch (err) {
			console.error("Error fetch article:", err);
			setError(
				language === "en"
					? "Failed to fetch the article"
					: "Не удалось получить статью"
			);
		}
	};

	useEffect(() => {
		const loadArticle = async () => {
			try {
				setFirstLoading(true)
	
				const article = await fetchArticle();
				
				setPreviewImageUrl(article.previewImage.url)
				
				const data = article[language]
				setArticleData({
					title: data.title,
					desc: data.desc,
					// rating: data.rating
					// favor
				})
				setArticleContent(transformContent(data.blocks))
				
			} catch (err) {
				console.error("Error loading article:", err);
				setError(
					language === "en"
						? "Failed to load the article"
						: "Не удалось загрузить статью"
				);
			} finally {
				setFirstLoading(false)
			}
		}
		
		loadArticle()
	}, [id]);

	useEffect(() => {
		if(firstLoading) return

		const loadArticle = async () => {
			try {
				setLoading(true)
	
				const article = await fetchArticle();
				const data = article[language]
				setArticleData({
					title: data.title,
					desc: data.desc,
					// rating: data.rating
					// favor
				})
				setArticleContent(transformContent(data.blocks))
				
			} catch (err) {
				console.error("Error loading article:", err);
				setError(
					language === "en"
						? "Failed to load the article"
						: "Не удалось загрузить статью"
				);
			} finally {
				setLoading(false)
			}
		}
		
		loadArticle()
	}, [language]);

	if (error) {
		return (
			<>
				<Header />
				<div className="flex justify-center items-center min-h-screen">
					<p className="text-center text-lg text-red-500">{error}</p>
				</div>
				<Footer />
			</>
		);
	}

	return (
		<>
			<Header dark/>
			<div className="bg-[#666]">
				
				<div 
					style={!firstLoading ? {'--image-url': `url(${previewImageUrl})`} : {}}
					className='h-[98vh] bg-[image:var(--image-url)] bg-no-repeat bg-cover bg-center rounded-b-[2vw]'
					>
					<div className='h-full flex flex-col justify-center gap-10 pl-[10%] backdrop-brightness-[35%] rounded-b-[2vw]'>
						<p className="w-[60vw] text-5xl md:text-[64px] font-unbounded font-bold text-white">
							{!firstLoading && !loading ? articleData.title
								: <div class="w-full h-16 bg-gray-300 rounded animate-pulse"></div>} 
						</p>
						<p className="w-[45vw] text-3xl md:text-[16px] font-unbounded font-bold text-white">
							{!firstLoading && !loading ? articleData.desc
								: <div class="w-full h-6 bg-gray-300 rounded animate-pulse"></div>}
						</p>
					</div>
				</div>

				<div className="flex flex-col items-center mt-[110px] mx-[10vw] pb-[120px] gap-[30px]">
						{!firstLoading && !loading ? articleContent : <div class="w-full h-8 bg-gray-300 rounded animate-pulse"></div>}
				</div>
				
			</div>
			<Footer />
		</>
	);
};

export default ArticlePage;