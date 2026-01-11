import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/api";
import useDraftStore from "@/stores/draftStore";
import * as Dialog from "@radix-ui/react-dialog";
import { useParams, useSearchParams } from "react-router-dom";
import {
	SquareX,
	CircleX,
	CirclePlus,
	CircleCheck,
	List,
	Save,
	Trash2,
} from "lucide-react";

const makeEmptyQuestion = (id) => ({
	id,
	en: { text: "", options: [{ text: "", isCorrect: false }], desc: "" },
	ru: { text: "", options: [{ text: "", isCorrect: false }], desc: "" },
	kg: { text: "", options: [{ text: "", isCorrect: false }], desc: "" },
});

const normalizeOptions = (options) => {
	if (Array.isArray(options) && options.length > 0) {
		return options.map((opt) => ({
			text: opt?.text ?? "",
			isCorrect: !!opt?.isCorrect,
		}));
	}
	return [{ text: "", isCorrect: false }];
};

const normalizeLangQuestion = (source, fallback) => ({
	text: source?.text ?? fallback?.text ?? "",
	options: normalizeOptions(source?.options ?? fallback?.options),
	desc: source?.desc ?? fallback?.desc ?? "",
});

const normalizeQuestions = (raw) => {
	if (!raw) return [makeEmptyQuestion(1)];

	if (Array.isArray(raw) && raw[0]?.en && raw[0]?.ru && raw[0]?.kg) {
		return raw;
	}

	if (raw?.ru || raw?.en || raw?.kg) {
		const base = raw.ru || raw.en || raw.kg || [];
		return base.map((q, idx) => ({
			id: q?.id ?? idx + 1,
			ru: normalizeLangQuestion(raw.ru?.[idx], q),
			en: normalizeLangQuestion(raw.en?.[idx], q),
			kg: normalizeLangQuestion(raw.kg?.[idx], q),
		}));
	}

	return [makeEmptyQuestion(1)];
};

