import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const User = () => {
	const { user, logout} = useAuth();


	return (
		<>
		<div>
			<b>
				{user.name}
			</b>
		</div>
		<button 
			className="fonr-[30px] text-[#ff0000] bg-[gray] px-[20px] py-[10px]"
			onClick={logout}>
				Logout
		</button>
		</>
	)
}
export default User;