import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import logowhite from "../../assets/logowhite.svg";
import googlelogo from '../../assets/googlelogo.svg';

const Login = () => {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    await login(email, password);
    nav('/admin'); // или куда надо
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <br />
      <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />
      <br />
      <button type="submit">Войти</button>
    </form>
  );

  // return (
  //   <div className="bg-login-bg bg-cover h-[100vh] w-full bg-center p-5 grid grid-cols-2">
  //     <div className="flex flex-col items-center text-white gap-6 px-40 pt-11 relative">
  //       <a href="/">
  //           <img className="w-10 h-10" src={logowhite} alt="logowhite" />
  //       </a>
  //       <span className="font-helvetica text-5xl font-extrabold">
  //         Jash Story
  //       </span>
  //       <span className="font-light font-sf text-2xl">
  //         После регистрации мы создадим ваш единный аккаунт ММСО-ID для участия
  //         в будущих мероприятиях ММСО
  //       </span>
  //     </div>
  //     <div className="bg-white rounded-[40px] font-sf flex flex-col items-center gap-8 p-10">
  //       <div className="flex flex-col gap-8">
  //         <div className="flex flex-col gap-4 items-center">
  //           <span className="text-6xl font-sf font-bold">Вход</span>
  //           <span className="text-[#83888F]">Ещё нет аккаунта? <span className="text-[#DD9AFA]">Регистрация</span></span>
  //         </div>
  //         <div className="text-lg flex flex-col gap-4">
  //           <span>Войдите через Google</span>
  //           <button className="flex flex-col items-center font-medium text-sm border w-[420px] rounded-2xl">
  //               <img src={googlelogo} alt="googlelogo" />
  //               Google
  //           </button>
  //         </div>
  //       </div>
  //       <div className="flex flex-col gap-6">
  //           <div className="flex flex-col gap-4">
  //               <span className="text-lg">Или с помощью почты и пароля</span>

  //               <label>E-mail</label>
  //               <input 
  //               className="bg-[#F4F5F6] p-4 rounded-xl" 
  //               type="text" placeholder="example@gmail.com" 
  //               value={email} onChange={(e) => setEmail(e.target.value)}/>

  //               <label>Пароль</label>
  //               <input 
  //               className="bg-[#F4F5F6] p-4 rounded-xl"
  //               type="text" placeholder="Пароль"
  //               value={password} onChange={(e) => setPassword(e.target.value)} />
  //           </div>
  //           <div className="flex flex-col gap-4" onClick={onSubmit}>
  //               <button className="bg-[#DD9AFA] text-lg rounded-xl p-5 text-white font-normal w-[420px]">Войти</button>
  //               <span className="text-[#83888F] text-center text-sm">Забыли пароль? <span className="text-[#DD9AFA]">Восстановите здесь</span></span>
  //           </div>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Login;
