import { Route, Routes } from "react-router-dom";

import Layout from './layout/Layout'
import Dashboard from "./Dashboard";

// 📚	Posts
import PostList from "./posts/PostList";
import PostEditor from "./posts/PostEditor";

//   	Tests
import TestList from "./tests/TestList";
import TestEditor from "./tests/TestEditor";

// 👥	Users
import UserList from "./users/UserList";

// 🏷️	Tags & Categories
import TagList from "./tags/TagList";
import CategoryList from "./categories/CategoryList";

const AdminPage = () => {
	return (
		<Routes>
		<Route path="/" element={<Layout/>}>
			<Route index element={<Dashboard />}/>
			<Route path="dashboard" element={<Dashboard />}/>
			<Route path="posts">
				<Route index element={<PostList />}/>
				<Route path="editor" element={<PostEditor />} />
			</Route>
			<Route path="tests">
				<Route index element={<TestList />}/>
				<Route path="editor/:id" element={<TestEditor />} />
			</Route>
			<Route path="users">
				<Route index element={<UserList />}/>
			</Route>
			<Route path="tags">
				<Route index element={<TagList />}/>
			</Route>
			<Route path="categories">
				<Route index element={<CategoryList />}/>
			</Route>
			<Route path="*" element={
					<div className="w-[100%] h-[100%] flex justify-center items-center">
						<h1 className="text-[64px] font-[800] font-unbounded drop-shadow-[2px_4px_0px_rgba(123,0,255,1)]">
							/404/
						</h1>
					</div>
					} />
		</Route>
		</Routes>
	)
}
export default AdminPage;