import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useAuth } from "@/contexts/AuthProvider";
import api from "@/api";
import {
	Trash2,
	SquareX,
	CircleX,
	CirclePlus,
	CircleCheck,
} from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";

const TestEditor = () => {
	// TODO: Learn how to use React-Quary for data fetching and caching
	// import { useQuery } from '@tanstack/react-query';
	
	const params = useParams();
	const testIdRef = useRef(params.id || null);
	const [searchParams, setSearchParams] = useSearchParams();
	const mode = searchParams.get("mode") || "create"; // create or edit

	const [lang, setLang] = useState("ru");
	const [idCount, setIdCount] = useState(2);
	const [questions, setQuestions] = useState([{
		id: 1,
		en: { question: "", options: [{ text: "", isCorrect: false }], desc: "" },
		ru: { question: "", options: [{ text: "", isCorrect: false }], desc: "" },
		kg: { question: "", options: [{ text: "", isCorrect: false }], desc: "" },
	}]);	

	useEffect(() => {
		if (mode==="edit" && testIdRef.current) { // Fetch existing test data 
			const fetchTest = async () => {

				const link = `/tests/${testIdRef.current}`
				const config = {
					params: {
						isEditMode: true,
					}
				}

				try {
					const { data } = await api.get(link, config)
					
					if (data) {
						setQuestions(data.questions);
						// Обновить idCount, чтобы избежать конфликтов ID
						const maxId = data.questions.reduce((max, q) => Math.max(max, q.id), 0);
						setIdCount(maxId + 1);
					}
				} catch (err) {
					console.error("Error fetching test:", err);
				}
			};
			fetchTest();
		}
	}, []);

	// Добавить новый вопрос
	const addQuestion = () => {
		const newQ = {
			id: idCount,
			en: { question: "", options: [], desc: "" },
			ru: { question: "", options: [], desc: "" },
			kg: { question: "", options: [], desc: "" },
		};
		setQuestions([...questions, newQ]);
		setIdCount(idCount + 1);
	};

	// Добавить новый вариант ответа к каждому языку
	const addOption = (qid) => {
		setQuestions((prev) => prev.map((q) => {
				if(q.id !== qid) return q

				const newOpts = {...q};
				['ru','en','kg'].forEach(l=>{
					newOpts[l] = {
						...q[l],
						options: [...q[l].options, { text: "", isCorrect: false }],
						desc: ""
					}
				})

				return newOpts;
			})
		);
	};

	// Обновить текст вопроса
	const updateQuestion = (qid, e) => {
		const { name, value } = e.target;
		setQuestions((prev) =>
			prev.map((q) =>
				q.id === qid ? { ...q, [lang]: { ...q[lang], [name]: value } } : q
			)
		);
	};

	// Обновить вариант ответа
	const updateOption = (qid, idx, e) => {
		const { name, value, type, checked } = e.target;
		setQuestions(prev => prev.map(q => {
				if (q.id !== qid) return q;
				const updatedQ = {...q};

				if(type === "checkbox"){
					['ru','en','kg'].forEach(l=>{
						updatedQ[l].options[idx][name] = checked
					})

				} else {
					updatedQ[lang].options[idx][name] = value
				}
				
				return updatedQ;
			})
		);
	};

	// Удалить вариант ответа у каждого языка
	const deleteOption = (qid, idx) => {
		setQuestions((prev) => prev.map((q) => {
				if (q.id !== qid) return q;

				const updatedQ = {...q};
				['ru','en','kg'].forEach(l=>{
					const oldOpts = q[l].options;

					const newOptions = [
						...oldOpts.slice(0, idx),
						...oldOpts.slice(idx + 1)
					];

					updatedQ[l] = {
						...q[l],
						options: newOptions
					};
					
				})
				

				return updatedQ;
			})
		);
	};

	// Удалить вопрос
	const deleteQuestion = (qid) => {
		setQuestions((prev) => prev.filter((q) => q.id !== qid));
	};

	// Отправить на сервер
	const saveTest = async () => {
		try {
			setQuestions(questions.map(q => ({en:q.en, ru:q.ru, kg:q.kg}))); // очистить id перед отправкой
			
			const { data } = await api.post(`/tests/${testIdRef.current}`, { questions });
			console.log("✅ Test saved:", data);
		} catch (err) {
			console.error(err);
		}
	};
	
	return (
		<div>
			<h1 className="text-[30px] font-[700]">Create Test</h1>
			<Tabs defaultValue={lang} onValueChange={setLang} className="w-full mb-5">
				<TabsList className="w-full flex justify-around">
					{['ru', 'en', 'kg'].map(l => (
						<TabsTrigger key={l} value={l}
							className={`w-full text-[20px] font-[600] duration-200 ${
								lang === l ? '!bg-violet-800' : 'hover:bg-violet-950'}`}>
							{l.toUpperCase()}
							</TabsTrigger>
						))}
				</TabsList>
			</Tabs>

			<div 
				className="mt-2 h-[calc(100vh-220px)] overflow-y-auto flex flex-col gap-2
				[&::-webkit-scrollbar]:w-1
				[&::-webkit-scrollbar-track]:rounded-full
				[&::-webkit-scrollbar-track]:bg-purple-950/20
				[&::-webkit-scrollbar-thumb]:rounded-full
				[&::-webkit-scrollbar-thumb]:bg-purple-800">

			{questions.map((q) => (
				<Card key={q.id} className="border-2 border-gray-700 p-3 relative mb-2">
					<div className="flex justify-between items-center">
					<input
							name="question"
							value={q[lang].question}
							onChange={(e) => updateQuestion(q.id, e)}
							placeholder="Enter question text"
							className="!placeholder-gray-500 bg-gray-900 font-bold w-[100%] px-4 py-2
								border-2 border-gray-800 focus:border-purple-800 outline-none"
						/>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => deleteQuestion(q.id)}
						>
							<SquareX size={32} color="red" strokeWidth={2} absoluteStrokeWidth className="!w-6 !h-6"/>
						</Button>
					</div>

					<div className="mt-1 space-y-3">
						

						<div className="mt-2 space-y-2">
							{q[lang].options.map((opt, i) => (
								
								<div key={i} className="flex gap-3 items-center">
									<label className="flex items-center gap-1 cursor-pointer">
										<input
											type="checkbox"
											name="isCorrect"
											checked={opt.isCorrect}
											onChange={(e) => updateOption(q.id, i, e)}
											className="hidden"
										/>
										{opt.isCorrect ? 
										<CircleCheck size={32} color="lime" strokeWidth={2} absoluteStrokeWidth /> : 
										<CircleX size={32} color="gray" strokeWidth={2} absoluteStrokeWidth />}
									</label>
									<input
										name="text"
										value={opt.text}
										onChange={(e) => updateOption(q.id, i, e)}
										placeholder={`Option ${i + 1}`}
										className="!placeholder-gray-500 bg-gray-900 w-[100%] px-4 py-2
											border-indigo border-2 border-gray-800 focus:border-purple-800 outline-none"
									/>
									<button onClick={e => deleteOption(q.id, i)}><Trash2 size={16} color="red"/></button>
								</div>
							))}
							<Button
								size="sm"
								variant="secondary"
								onClick={() => addOption(q.id)}
							>
								<CirclePlus className="!w-5 !h-5"/> Add option
							</Button>
						</div>

						<div className="flex gap-3 mt-3">
							<textarea
								name="desc"
								value={q[lang].desc}
								onChange={(e) => updateQuestion(q.id, e)}
								placeholder="Description for answer"
								className="border-indigo border-2 border-gray-800 focus:border-purple-800
									outline-none w-[100%] p-4 bg-gray-900
									overflow-y-auto min-h-[85px]
									[&::-webkit-scrollbar]:w-1
									[&::-webkit-scrollbar-track]:rounded-full
									[&::-webkit-scrollbar-track]:bg-purple-950/20
									[&::-webkit-scrollbar-thumb]:rounded-full
									[&::-webkit-scrollbar-thumb]:bg-purple-800"
							/>
						</div>
					</div>
				</Card>
			))}
			
			<div className="flex gap-3 mt-5">
				<Button onClick={addQuestion}>➕ Add Question</Button>
				<Button onClick={saveTest}>💾 Save Test</Button>
			</div></div>
		</div>
	);
}

export default TestEditor;