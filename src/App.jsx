import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { RequireAuth } from './context/AuthContext';

// 🏠	Pages
import Home from "./pages/home/Home";
import Catalog from "./pages/catalog/Catalog";
import About from "./pages/about/About";

// 📒	Articles
import ArticlePage from "./pages/article/ArticlePage";

// 🧑	User
import Login from "./pages/login/Login";
import User from "./pages/user/User";

// 🔒	Admin
import AdminPage from "./pages/admin/AdminPage";

// 🔩	Features
import ScrollToTop from "./scrolltotop/ScrollToTop";

const App = () => {
	return (
		<Router>
			<ScrollToTop />
			<Routes>
				{/* 🔹 Публичные маршруты */}
				<Route index element={<Home />} />
				<Route path="/catalog" element={<Catalog />} />
				<Route path="/about" element={<About />} />
				<Route path="/article/:id" element={<ArticlePage />} />
				
				<Route path="/login" element={<Login />}/>
				<Route path="/register" element={<Login />}/>


				{/* 🔹 Закрытые маршруты */}
				<Route element={<RequireAuth />}>
					<Route path="/user/*" element={<User />} />
					<Route path='/admin/*' element={<AdminPage />} />
				</Route>

				{/* 🔹 Undefined location */}
				<Route path="*" element={
					<div className="w-[100%] h-[100%] flex justify-center items-center">
						<h1 className="text-[64px] font-[800] font-unbounded drop-shadow-[2px_4px_0px_rgba(123,0,255,1)]">
							/404/
						</h1>
					</div>
					} /> 
			</Routes>
		</Router>
	);
};

export default App;





