// import { useInView } from "react-intersection-observer";
import { Link } from "react-router-dom";
import { Card as UICard } from "@/components/ui/card";
import cloudinaryTransforms from "@/features/cloudinaryTransforms";
import { useLanguage } from "../../contexts/LanguageContext";

const UI = {
  en: {
    read: "Read",
  },
  ru: {
    read: "Читать",
  },
  kg: {
    read: "Көрүү",
  }
}

const Card = ({ id, img, text, bgColor = "bg-white" }) => {
  const { language } = useLanguage()

  const finalImage = cloudinaryTransforms(img, [
		"g_auto:face",  // gravity 
		"ar_2:1",       // aspect ratio
    "c_fill",       // crop
  ]);

  return (
    <Link to={`/article/${id}`} className="block">
      <UICard 
        className={`relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer transition-transform duration-300 hover:scale-[101%] ${bgColor}`}
      >
        <div className="w-full h-48 sm:h-56 md:h-52 lg:h-56 overflow-hidden">
          <img 
            src={finalImage}
            alt={text}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold line-clamp-2">{text}</h3>
          <div
            className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-800 px-3 py-1 rounded text-sm font-medium"
          >
            {UI[language].read}
          </div>
        </div>

      </UICard>
    </Link>
  )
};

export default Card;
