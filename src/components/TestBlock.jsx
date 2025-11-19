import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, X } from "lucide-react";

const letters = ["A", "B", "C", "D", "E", "F"]; // fallback


const TestBlock = ({ test, lang }) => {
  if (!test) return null;

  const id = useRef(test._id);
	const { language } = lang || useLanguage();
  const qList = test.questions?.[language] || [];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const question = qList[current];

  if (!question) return null;

  const handleCheck = () => {
    if (selected == null) return;
    setChecked(true);
  };

  const next = () => {
    setSelected(null);
    setChecked(false);
    setCurrent((c) => c + 1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-8 rounded-3xl shadow-xl bg-white">
      <h1 className="text-3xl font-bold text-center text-purple-500 mb-2">Решить тест</h1>
      <p className="text-center text-gray-500 mb-10">Решите тест что бы укрепить свои знания</p>

      <div className="text-center text-2xl font-semibold mb-8">{question.text}</div>

      <div className="flex flex-col gap-3">
        {question.options.map((opt, i) => {
          const isCorrect = opt.correct === true;
          const isSelected = selected === i;

          let style = "";
          if (checked) {
            if (isSelected && isCorrect) style = "border-green-500 bg-green-50 text-green-600";
            else if (isSelected && !isCorrect) style = "border-red-500 bg-red-50 text-red-600";
            else if (isCorrect) style = "border-green-500 bg-green-50 text-green-600";
          }

          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 border rounded-2xl cursor-pointer transition ${style}`}
              onClick={() => !checked && setSelected(i)}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border font-semibold ${
                  isSelected ? "bg-gray-900 text-white" : "bg-white text-gray-600"
                }`}
              >
                {letters[i]}
              </div>
              <span className="text-lg">{opt.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center mt-10">
        <button className="text-gray-500">пропустить</button>

        {!checked && (
          <button
            onClick={handleCheck}
            className="px-8 py-3 bg-purple-500 text-white rounded-2xl shadow-md hover:bg-purple-600 transition"
          >
            Проверить
          </button>
        )}

        {checked && (
          <button
            onClick={next}
            className="px-8 py-3 bg-purple-500 text-white rounded-2xl shadow-md hover:bg-purple-600 transition"
          >
            Далее
          </button>
        )}
      </div>

      {checked && (
        <div className="absolute bottom-6 right-6 bg-white shadow-xl px-5 py-4 rounded-2xl border flex items-center gap-3">
          {question.options.some((o, i) => o.correct && i === selected) ? (
            <>
              <span className="text-green-600 font-semibold">Правильно!</span>
              <Check className="text-green-600" size={20} />
            </>
          ) : (
            <>
              <span className="text-red-600 font-semibold">Неправильно</span>
              <X className="text-red-600" size={20} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TestBlock;