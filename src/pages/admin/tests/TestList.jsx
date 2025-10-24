import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/config";
import { Link } from "react-router-dom";
import { 
	Edit, 
	Trash2, 
	Search, 
	ChevronLeft, 
	ChevronRight,
	CirclePlus,
	Calendar,
	User,
	BookType
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

const TestList = () => {
	const { language } = useLanguage();
	const { user } = useAuth();
	const postsPerPage = 5;
	// Post
	const [ isLoading, setIsLoading ] = useState(true);
	const [ posts, setPosts ] = useState([]);

	const [ currentPage, setCurrentPage ] = useState(1);
	const [ totalPages, setTotalPages ] = useState(0)
	const [ searchQuery, setSearchQuery ] = useState("");
	// const [ paginatedPosts, setPaginatedPosts ] = useState([])

	const fetchAllData = async () => {
		setIsLoading(true)
		try {
			const response = await fetch(
				`${API_URL}/posts/${language}`
				// {
				// 	headers: {
				// 		'Content-Type': 'application/json',
				// 		// 'Accept-Language': language,
				// 	},
				// }
			);

			const resJson = await response.json();
			setPosts(resJson.data)
		} catch (error) {
			console.error("Error loading articles:", error);
			setPosts([])
		}

		setIsLoading(false);
	};
	useEffect(() => {
		setIsLoading(true)
		fetchAllData()
	}, []);

	// Фильтрация по поиску (useMemo для оптимизации)
	// const filteredPosts = useMemo(() => {
	// 	if(!isLoading) return []
	// 	else {
	// 		return posts.filter(post =>
	// 			post.title.toLowerCase().includes(searchQuery.toLowerCase())
	// 			// post.author.toLowerCase().includes(searchQuery.toLowerCase())
	// 		);
	// 	}
	// }, [posts, searchQuery]);

	// Пагинация
	// useEffect(() => {
	// 	setTotalPages(Math.ceil(filteredPosts.length / postsPerPage))
	// 	setPaginatedPosts(filteredPosts.slice(
	// 		(currentPage - 1) * postsPerPage,
	// 		currentPage * postsPerPage
	// 	))
	// }, [filteredPosts])
	

	// Обработчик удаления (с confirm)
	const handleDelete = (id) => {
		if (window.confirm(`Delete post ${id}?`)) {
			setPosts(posts.filter(post => post.id !== id));
		}
	};

	// Badge для статуса (цвета по статусу)
	const StatusBadge = ({ status }) => {
		const colorMap = {
			draft: 'default',
			published: 'default',
			archived: 'secondary',
		};
		const textMap = {
			draft: 'Draft',
			published: 'Published',
			archived: 'Archived',
		};
		return (
			<Badge variant={colorMap[status] || 'default'} className={
			status === 'published' ? 'bg-green-900 text-green-100 border-green-700' :
			status === 'draft' ? 'bg-gray-900 text-gray-100 border-gray-700' :
			'bg-red-900 text-red-100 border-red-700'
			}>
				{textMap[status] || status}
			</Badge>
		);
	};

	return (
	<div className="flex-1 p-6 bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 space-y-6">
		{/* Header с поиском и кнопкой создания */}
		<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div className="flex items-center gap-2">
			<BookType className="w-6 h-6 text-purple-400" />
			<h1 className="text-2xl font-bold text-gray-100 dark:text-gray-100">Posts</h1>
			<Badge className="bg-purple-900 text-purple-100 border-purple-700 ml-2">
			{/* {filteredPosts.length} total */}111 total 
			</Badge>
		</div>
		<Link to="/admin/posts/create">
			<Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
			<CirclePlus className="w-4 h-4" />
			Create Post
			</Button>
		</Link>
		</div>

		{/* Поиск */}
		<div className="relative max-w-md">
		<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
		<Input
			placeholder="Search posts by title or author..."
			value={searchQuery}
			onChange={(e) => setSearchQuery(e.target.value)}
			className="pl-9 bg-gray-800 dark:bg-gray-800 text-gray-100 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 border-gray-600 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500"
		/>
		</div>


		<div className="rounded-md border border-gray-700 dark:border-gray-700 bg-gray-800 dark:bg-gray-800 overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow className="hover:bg-gray-700 dark:hover:bg-gray-700 border-b border-gray-700 dark:border-gray-700">
						{['Title', 'Author', 'Date', 'Status', 'Actions'].map(head => (
							<TableHead key={head} className="text-gray-100 dark:text-gray-100 font-medium">{head}</TableHead>
						))}
					</TableRow>
				</TableHeader>

				<TableBody>
					{isLoading ? <TableRow><TableCell><i>Loading...</i></TableCell></TableRow> :
					!posts ? <TableRow><TableCell><b>Error</b></TableCell></TableRow> : (
					posts.map((post) => (
					<TableRow key={post._id} className="hover:bg-gray-700 dark:hover:bg-gray-700 border-b border-gray-700 dark:border-gray-700">
						{/* <TableCell className="text-gray-100 dark:text-gray-100 font-medium max-w-[50px]">{post._id}</TableCell> */}
						<TableCell className="text-gray-100 dark:text-gray-100 max-w-xs truncate">
							<div className="flex items-center gap-2">
								<BookType className="w-4 h-4 text-purple-400" />
								<span>{post.title}</span>
							</div>
						</TableCell>
						<TableCell className="text-gray-300 dark:text-gray-300">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-400" />
								<span>{post.createdBy}</span>
							</div>
						</TableCell>
						<TableCell className="text-gray-300 dark:text-gray-300">
							<div className="flex items-center gap-2">
								<Calendar className="w-4 h-4 text-gray-400" />
								{/* <span>{post.createdAt}</span> */}
							</div>
						</TableCell>
						{/* <TableCell><StatusBadge status={post.status} /></TableCell> */}
						<TableCell>-----</TableCell>
						<TableCell>
							<div className="flex gap-2">
								{/* <Link to={`/admin/posts/${post._id}/edit`}> */}
									{/* <Button variant="outline" size="sm" className="border-gray-600 dark:border-gray-600 text-gray-100 dark:text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700">
										<Edit className="w-4 h-4" />
									</Button> */}
									<button onClick={()=>{console.log(post)}}><Edit className="w-4 h-4" /></button>
								{/* </Link> */}
								<Button
									variant="destructive"
									size="sm"
									onClick={() => handleDelete(post._id)}
									className="bg-red-900 hover:bg-red-800 text-red-100 border-red-700">
									<Trash2 className="w-4 h-4" />
								</Button>
							</div>
						</TableCell>
					</TableRow>
					)))}
				</TableBody>
			</Table>
		</div>
		

		{/* Пагинация */}
		{!isLoading && totalPages > 1 && (
		<div className="flex items-center justify-between">
			<div className="text-sm text-gray-400 dark:text-gray-400">
			Page {currentPage} of {totalPages}
			</div>
			<div className="flex gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
				disabled={currentPage === 1}
				className="border-gray-600 dark:border-gray-600 text-gray-100 dark:text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50"
			>
				<ChevronLeft className="w-4 h-4" />
				Previous
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
				disabled={currentPage === totalPages}
				className="border-gray-600 dark:border-gray-600 text-gray-100 dark:text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-700 disabled:opacity-50"
			>
				Next
				<ChevronRight className="w-4 h-4" />
			</Button>
			</div>
		</div>
		)}
	</div>
	);
};

export default TestList;
