import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import cloudinaryTransforms from "@/features/cloudinaryTransforms";
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
	const [test, setTest] = useState(null);

	// Error state
	const [error, setError] = useState(null);

	const transformContent = (data) => {
		if(!data) return <>nothing's here...</>
		
		return data.map(( block, index ) => {

			switch(block.type){
				case "p":
					return (
						<span 
							key={index} 
							className={`w-[100%] font-[600] md:text-[16px] text-white`}
							>
								{block.content}
						</span>
					);
				
				case "h": 
					return (
						<h2 key={index} className={`w-[100%] text-3xl font-[800] text-[32px] leading-[44px] text-white `}>
							{block.content}
						</h2>
					);
				
				case "img":
					return (
						<div key={index} className="flex flex-col items-center m-2 px-4">
							<img className="w-full max-h-[500px]" src={block.url} alt={block.desc} /> 
							<i className="text-[16px] text-white">{block.desc}</i>
						</div>
					);
				
				case "div":
					return (
						<div key={index} className={`md:flex w-full ${block.side==='left' ?'flex-row-reverse' : 'flex-row'}`}>
							<span className="md:flex-auto flex items-center font-[600] text-[16px] text-white">
							{block.content}</span>
							
							<div className="flex-none mt-[20px] md:mt-[0px] md:ml-[30px] flex md:flex-1/2 basis-1/3 flex-col justify-center items-center m-2 px-4">
								<img className={`flex-3/4 md:max-h-[500px] ${block.shape==="circle" ? 'rounded-full' : ''}`} src={block.url} alt={block.desc} /> 
								<i className="w-[100%] text-center text-[16px] text-white">{block.desc}</i>
							</div>
						</div>
					);
				
				default:
					return (
						<p key={index} className="font-[700] md:text-[16px] text-[#f00] bg-black">
							*ERROR_LOADING_BLOCK: {block.type}*
						</p>
					);
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
			
			// if (response.code !== 200) throw response;
			return response.data;
		} catch (err) {
			setError(err.message || errorMessage);
			return null;
		}
	};

	const loadArticle = async () => {
		// Load article data
		try {
			setLoading(true)
			// Fetch article data
			const article = await fetchData(["posts", id], {lang:language || "en"}, "Failed to load the article");
			if (!article) return
			// if (error || article.code !== 200) { throw `${article.code}: ${article.message}` }

			// Set article data
			setPreviewImageUrl(cloudinaryTransforms(article.previewImage.url, ["c_fill", "g_auto:face", "ar_16:9"]));
			setArticleData({
				title: article[language].title,
				desc: article[language].desc,
			})
			setArticleContent( transformContent(article[language].blocks) )
			setTest(article.test);
		} catch (err) {
			setError(err);
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
				
				{test && (
					<div className="py-10 flex flex-col items-center gap-6">
						<TestBlock test={test}/>
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
