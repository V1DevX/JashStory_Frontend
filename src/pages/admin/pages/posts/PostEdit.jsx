import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Paragraph from "@editorjs/paragraph";
import ImageTool from "@editorjs/image";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const PostEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [post, setPost] = useState(null);

  // Загружаем пост
  useEffect(() => {
    fetch(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then(setPost);
  }, [id]);

  // Инициализация Editor.js после загрузки поста
  useEffect(() => {
    if (post && !editorRef.current) {
      editorRef.current = new EditorJS({
        holder: "editor",
        tools: {
          header: Header,
          list: List,
          paragraph: Paragraph,
          image: ImageTool,
        },
        data: { blocks: post.content || [] },
      });
    }
  }, [post]);

  const savePost = async () => {
    const output = await editorRef.current.save();
    await fetch(`${API_URL}/posts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ content: output.blocks }),
    });
    navigate(`/admin/posts/${id}`);
  };

  if (!post) return <p>Loading...</p>;

  return (
    <div>
      <h1>Edit Post: {post.title}</h1>
      <div id="editor" style={{ border: "1px solid #ccc", padding: "1rem" }}></div>
      <button onClick={savePost}>Save</button>
    </div>
  );
};

export default PostEdit;
