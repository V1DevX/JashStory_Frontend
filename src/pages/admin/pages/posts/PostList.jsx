import React, { useEffect, useState } from "react";
import PostFilters from "../../components/PostFilters";
import { useLanguage } from "../../../../context/LanguageContext";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const PostList = () => {
  const [postList, setPostList] = useState([]);
  const [filter, setFilter] = useState({ category: "", search: "" });
  const { language } = useLanguage()

  useEffect(() => {
    // const query = new URLSearchParams(filter).toString();
    fetch(`${API_URL}/posts`, {
      headers: {
        // Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(res => {
        // console.log(res); 
        setPostList(res.data.posts)
        // console.log(postList)
    })
      .catch(console.error);
  }, [filter]);

  return (
    <div>
      <h1>Posts</h1>
      <PostFilters filter={filter} setFilter={setFilter} />
      <ul>
        {postList.map((post) => (
          <li key={post._id}>
            <a href={`/admin/posts/${post._id}`}>{post.title[language]}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostList;
