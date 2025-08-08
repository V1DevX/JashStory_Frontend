import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { ClipLoader } from "react-spinners";
import "./ArticleStyles.css";
import { useLanguage } from "../../context/LanguageContext";

const ArticlePage = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [articleData, setArticleData] = useState(null);
  const [articleContent, setArticleContent] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  const transformContent = (data, divStyle="w-[80vw] flex flex-col gap-[40px]") => {

    
    const newData = data.map(block => {
      
      switch(block.type){
        case "div":
          return transformContent(block.data, block.class)
        
        case "h": 
          return <p
            className="text-3xl font-[800] md:text-[32px] font-unbounded text-white">
            {block.data.text}</p>
        
        case "p":
          return <p 
            className="font-[600] md:text-[16px] text-white">
            {block.data.text}</p>
        
        case "img":
          return (
            <div className="flex justify-center items-center">
              <img 
                className="aspect-square object-cover rounded-[50%]" 
                src={block.data.url} 
                alt={block.data.alt}/>
            </div>
          )
        default:
          return <p 
            className="font-[700] md:text-[16px] text-[#f00] bg-black">
            *UNDEFINED_{block.id}*</p>
      }
    });

    return <div className={divStyle}>{...newData}</div>
  }

  useEffect(() => {
    const fetchArticle = async () => {
      try {

        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/v1/posts/${id}/${language}`,
          {
            headers: {
              // 'Accept-Language': language
            }
          }
        );
        const resJson = await response.json();
        setPreviewImageUrl(resJson.data.previewImage)
        const data = resJson.data[language]
        setArticleData({
          title: data.title,
          desc: data.desc,
          // rating: data.rating
          // favor
        })
        setArticleContent(transformContent(data.content.blocks))

        console.log(articleContent)


      } catch (err) {
        console.error("Error loading article:", err);
        setError(
          language === "en"
            ? "Failed to load the article"
            : "Не удалось загрузить статью"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, language]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen flex-col">
          <ClipLoader size={100} color="#00000" loading={loading} />
          <p className="text-lg mt-4">
            {language === "en" ? "Loading..." : "Загрузка..."}
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-center text-lg text-red-500">{error}</p>
        </div>
        <Footer />
      </>
    );
  }

  // const { article } = articleData || {};

  return (
    <>
      {/* <Header /> */}
      <div className="bg-[#666]">
        
        <div 
          style={{'--image-url': `url(${previewImageUrl})`}}  
          className='h-screen bg-[image:var(--image-url)] bg-no-repeat bg-cover bg-center rounded-b-[2vw]'
          >
          {/* <div >
            HELLO
          </div> */}
          <div className='h-full flex flex-col justify-center gap-10 pl-[10%] backdrop-brightness-[35%] rounded-b-[2vw]'>
            <p className="w-[60vw] text-5xl md:text-[64px] font-unbounded font-bold text-white">
              {articleData.title} 
            </p>
            <p className="w-[45vw] text-3xl md:text-[16px] font-unbounded font-bold text-white">
              {articleData.desc}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center mt-[110px] pb-[120px]">
            {articleContent}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ArticlePage;