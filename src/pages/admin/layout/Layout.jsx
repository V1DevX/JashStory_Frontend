import React, { useState } from "react";
import { useNavigate, Outlet, Navigate } from "react-router";
import { useLocation } from 'react-router-dom'

import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";
import Loader from "../../../components/loader/Loader";


const AdminLayout = () => {
	const { user, loading } = useAuth();
	if (loading) return <Loader />; // спиннер по вкусу
	if (user?.role > 2) return <Navigate to="/" replace />;

	const location = useLocation().pathname
	const navigate = useNavigate()

	const sideNavList = [
		{
			text: 'Dashboard',
			url: "/admin/dashboard",
			svg:	'🏠',
		},
		{
			text: 'Posts',
			url: "/admin/posts",
			svg:	'📚'
		},
		{
			text: 'Users',
			url: "/admin/users",
			svg:	'👥'
		},
		// {
		// 	text: '****',
		// 	url: "",
		// 	svg:	'*'
		// },
	]


	// TODO: Edit it all, can add bootstrap 
	return (
	<div className="text-white h-[100vh] no-scroll">
		<nav className="w-full h-[50px] flex justify-between items-center px-5
										bg-slate-900 border-b-[3px] border-purple-600">
			<h1 className="text-[32px] font-[800] font-unbounded drop-shadow-[0_0px_10px_rgba(125,0,255,1)]">
				Jash Story
			</h1>
			<div className="flex items-center gap-3">
				<h1 className="text-[24px] font-[800]">
					{user.name}
				</h1>
				<img src="none"/>
			</div>
		</nav>

		<div className="flex h-[calc(100vh-50px)]">
			<aside className="hidden sm:block md:w-[20%] bg-slate-950 border-r-[3px] border-purple-700">
				<div className="py-3 overflow-y-auto">
					<ul className="space-y-2 font-medium">
						{sideNavList.map(li => 
								<li className={`cursor-pointer flex items-center p-2 group ${location.includes(li.url) ? 
									"drop-shadow-[0_0px_5px_rgba(125,0,255,1)] bg-gradient-to-r from-purple-950/35 to-purple-700": 
									"bg-gradient-to-r from-zinc-950/0 to-zinc-800/80"}`} 
									onClick={()=>{navigate(li.url)}} key={li.text}>
									<p className='text-[24px]'>{li.svg}</p><span className="text-[20px] ms-3">{li.text}</span>
								</li>
						)}
					</ul>
				</div>
			</aside>

			<div className="px-4 bg-gray-950 w-[100%] sm:w-[80%]">
				<Outlet/>
			</div> 
		</div>
		
	</div>
)}

export default AdminLayout;