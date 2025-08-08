import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../../../context/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const PostView = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const { language } = useLanguage()

  useEffect(() => {
    fetch(`${API_URL}/posts/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(res => {
        setPost(res.data.post)
    })
      .catch(console.error);
  }, [id]);

  if (!post) return <p>Loading...</p>;

  return (
    <div>
      <h1>{post.title[language]}</h1>
      <div>
        {post.content?.map((block, i) => {
          if (block.type === "text") return <p key={i}>{block.value}</p>;
          if (block.type === "image") return <img key={i} src={block.url} alt="" />;
          return null;
        })}
      </div>
      <Link to={`/admin/posts/${id}/edit`}>Edit Post</Link>
    </div>
  );
};

export default PostView;
