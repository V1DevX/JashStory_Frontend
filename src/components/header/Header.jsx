import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import Logo from '../../assets/Logo';
import { useLanguage } from '../../contexts/LanguageContext'
import Dropdown from '../Dropdown';

const Header = ({className='', dark=false}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const UI = {
    languageOptions: [
      { label:'English', value:'en'},
      { label:'Русский', value:'ru'},
      { label:'Кыргызча', value:'kg'},
    ],
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

  // TODO: background image = lang flag

  return (
    <header 
      className={`
        rounded-b-[2vw] backdrop-blur-lg backdrop-brightness-[90%] py-2 md:py-5 px-4 md:px-10 flex gap-20 justify-between items-center
        ${dark ? "text-white w-full fixed top-0 z-50" : "mb-5"}
        ${className} 
      `}>
      
      <Link
        to={'/'}
        className="flex items-center gap-1 font-unbounded text-[24px] font-bold"
      >
        <Logo dark={dark}/>
        <span className="hidden md:inline">Jash Story</span>
      </Link>
      
      <nav aria-label="Main Navigation" className="hidden xl:flex font-sf">
        <div className="flex items-center gap-12 md:gap-8 hover:cursor-pointer text-[#393939] font-light">
          {[
            {id:'worldHistory', link: "#1"}, 
            {id:'historyOfKyrgyzstan', link: "#2"}, 
            {id:'olympiadHistory', link: "#3"},
            {id:'aboutUs', link: "/about"},
          ].map(item => (
            <Link
              key={item.id}
              to={item.link}
              className={`
                ${dark ? "text-white" : "text-black"}
                hover:scale-[1.1] transition-all duration-300 ease-in-out text-center`}
            >
              {UI[item.id][language]}
            </Link>
          ))}
        </div>
      </nav>

      <div className='flex items-center justify-center gap-3'>

        {/* Language Dropdown */ }
        <Dropdown title={language} options={UI.languageOptions} func={handleLanguageChange}/>
        
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
      <nav
        className={`${
          isMenuOpen ? 'max-h-[300px]' : 'max-h-0'
        } overflow-hidden transition-all duration-500 ease-in-out absolute top-[80px] left-0 w-full bg-[#E5E5E5] xl:hidden`}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          {[
            {id:'worldHistory', link: "#1"}, 
            {id:'historyOfKyrgyzstan', link: "#2"}, 
            {id:'olympiadHistory', link: "#3"},
            {id:'aboutUs', link: "/about"},
          ].map(item => (
            <Link 
              key={item.id}
              to={item.link}
              className="hover:text-[20px] transition-all duration-300 ease-in-out">
              {UI[item.id][language]}
            </Link>
          ))}
          {/* <Link className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {UI.historyOfKyrgyzstan[language]}
            
          </Link>
          <Link
            to={'#3'}
            className="hover:text-[20px] transition-all duration-300 ease-in-out"
          >
            {UI.olympiadHistory[language]}
          </Link>
          <Link
            to={'/about'}
            className="hover:text-[20px] transition-all duration-300 ease-in-out"
          >
            {UI.aboutUs[language]}
          </Link> */}
        </div>
      </nav>
    </header>
  );
};

export default Header;
