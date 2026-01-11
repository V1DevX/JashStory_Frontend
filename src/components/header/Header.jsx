import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo';
import { useLanguage } from '../../contexts/LanguageContext'
import Dropdown from '../Dropdown';

const Header = ({className='', dark=false}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const languageOptions = [
    { label:'English', value:'en'},
    { label:'Русский', value:'ru'},
    { label:'Кыргызча', value:'kg'},
  ]

  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const UI = {
    worldHistory: {
      en: "World History",
      ru: "Мировая История",
      kg: "Дүйнөлүк тарых"
    },
    historyOfKyrgyzstan: {
      en: "History of Central Asia",
      ru: "История Центральной Азии",
      kg: "Орто Азианын тарыхы"
    },
    olympiadHistory: {
      en: "Olympiad History",
      ru: "Олимпиадная История",
      kg: "Олимпиаданын тарыхы"
    },
    aboutUs: {
      en: "About Us",
      ru: "О нас",
      kg: "Биз жөнүндө"
    },
    signIn: {
      en: "Sign in",
      ru: "Войти",
      kg: "Кирүү"
    }
  }

  return (
    <header 
      className={`
        rounded-b-[2vw] backdrop-blur-lg backdrop-brightness-[90%] py-2 md:py-5 px-4 md:px-10 flex gap-20 justify-between items-center
        ${dark ? "text-white w-full fixed top-0 z-50" : "mb-5"}
        ${className} 
      `}>
      
      <a className="cursor-pointer flex items-center gap-1 font-unbounded text-[24px] font-bold"
        onClick={()=>navigate("/")}>
        <Logo dark={dark}/>
        <span className="hidden md:inline">Jash Story</span>
      </a>
      
      <nav aria-label="Main Navigation" className="hidden xl:flex font-sf">
        <ul className="flex items-center gap-12 md:gap-8 hover:cursor-pointer text-[#393939] font-light">
          {[
            {id:'worldHistory', link: "#1"}, 
            {id:'historyOfKyrgyzstan', link: "#2"}, 
            {id:'olympiadHistory', link: "#3"},
            {id:'aboutUs', link: "/about"},
          ].map(item => (
            <li 
              key={item.link}
              className={`
                ${dark ? "text-white" : "text-black"}
                hover:scale-[1.1] transition-all duration-300 ease-in-out text-center`}
              onClick={()=>navigate(item.link)}>
              {UI[item.id][language]}
            </li>
          ))}
        </ul>
      </nav>

      <div className='flex items-center justify-center gap-3'>

        {/* Language Dropdown */ }
        <Dropdown title={language} options={languageOptions} func={handleLanguageChange}/>
        
        {/* Burger Menu Button */}
        {dark ? "" :
          <div className="flex items-center space-x-4 xl:hidden">
            <button onClick={toggleMenu} className="text-3xl">
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        }
      </div>

      {/* Mobile Dropdown Menu */}
      <div
        className={`${
          isMenuOpen ? 'max-h-[300px]' : 'max-h-0'
        } overflow-hidden transition-all duration-500 ease-in-out absolute top-[80px] left-0 w-full bg-[#E5E5E5] xl:hidden`}
      >
        <ul className="flex flex-col items-center gap-4 py-4">
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {UI.worldHistory[language]}
            
          </li>
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {UI.historyOfKyrgyzstan[language]}
            
          </li>
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {UI.olympiadHistory[language]}
            
          </li>
          <li onClick={()=>navigate('/about')} className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {UI.aboutUs[language]}
            
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
