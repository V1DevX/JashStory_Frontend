import React, { useEffect, useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { API_URL } from "../../../config";
import { RingLoader } from "react-spinners";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api";

const PostList = () => {
	const navigate = useNavigate()
	const { language } = useLanguage();
	const [ posts, setPosts ] = useState([]);
	const [ loading, setLoading ] = useState(true);
	// Controllers
	const [ listFilter, setListFilter ] = useState([]) // example: ["Title", "tag", "tag", "start year", "end year"]

	const fetchAllData = async () => {
		let allPosts = [];
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

				allPosts = [...allPosts, ...resJson.data]  
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
	
		setPosts(allPosts);
		setLoading(false);
	};
	const deletePost = async (_id) => {
		const res = await api.delete(`/posts/${_id}`)
		if(res.status!==200) return
		setPosts(posts.filter(post => post._id !== _id))
	}
	useEffect(() => {
		fetchAllData();
	}, [language]);

	useEffect(()=>{

	}, [listFilter])

	return (
		<div className="mt-2">
			<header className="flex justify-between items-center">
				<h1 className="text-[26px] font-[700]">Post List</h1>
				<button onClick={() => navigate('/admin/posts/create')} className="duration-300 text-[20px] p-1 rounded-[5px] 
				bg-[#00cc00] hover:bg-[#00dd00]
				drop-shadow-[0_0px_10px_rgba(0,255,0,0.3)] hover:drop-shadow-[0_0px_10px_rgba(0,255,0,0.6)]">+ Add new</button>
			</header>

			{/* Posts list */}
			<div className="mt-2 h-[80vh] overflow-y-auto flex flex-col gap-2
			[&::-webkit-scrollbar]:w-1
			[&::-webkit-scrollbar-track]:rounded-full
			[&::-webkit-scrollbar-track]:bg-purple-950/20
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:bg-purple-800">
				{loading ? 	
				<div className="h-[60vh] flex justify-center items-center ">
					<RingLoader size={100} color="#ddaaff" className="drop-shadow-[0_0_10px_rgba(125,0,255,1)]"/>
				</div> : 
				posts.map(post => 
					<div className="flex justify-between items-center bg-slate-900 p-3 flex rounded-xl" key={post._id}>
						<span className="text-[18px] font-[600]">{post[language].title}</span>
						<div className="flex gap-5 items-center">
							<Link className="bg-[cyan] text-[black] px-5 py-1 rounded-xl"
								to={`/article/${post._id}`}>Link</Link>
							<button className="bg-[red] px-5 py-1 rounded-xl"
								onClick={()=>deletePost(post._id)}>Delete</button>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default PostList