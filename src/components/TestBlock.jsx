import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { API_URL } from "@/config";

const TestBlock = ({ id }) => {
	const { language } = useLanguage();
	const [test, setTest] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('hi');
	const [idx, setIdx] = useState(0);

	const fetchData = async (path, query, errorMessage) => {
		try {
			const response = await fetch(
				`${API_URL}/${path.join("/")}${query ? `?${new URLSearchParams(query).toString()}` : ""}`,
				{
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				}
			).then(res => res.json())

			return response.data
		} catch (err) {
			console.error(`${errorMessage}:`, err);
			setError(errorMessage);
		}
	};

	const loadTest = async () => {
		try {
			setLoading(true)
			const testData = await fetchData(["tests", id], {lang:language || "en", answers:true}, "Failed to load the test");
			setTest(testData.questions || []);
			console.log(test);
			
		} catch (err) {
			console.error("Error loading test:", err);
		} finally {
			setLoading(false)
		}
	};

	useEffect(() => {
		loadTest()
	}, [language, id]);
	
	if (error) {
		return <div className="text-red-600 text-center my-6">{error}</div>;
	}

	return (
		<div className="w-full max-w-3xl mx-auto my-10">
			<div className="bg-white text-gray-900 rounded-2xl shadow-lg p-8">
				<div className="text-center mb-6">
					<h3 className="text-2xl font-semibold">Решить тест</h3>
					<p className="text-sm text-gray-500">Решите тест чтобы укрепить свои знания</p>
				</div>

				<div className="mb-4 border-b pb-4">
					<div className="text-center font-semibold text-lg">qText</div>
				</div>

				<ul className="space-y-3">
					{opts.map((opt, i) => {
						const selected = (answers[idx] || []).includes(i);
						const correct = !!opt.isCorrect;
						const showResult = checked;
						const bg = showResult ? (correct ? "bg-green-50 border-green-300" : (selected ? "bg-red-50 border-red-300" : "bg-white")) : (selected ? "bg-violet-50 border-violet-300" : "bg-white");
						return (
							<li key={i} className={`flex items-center gap-4 p-3 rounded-lg border ${bg} hover:bg-gray-50`}>
								<button
									onClick={() => toggleOption(i)}
									className="flex-none w-8 h-8 inline-flex items-center justify-center rounded-full border text-sm font-medium text-gray-700 bg-white"
									aria-pressed={selected}
								>
									{String.fromCharCode(65 + i)}
								</button>

								<div className="flex-1">
									<button onClick={() => toggleOption(i)} className="text-left w-full">
										<div className="text-sm">{opt.text}</div>
									</button>
								</div>

								{showResult && (
									<div className="flex-none text-sm">
										{correct ? <span className="text-green-600 font-medium">✓</span> : (selected ? <span className="text-red-600 font-medium">✕</span> : null)}
									</div>
								)}
							</li>
						);
					})}
				</ul>

				<div className="mt-6 flex items-center justify-between">
					<div className="text-sm text-gray-500">
						{idx + 1} / {test.length}
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => { setChecked(false); setAnswers({}); setIdx( Math.max(0, idx-1) ); }}
							className="px-3 py-2 bg-gray-100 text-gray-700 rounded"
						>
							Пропустить
						</button>

						<button
							onClick={() => {
								handleCheck();
							}}
							className="px-4 py-2 bg-gradient-to-r from-violet-500 to-pink-400 text-white rounded shadow"
						>
							Проверить
						</button>

						<button
							onClick={() => {
								setChecked(false);
								setIdx(i => Math.min(test.length - 1, i + 1));
							}}
							className="px-3 py-2 bg-gray-100 text-gray-700 rounded"
						>
							Далее
						</button>
					</div>
				</div>

			</div>
		</div>
	);
};

export default TestBlock;