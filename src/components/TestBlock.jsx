import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
// import { Toaster } from "@/components/ui/toaster";
// import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X } from "lucide-react";

const letters = ["A", "B", "C", "D", "E", "F"]; // fallback


const TestBlock = ({ test, lang }) => {
  if (!test) return null;

  const id = useRef(test._id);
	const { language } = lang || useLanguage();
  // const { toast } = useToast()
  
  const qList = test.questions[language] || [];
  const [state, setState] = useState("questions");

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [results, setResults] = useState([]);
  const question = qList[current];

  if (!question) return null;

  

  const handleCheck = () => {
    if (selected === null) return;

    setResults(prev => [...prev, selected]);

    setChecked(true);
  };

  const resetQuestion = () => {
    setSelected(null);
    setChecked(false);
    setShowDesc(false);
  };

  const resetTest = () => {
    setState("questions");
    setCurrent(0);
    resetQuestion();
    setResults([]);
  }

  // const prev = () => {
  //   if(current === 0) return
  //   resetQuestion()
  //   setCurrent((c) => c - 1);
  // };

  const next = () => {
    resetQuestion() // for final result
    if(current === qList.length-1) setState("results")
      else setCurrent((c) => c + 1);
  };
  
  const skip = () => {
    setResults(prev => [...prev, null])
    next()
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl shadow-lg bg-white border border-gray-100">
      {state === "questions" && <>
        <h1 className="text-3xl font-bold text-center text-purple-500 mb-2">Решить тест</h1>
        <p className="text-center text-gray-500 mb-2">Решите тест что бы укрепить свои знания</p>
        {/* Progress bar */}
        <div className="w-full sm:w-2/3 h-3 bg-gray-100 rounded-full mb-6 mx-auto overflow-hidden shadow-inner">
          <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${((current + (checked ? 1 : 0)) / qList.length) * 100}%` }}></div>
        </div>
      </>}

      

      {state === "questions" && (
      <>
        <div className="text-center text-2xl font-semibold mb-6 leading-snug text-gray-900">
          {current+1}. {question.text}
        </div>
        <div className="flex flex-col gap-3">

        
        {question.options.map((opt, i) => {
          const isCorrect = opt.isCorrect;
          const isSelected = selected === i;

          let style = "";
          if (checked) {
            if (isSelected && !isCorrect) style = "border-red-500 bg-red-50 text-red-600";
            else if (isCorrect) style = "border-green-500 bg-green-50 text-green-600";
          }

          return (
            <div
              key={i}
              className={`
                flex items-center gap-4 p-4 rounded-2xl cursor-pointer border transition-all 
                hover:bg-gray-50 active:scale-[0.99]
                ${style}
              `}
              onClick={() => !checked && setSelected(i)}
            >
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border font-semibold text-sm
                  ${isSelected ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600"}
                `}
              >
                {letters[i]}
              </div>
              <span className="text-lg">{opt.text}</span>
            </div>
          );
          })}
          {/* description */}
          {checked && (
            <div>
              <button 
                onClick={() => setShowDesc(prev => !prev)} 
                className={`w-full mt-4 px-4 py-3 rounded-2xl font-medium transition-all
                  border border-purple-500 
                  ${showDesc ? "bg-purple-600 text-white hover:bg-purple-700" : "text-purple-600 hover:bg-purple-100"}
                `}
              >
                {showDesc ? "Скрыть ответ" : "Показать ответ"}
              </button>
              {showDesc && (
                <div className="mt-4 p-5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 leading-relaxed shadow-sm">
                  {question.desc}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center mt-10">
          {/* Skip button */}
          {!checked ? (
            <button 
              onClick={skip} 
              className="w-[150px] text-gray-500"
            >
              пропустить
            </button>
          ) : <div className="w-[150px]"></div>}
          

          {/* Finish / Next / Check button */}
          <button
            onClick={checked ? next : handleCheck}
            className="w-[150px] px-8 py-3 bg-purple-600 text-white rounded-2xl shadow-md 
              hover:bg-purple-700 active:scale-[0.98] transition-all"
          >
            {checked ? qList.length === current + 1 ? "Завершить" : "Следующий" : "Проверить"}
          </button>
          
        </div>
      </>)}
      
      {state === "results" && (
        <Card className="px-4 sm:px-8 py-6 rounded-3xl w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-purple-500">
              Результаты
            </CardTitle>
            <div className="text-center text-xl font-semibold">
              {
                results.filter(
                  (r, i) => r !== null && qList[i].options[r]?.isCorrect
                ).length
              } из {qList.length} правильных
            </div>
            {/* result bar */}
            <div className="w-full sm:w-2/3 h-3 bg-gray-200 rounded-full mb-6 mx-auto overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(results.filter(r => !r && r !== null).length / qList.length) * 100}%` }}></div>
            </div>
          </CardHeader>

          <CardContent className="px-0 my-4">
            <div className="flex flex-col gap-5 mb-5">
              {qList.map((q, i) => {
                const user = results[i];
                // const correctIndex = q.options.findIndex(o => o.isCorrect);

                return (
                  <Card key={i} className="p-4 sm:p-5 rounded-2xl border shadow-sm">
                    <div className="font-semibold text-lg mb-3">{q.text}</div>
                    {/* skipped */}
                    {user === null && (
                      <div className="text-gray-500">
                        Вы пропустили этот вопрос
                      </div>
                    )}
                    <div className="space-y-2">
                      {q.options.map((opt, j) => {
                        const chosen = user === j;
                        const correct = opt.isCorrect;

                        return (
                          <div
                            key={j}
                            className={`p-3 rounded-xl border flex justify-between items-center text-sm sm:text-base
                              ${chosen && !correct ? "bg-red-50 border-red-400" : ""}
                              ${correct ? "bg-green-50 border-green-400" : ""}
                            `}
                          >
                            <span>{opt.text}</span>
                          </div>
                        );
                      })}
                      <br />
                      {/* description */}
                      {q.desc && (
                        <div className="mt-4 text-gray-500">
                          {q.desc}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
            {/* reset whole test button */}
            <button
              onClick={resetTest}
              className="w-full py-3 bg-purple-600 text-white rounded-2xl shadow-md hover:bg-purple-700 transition text-lg"
            >
              Повторить
            </button>
          </CardContent>
        </Card>

      )}  

        {/* Nitification about user answer */}
      {/* {checked && (
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
      )} */}
    </div>
  );
}

export default TestBlock;