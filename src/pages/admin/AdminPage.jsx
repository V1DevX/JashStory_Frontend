import { Navigate, Route, Routes } from "react-router-dom";

import Layout from './layout/Layout'
import Dashboard from "./Dashboard";

// 📚	Posts
import PostList from "./posts/PostList";
import PostCreate from "./posts/PostCreate";
// import PostView from "./pages/posts/PostView";
// import PostEdit from "./pages/posts/PostEdit";

//   	Tests
import TestList from "./tests/TestList";
import TestCreate from "./tests/TestCreate";

// 👥	Users
import UserList from "./users/UserList";

const AdminPage = () => {
	return (
		<Routes>
		<Route path="/" element={<Layout/>}>
			<Route index element={<Dashboard />}/>
			<Route path="dashboard" element={<Dashboard />}/>
			<Route path="posts">
				<Route index element={<PostList />}/>
				<Route path="create" element={<PostCreate />} />
			</Route>
			<Route path="tests">
				<Route index element={<TestList />}/>
				<Route path="create" element={<TestCreate />} />
			</Route>
			<Route path="users">
				<Route index element={<UserList />}/>
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