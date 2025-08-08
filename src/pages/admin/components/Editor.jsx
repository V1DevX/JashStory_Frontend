import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import List from "@editorjs/list";
// import ImageTool from "@editorjs/image";

const Editor = ({ initialData = {}, onChange }) => {
  const editorInstance = useRef(null);

  useEffect(() => {
    if (!editorInstance.current) {
      editorInstance.current = new EditorJS({
        holder: "editorjs",
        tools: {
          header: Header,
          paragraph: Paragraph,
          list: List,
        //   image: {
        //     class: ImageTool,
        //     config: {
        //       endpoints: {
        //         // Настрой на свой backend
        //         byFile: "http://localhost:5000/api/v1/upload",
        //         byUrl: "http://localhost:5000/api/v1/fetchUrl",
        //       },
        //     },
        //   },
        },
        data: initialData,
        onChange: async () => {
          const content = await editorInstance.current.save();
          onChange && onChange(content);
        },
      });
    }

    return () => {
      editorInstance.current?.destroy();
      editorInstance.current = null;
    };
  }, []);

  return <div id="editorjs" style={{ border: "1px solid #ccc", padding: "10px" }} />;
};

export default Editor;
