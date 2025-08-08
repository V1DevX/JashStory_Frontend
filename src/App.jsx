import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Pages
import Home from "./pages/home/Home";
import Catalog from "./pages/catalog/Catalog";
import About from "./pages/about/About";
import Login from "./pages/login/Login";
import Registration from "./pages/registration/Registration";
import ArticlePage from "./pages/article/ArticlePage";

//  Admin
// import AdminPage from "./pages/admin/AdminPage";
// import PostList from "./pages/admin/pages/posts/PostList";
// import PostView from "./pages/admin/pages/posts/PostView";
// import PostEdit from "./pages/admin/pages/posts/PostEdit";
// import PostCreate from "./pages/admin/pages/posts/PostCreate";

// Features
import ScrollToTop from "./scrolltotop/ScrollToTop";

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="registration" element={<Registration />} />
        <Route path="article/:id" element={<ArticlePage />} />

      </Routes>
    </Router>
  );
};
//      <Route path="admin" element={<AdminPage />}>
//        {/* <Route index element={<Dashboard />} /> */}
//        <Route path="posts" element={<PostList />} >
//          <Route path="create" element={<PostCreate />} />
//          <Route path=":id" element={<PostView />} />
//          <Route path=":id/edit" element={<PostEdit />} />
//        </Route>
//      </Route>
export default App;





