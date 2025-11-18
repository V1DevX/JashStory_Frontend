import { useState } from "react";
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import logowhite from "@/assets/logowhite.svg";
import googlelogo from '@/assets/googlelogo.svg';

const Login = () => {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    await login(email, password);
    nav('/admin');
  }

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gray-900">
      <div className="mb-8">
        <img src={logowhite} alt="JashStory Logo" className="w-32 h-32"/>
      </div>
      <form onSubmit={onSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg w-80 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Admin Login</h2>
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-violet-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-violet-500"
          required
        />
        <button 
          type="submit" 
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
