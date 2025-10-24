import React from "react";
import { ClipLoader } from "react-spinners";
import { useLanguage } from "../../contexts/LanguageContext";

const Loader = () => {
	const { language } = useLanguage();
	return (
	<div className="flex justify-center items-center h-[100%] flex-col">
		<ClipLoader size={100} color="#000000" loading={true} />
		<p className="text-lg mt-4">
			{language === "en" ? "Loading..." : "Загрузка..."}
		</p>
	</div>
	)
}

export default Loader