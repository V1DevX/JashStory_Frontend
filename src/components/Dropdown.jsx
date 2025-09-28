import React, { useState } from 'react';

const Dropdown = ({ title, options, func, buttonClassName="", menuClassName="", optionClassName="" }) => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	const handleOptionClick = (value) => {
		func(value)
		setIsOpen(false);
	};

	return (
		<div className="relative inline-block text-left w-full sm:w-auto">
			{/* Dropdown Button */}
			<button
				type="button"
				className={`inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
					${buttonClassName}`}
				onClick={toggleDropdown}
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				{title}
				<svg
					className={`-mr-1 ml-2 h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						fillRule="evenodd"
						d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
						clipRule="evenodd"
					/>
				</svg>
			</button>

			{/* Dropdown Menu (Adaptive Styling) */}
			{isOpen && (
				<div
					className={`
						origin-top-right absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none 
						
						/* ADAPTIVE STYLES: Mobile (default) */

						
						/* ADAPTIVE STYLES: Small screens and up (sm:) */
						sm:min-w-[150px] sm:z-10

						${menuClassName}
					`}
					role="menu"
					aria-orientation="vertical"
					aria-labelledby="menu-button"
					tabIndex="-1"
				>
					<div className="py-1" role="none">
						{options.map((option) => (
							<a
								key={option.value}
								className={`
									text-gray-700 block px-4 py-2 text-sm hover:bg-indigo-500 hover:text-white transition duration-150 ease-in-out 
									${optionClassName}
								`}
								onClick={(e) => {
									e.preventDefault();
									handleOptionClick(option.value);
								}}
							>
								{option.label}
							</a>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

// --- Example Usage ---
// const App = () => {
//   const menuOptions = [
//     { label: 'Edit Profile', value: 'edit' },
//     { label: 'Account Settings', value: 'settings' },
//     { label: 'Support', value: 'support' },
//     { label: 'Sign out', value: 'signout' },
//   ];
//   
//   return (
//     <div className="p-4 flex justify-center w-full">
//       <AdaptiveDropdown title="Options" options={menuOptions} />
//     </div>
//   );
// };

export default Dropdown;