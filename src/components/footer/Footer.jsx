import React from "react";
import styles from "./Footer.module.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import logowhite from "../../assets/logowhite.svg";
import { useLanguage } from "../../contexts/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();

  const translations = {
    contactUs: {
      en: <>
            Contact us in any <br />
            convenient way
          </>,
      ru: <>
            Свяжитесь с нами любым <br />
            удобным способом
          </>,
      kg: <>
            Биз менен каалаган ыңгайлуу<br /> жол менен байланышыңыз
          </>
    },
    contacts: {
      en: "Contacts",
      ru: "Контакты",
      kg: "Байланыштар"
    },
    bishkekCity: {
      en: "Bishkek city",
      ru: "г. Бишкек",
      kg: "Бишкек шаары"
    },
    forClients: {
      en: "For clients",
      ru: "Для клиентов",
      kg: "Кардарлар үчүн"
    },
    aboutUs: {
      en: "About Us",
      ru: "О нас",
      kg: "Биз жөнүндө"
    },
    olympiads: {
      en: "Olympiads",
      ru: "Олимпиады",
      kg: "Олимпиадалар"
    }
  }

  return (
    <footer
      className={`flex flex-col items-center md:pt-[140px] md:h-[450px] ${styles.footer}`}
    >
      <p className={`hidden md:block ${styles.contact}`}>CONTACT</p>
      <div className="container mx-auto px-4 md:px-5 flex flex-col gap-5 md:flex-row justify-center md:gap-24 lg:gap-28 xl:justify-between items-center">
        <div className="flex flex-col items-center">
          <h3 className="flex items-center gap-1 text-lg font-bold">
            <img src={logowhite} alt="logowhite" />
            Jash Story
          </h3>
          <p className="mt-2">
            {translations.contactUs[language]}
          </p>
          <div className={`${styles.iconContainer} flex mt-4`}>
            <a
              href="https://www.instagram.com/jash_story_/"
              className={styles.icon}
              target="_blank"
            >
              <i className={`fab fa-instagram ${styles.instagram}`}></i>
            </a>
            <a
              href="https://wa.me/996704225775"
              className={styles.icon}
              target="_blank"
            >
              <i className={`fab fa-whatsapp ${styles.whatsapp}`}></i>
            </a>
            <a
              href="https://t.me/V1DevX"
              className={styles.icon}
              target="_blank"
            >
              <i className={`fab fa-telegram ${styles.telegram}`}></i>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold">
            {translations.contacts[language]}
          </h3>
          <p className="mt-2">akel.nurlanov@gmail.com</p>
          <p className="mt-2">
            {translations.bishkekCity[language]}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-lg font-bold">
            {translations.forClients[language]}
          </h3>
          <ul className="mt-2 space-y-2 text-center">
            <li>
              <a
                href="/about"
                className="relative after:content-[''] after:block after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              >
                {translations.aboutUs[language]}
              </a>
            </li>
            <li>
              <a
                href="/about#prev-olympiads"
                className="relative after:content-[''] after:block after:w-0 after:h-[2px] after:bg-white after:transition-all after:duration-300 hover:after:w-full"
              >
                {translations.olympiads[language]}
              </a>
            </li>
            {/* <li>
              <a href="/reviews" className="hover:underline">
                {language === "en" ? "Reviews" : "Отзывы"}
              </a>
            </li> */}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
