import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/config";
import PulsingBlock from "@/components/PulsingBlock";
import TestBlock from "@/components/TestBlock";

const ArticlePage = () => {
	// Get article ID from URL params
	const { id } = useParams();
	const { language } = useLanguage();
	// Article data states
	const [previewImageUrl, setPreviewImageUrl] = useState("")
	const [articleData, setArticleData] = useState(null);
	const [articleContent, setArticleContent] = useState([])
	const [loading, setLoading] = useState(true);
	const [hasTest, setHasTest] = useState(false);

	// Error state
	const [error, setError] = useState(null);

	const pBlock = (index, content, className="") => {
		return (
			<span key={index} className={`w-[100%] font-[600] md:text-[16px] text-white 
			${className}`}>
				{content}
			</span>
		)
	}
	const hBlock = (index, content, className="") => {
		return (
			<h2 key={index} className={`w-[100%] text-3xl font-[800] text-[32px] leading-[44px] text-white 
			${className}`}>
				{content}
			</h2>
		)
	}
	const imgBlock = (index, url, desc) => { // TODO: add size and shape params
		return (
			<div key={index} className="flex flex-col items-center m-2 px-4">
				<img className="w-full max-h-[500px]" src={url} alt={desc} /> 
				<i className="text-[16px] text-white">{desc}</i>
			</div>
		)
	}
	const divBlock = (index, content, desc, shape, side) => {
		return (
			<div key={index} className={`md:flex w-full ${side==='left' ?'flex-row-reverse' : 'flex-row'}`}>
				<span className="md:flex-auto flex items-center font-[600] text-[16px] text-white">
				{content}</span>
				
				<div className="flex-none mt-[20px] md:mt-[0px] md:ml-[30px] flex md:flex-1/2 basis-1/3 flex-col justify-center items-center m-2 px-4">
					<img className={`flex-3/4 md:max-h-[500px] ${shape==="circle" ? 'rounded-full' : ''}`} src={url} alt={desc} /> 
					<i className="w-[100%] text-center text-[16px] text-white">{desc}</i>
				</div>
			</div>
		)
	}
	const errorBlock = (index, message) => {
		return (
			<p key={index} className="font-[700] md:text-[16px] text-[#f00] bg-black">
				*ERROR_LOADING_BLOCK: {message}*
			</p>
		)
	}

	const transformContent = (data) => {
		if(!data) return <>nothing's here...</>
		
		return data.map(( block, index ) => {

			switch(block.type){
				case "p":
					return pBlock(index, block.content);
				
				case "h": 
					return hBlock(index, block.content);
				
				case "img":
					return imgBlock(index, block.url, block.desc);
				
				case "div":
					return divBlock(index, block.content, block.desc, block.shape, block.side);
				default:
					return errorBlock(index, `Unknown block type: ${block.type}`);
			}
		});
	}

	// TODO: Global fetch function
	const fetchData = async (path, query, errorMessage) => {
		try {
			const response = await fetch(
				`${API_URL}/${path.join("/")}${query ? `?${new URLSearchParams(query).toString()}` : ""}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			).then(res => res.json())

			return response.data
		} catch (err) {
			console.error(`${errorMessage}:`, err);
			setError(errorMessage);
		}
	};

	const loadArticle = async () => {
		// Load article data
		try {
			setLoading(true)
			// Fetch article data
			const article = await fetchData(["posts", id], {lang:language || "en"}, "Failed to load the article");
			// Set article data
			setPreviewImageUrl(article.previewImage.url)
			setArticleData({
				title: article.title,
				desc: article.desc,
			})
			setArticleContent(transformContent(article.blocks))
			console.log(article.hasTest);
			
			setHasTest(article.hasTest);
		} catch (err) {
			console.error("Error loading article:", err);
		} finally {
			setLoading(false)
		}
	};

	useEffect(() => {
		loadArticle()
	}, [language, id]);

	return (
		<>
			<Header dark/>
			{!error && <>
				<div className="bg-[#666]">
					<div 
						style={previewImageUrl!=="" ? {'--image-url': `url(${previewImageUrl})`} : {}}
						className='h-[98vh] bg-[image:var(--image-url)] bg-no-repeat bg-cover bg-center rounded-b-[2vw]'
						>
						<div className='h-full flex flex-col justify-center gap-10 pl-[10%] backdrop-brightness-[35%] rounded-b-[2vw]'>
							<span className="w-[60vw] text-5xl md:text-[64px] font-unbounded font-bold text-white">
								{!loading ? articleData.title : <PulsingBlock h={16}/>} 
							</span>
							<span className="w-[45vw] text-3xl md:text-[16px] font-unbounded font-bold text-white">
								{!loading ? articleData.desc : <PulsingBlock h={6}/>}
							</span>
						</div>
					</div>

					<div className="flex flex-col items-center mt-[110px] mx-[10vw] pb-[120px] gap-[30px]">
							{!loading ? articleContent : <PulsingBlock h={8}/>}
					</div>
				</div>
				
				{hasTest && (
					<div className="py-10 flex flex-col items-center gap-6">
						<TestBlock id={id} />
					</div>
				)}
			</>}

			{error && (
				<div className="flex justify-center items-center min-h-screen">
					<p className="text-center text-lg text-red-500">{error}</p>
				</div>
			)}
			
			<Footer />
		</>
	);
};

export default ArticlePage;