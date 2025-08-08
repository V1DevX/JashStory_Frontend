import React, { useState } from "react";
import Editor from "../../components/editor"; // твой Editor.jsx
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const PostCreate = () => {
  const [title, setTitle] = useState({
    en: "",
    ru: "",
    kg: ""
  });
  // const [category, setCategory] = useState([]);
  const [content, setContent] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
localStorage.setItem("auth", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODg1MDVjYmIzOWVjZTAyNmEyYzk3N2QiLCJuYW1lIjoiQWtlbCIsImVtYWlsIjoiYWtlbC5udXJsYW5vdkBnbWFpbC5jb20iLCJyb2xlIjoxLCJpYXQiOjE3NTQwNTcyMTAsImV4cCI6MTc1NDY2MjAxMH0.jit5qPHuA9EoI1YwWMm2jblkEhlF7qny-wesbmyrUTk");

    console.log("Token: ", localStorage.getItem("token"))
    const token = localStorage.getItem("token"); // JWT токен админа

    console.log("Content: ", content)
    const postData = {
      title,
      // category,
      content, // JSON с блоками Editor.js
    };

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postData),
      });

      if (!res.ok) throw new Error("Failed to create post");

      const data = await res.json();
      console.log(data)
      alert("Post created successfully!");
      navigate("/admin/posts"); // назад к списку постов
    } catch (error) {
      console.error(error);
      alert("Error creating post");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create New Post</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Title:</label>
          en
          <input
            type="text"
            value={title.en}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
          ru
          <input
            type="text"
            value={title.ru}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Category:</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Content:</label>
          <Editor onChange={setContent} />
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Create Post
        </button>
      </form>
    </div>
  );
};

export default PostCreate;
