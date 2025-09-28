import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoblack from '../../assets/logoblack.svg';
import { useLanguage } from '../../context/LanguageContext'



const Header = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const headerClassName = props.className || "flex justify-between my-7 md:my-10 px-4 md:px-10 gap-20 items-center"
  

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, [setLanguage]);

  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleAboutClick = () => {
    navigate("/about");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const translations = {
    worldHistory: {
      en: "World History",
      ru: "Мировая История",
      kg: "Дүйнөлүк тарых"
    },
    historyOfKyrgyzstan: {
      en: "History of Kyrgyzstan",
      ru: "История Кыргызстана",
      kg: "Кыргызстандын тарыхы"
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
  const languageSelector = <select
          name='languageSelector'
          value={language}
          onChange={handleLanguageChange}
          className="text-[#333335] bg-white border border-gray-300 rounded-[45px] px-4 py-1 text-lg focus:outline-none hover:cursor-pointer"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="kg">Кыргызча</option>
        </select>

  return (
    <header className={headerClassName}>
      <a onClick={handleHomeClick} className="cursor-pointer flex items-center gap-1 font-unbounded text-[24px] font-bold">
        {!props.className ? <img src={logoblack} alt="Logo" /> : <></>}
        <span className="hidden sm:inline">Jash Story</span>
      </a>

      <div className="flex items-center space-x-4">
        {/* Language Dropdown */}
        {languageSelector}

        {/* Burger Menu Button */}
        <button onClick={toggleMenu} className="text-3xl">
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <nav aria-label="Main Navigation" className="hidden xl:flex font-sf">
        <ul className="flex items-center gap-12 md:gap-8 hover:cursor-pointer text-[#393939] font-light">
          <li className="hover:text-[18px] transition-all duration-300 ease-in-out text-center">
          {translations.worldHistory[language]}
            
          </li>
          <li className="hover:text-[18px] transition-all duration-300 ease-in-out text-center">
          {translations.historyOfKyrgyzstan[language]}

          </li>
          <li className="hover:text-[18px] transition-all duration-300 ease-in-out text-center">
          {translations.olympiadHistory[language]}
            
          </li>
          <li onClick={handleAboutClick} className="hover:text-[18px] transition-all duration-300 ease-in-out text-center">
          {translations.aboutUs[language]}

          </li>
        </ul>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        className={`${
          isMenuOpen ? 'max-h-[300px]' : 'max-h-0'
        } overflow-hidden transition-all duration-500 ease-in-out absolute top-[80px] left-0 w-full bg-[#E5E5E5] xl:hidden`}
      >
        <ul className="flex flex-col items-center gap-4 py-4">
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {translations.worldHistory[language]}
            
          </li>
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {translations.historyOfKyrgyzstan[language]}
            
          </li>
          <li className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {translations.olympiadHistory[language]}
            
          </li>
          <li onClick={handleAboutClick} className="hover:text-[20px] transition-all duration-300 ease-in-out">
          {translations.aboutUs[language]}
            
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