const TestEditor = () => {
	const params = useParams();
	const testIdRef = useRef(params.id || null);

	const [searchParams] = useSearchParams();
	const modeRef = useRef(searchParams.get("mode") || "create");
	const [testTitle, setTestTitle] = useState(
		searchParams.get("postTitle") || "New Test"
	);

	const [lang, setLang] = useState("ru");
	const [idCount, setIdCount] = useState(2);
	const [questions, setQuestions] = useState([makeEmptyQuestion(1)]);
	const [isLoading, setIsLoading] = useState(false);
	const [isReady, setIsReady] = useState(modeRef.current !== "edit");

	// Draft store
	const setDraft = useDraftStore((state) => state.setDraft);
	const updateDraft = useDraftStore((state) => state.updateDraft);
	const deleteDraft = useDraftStore((state) => state.deleteDraft);
	const listDrafts = useDraftStore((state) => state.listDrafts);

	const draftIdRef = useRef(
		searchParams.get("draft") ||
			searchParams.get("testDraft") ||
			`testDraft-${Date.now()}`
	);

	const [openDrafts, setOpenDrafts] = useState(false);

	const applyTestData = (payload) => {
		const normalized = normalizeQuestions(
			payload?.questions || payload?.data?.questions || payload?.data || payload
		);
		setQuestions(normalized);
		const maxId = normalized.reduce((max, q) => Math.max(max, q.id || 0), 0);
		setIdCount(maxId + 1);
		if (payload?.postTitle) setTestTitle(payload.postTitle);
		if (payload?.lang) setLang(payload.lang);
		setIsReady(true);
	};

	const persistDraft = () => {
		const id = draftIdRef.current;
		const payload = {
			lang,
			testTitle,
			questions,
			idCount,
			testId: testIdRef.current,
		};
		const stored = useDraftStore.getState().drafts[id];
		if (stored?.formData) {
			updateDraft(id, { updatedAt: Date.now(), formData: payload });
		} else {
			setDraft(id, { createdAt: Date.now(), updatedAt: Date.now(), formData: payload });
		}
	};

	useEffect(() => {
		if (!isReady) return;
		const t = setTimeout(() => {
			persistDraft();
		}, 400);
		return () => clearTimeout(t);
	}, [questions, idCount, lang, testTitle, updateDraft]);

	useEffect(() => {
		if (modeRef.current !== "edit") setIsReady(true);
	}, []);

	const loadDraft = (id) => {
		const stored = useDraftStore.getState().drafts[id];
		if (!stored) return;
		const data = stored.formData || stored;
		const draftLang = data.lang || "ru";
		setLang(draftLang);
		setTestTitle(data.testTitle || "New Test");
		setQuestions(data.questions || [makeEmptyQuestion(1)]);
		setIdCount(data.idCount || 2);
		testIdRef.current = data.testId || testIdRef.current;
		draftIdRef.current = id;
		setOpenDrafts(false);
		setIsReady(true);
	};

	useEffect(() => {
		if (modeRef.current === "edit" && testIdRef.current) {
			const fetchTest = async () => {
				setIsLoading(true);
				const link = `/tests/${testIdRef.current}`;
				const config = { params: { isEditMode: true } };

				try {
					const { data } = await api.get(link, config);
					if (data) {
						applyTestData(data);
					}
				} catch (err) {
					console.error("Error fetching test:", err);
					setIsReady(true);
				} finally {
					setIsLoading(false);
				}
			};
			fetchTest();
		}
	}, []);

	const addQuestion = () => {
		const newQ = makeEmptyQuestion(idCount);
		setQuestions([...questions, newQ]);
		setIdCount((c) => c + 1);
	};

	const updateQuestion = (qid, e) => {
		const { name, value } = e.target;
		setQuestions((prev) =>
			prev.map((q) =>
				q.id === qid ? { ...q, [lang]: { ...q[lang], [name]: value } } : q
			)
		);
	};

	const deleteQuestion = (qid) => {
		setQuestions((prev) => prev.filter((q) => q.id !== qid));
	};

	const addOption = (qid) => {
		setQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== qid) return q;
				const next = { ...q };
				["ru", "en", "kg"].forEach((l) => {
					next[l] = {
						...q[l],
						options: [...q[l].options, { text: "", isCorrect: false }],
					};
				});
				return next;
			})
		);
	};

	const updateOption = (qid, idx, e) => {
		const { name, value, type, checked } = e.target;
		setQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== qid) return q;
				const updatedQ = { ...q };

				if (type === "checkbox") {
					["ru", "en", "kg"].forEach((l) => {
						const opts = (updatedQ[l]?.options || []).map((opt, i) =>
							i === idx ? { ...opt, [name]: checked } : opt
						);
						updatedQ[l] = { ...updatedQ[l], options: opts };
					});
				} else {
					const opts = (updatedQ[lang]?.options || []).map((opt, i) =>
						i === idx ? { ...opt, [name]: value } : opt
					);
					updatedQ[lang] = { ...updatedQ[lang], options: opts };
				}

				return updatedQ;
			})
		);
	};

	const deleteOption = (qid, idx) => {
		setQuestions((prev) =>
			prev.map((q) => {
				if (q.id !== qid) return q;
				const updatedQ = { ...q };
				["ru", "en", "kg"].forEach((l) => {
					const oldOpts = updatedQ[l]?.options || [];
					const newOptions = oldOpts.filter((_, i) => i !== idx);
					updatedQ[l] = {
						...updatedQ[l],
						options: newOptions.length ? newOptions : normalizeOptions([]),
					};
				});
				return updatedQ;
			})
		);
	};

	const uploadTest = async () => {
		try {
			const convertedQuestions = Object.fromEntries(
				["en", "ru", "kg"].map((l) => [
					l,
					questions.map((q) => q[l]).filter(Boolean),
				])
			);

			const isEdit = modeRef.current === "edit";
			const testId = testIdRef.current;
			const request = isEdit
				? api.patch(`/tests/${testId}`, { questions: convertedQuestions })
				: api.post(`/tests/${testId}`, { questions: convertedQuestions });

			await request
				.then((res) => {
					console.log("Test saved:", res);
					alert(isEdit ? "Test updated successfully" : "Test created successfully");
					deleteDraft(draftIdRef.current);
				})
				.catch((err) => {
					console.error(err);
					alert(err.message);
				});
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div>
			<header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-4">
				<div className="flex flex-col gap-2">
					<h1 className="text-[30px] font-[700]">
						{modeRef.current === "edit" ? "Edit Test" : "Create Test"}
					</h1>
					<input
						value={testTitle}
						onChange={(e) => setTestTitle(e.target.value)}
						placeholder="Test title"
						className="bg-gray-900 text-sm text-white px-3 py-2 rounded border border-gray-800 focus:border-purple-700 outline-none max-w-md"
					/>
				</div>

				<div className="flex items-center gap-3">
					<Dialog.Root open={openDrafts} onOpenChange={setOpenDrafts}>
						<Dialog.Trigger className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded hover:bg-gray-700">
							<List size={16} />
							<span className="text-sm">Drafts</span>
						</Dialog.Trigger>
						<Dialog.Content className="fixed right-6 top-16 w-96 bg-[#0b0b0b] border border-gray-800 p-4 rounded shadow-lg z-20">
							<div className="flex justify-between items-center mb-3">
								<h3 className="text-lg font-medium">Drafts</h3>
								<Button className="text-sm text-violet-400" onClick={persistDraft}>
									<Save size={14} /> Save
								</Button>
							</div>
							<div className="max-h-64 overflow-y-auto space-y-2">
								{listDrafts().length === 0 ? (
									<div className="text-sm text-gray-500">No drafts</div>
								) : (
									listDrafts().map((d) => (
										<div key={d.id} className="flex justify-between items-center p-2 bg-gray-900 rounded">
											<div>
												<div className="text-sm font-medium">
													{d.formData?.testTitle || d.testTitle || "Untitled"}
												</div>
												<div className="text-xs text-gray-500">
													{new Date(d.updatedAt || d.createdAt).toLocaleString()}
												</div>
											</div>
											<div className="flex gap-2">
												<Button className="px-3 py-2 bg-violet-600 rounded text-sm" onClick={() => loadDraft(d.id)}>
													Open
												</Button>
												<button className="px-2 py-2 bg-red-700 rounded text-sm flex" onClick={() => deleteDraft(d.id)}>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									))
								)}
							</div>
						</Dialog.Content>
					</Dialog.Root>

					<Button
						className="flex items-center gap-2 px-3 py-2 bg-green-600 rounded hover:bg-green-500"
						onClick={() => uploadTest()}
						disabled={isLoading}
					>
						<Save size={14} /> Upload
					</Button>
				</div>
			</header>

			<Tabs value={lang} onValueChange={setLang} className="w-full mb-5">
				<TabsList className="w-full flex justify-around">
					{["ru", "en", "kg"].map((l) => (
						<TabsTrigger
							key={l}
							value={l}
							className={`w-full text-[20px] font-[600] duration-200 ${
								lang === l ? "!bg-violet-800" : "hover:bg-violet-950"
							}`}
						>
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
				[&::-webkit-scrollbar-thumb]:bg-purple-800"
			>
				{isLoading && (
					<div className="text-sm text-gray-400 px-2">Loading test...</div>
				)}
				{questions.map((q) => (
					<Card key={q.id} className="border-2 border-gray-700 p-3 relative mb-2">
						<div className="flex justify-between items-center">
							<input
								name="text"
								value={q[lang].text}
								onChange={(e) => updateQuestion(q.id, e)}
								placeholder="Enter question text"
								className="!placeholder-gray-500 bg-gray-900 font-bold w-[100%] px-4 py-2
									border-2 border-gray-800 focus:border-purple-800 outline-none"
							/>
							<Button variant="destructive" size="sm" onClick={() => deleteQuestion(q.id)}>
								<SquareX size={32} color="red" strokeWidth={2} absoluteStrokeWidth className="!w-6 !h-6" />
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
											{opt.isCorrect ? (
												<CircleCheck size={32} color="lime" strokeWidth={2} absoluteStrokeWidth />
											) : (
												<CircleX size={32} color="gray" strokeWidth={2} absoluteStrokeWidth />
											)}
										</label>
										<input
											name="text"
											value={opt.text}
											onChange={(e) => updateOption(q.id, i, e)}
											placeholder={`Option ${i + 1}`}
											className="!placeholder-gray-500 bg-gray-900 w-[100%] px-4 py-2
												border-indigo border-2 border-gray-800 focus:border-purple-800 outline-none"
										/>
										<button onClick={() => deleteOption(q.id, i)}>
											<Trash2 size={16} color="red" />
										</button>
									</div>
								))}
								<Button
									size="sm"
									variant="secondary"
									onClick={() => addOption(q.id)}
									className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border-2 border-gray-700"
								>
									<CirclePlus className="!w-5 !h-5" /> Add option
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
					<Button onClick={addQuestion} className="flex items-center gap-2 px-3 py-2 bg-purple-600 rounded hover:bg-purple-500">
						<CirclePlus className="!w-5 !h-5" /> Add Question
					</Button>
				</div>
			</div>
		</div>
	);
};

export default TestEditor;
