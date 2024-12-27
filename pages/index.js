import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    // 生成唯一的会话ID
    setSessionId(Date.now().toString());
  }, []);

  const criteria = [
    "文化传承价值(B₁)",
    "品质与标准(B₂)",
    "品牌发展(B₃)",
    "生态价值(B₄)",
    "产业发展(B₅)"
  ];

  const questions = generateQuestions();

  function generateQuestions() {
    const questions = [];
    for (let i = 0; i < criteria.length - 1; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        questions.push({
          id: `${i}-${j}`,
          factor1: criteria[i],
          factor2: criteria[j],
          index1: i,
          index2: j,
        });
      }
    }
    return questions;
  }

  async function handleAnswer(value) {
    const currentQ = questions[currentQuestion];
    try {
      // 保存答案到 Supabase
      await supabase.from('responses').insert([
        {
          session_id: sessionId,
          question_id: currentQ.id,
          value: parseFloat(value),
          factor1: currentQ.factor1,
          factor2: currentQ.factor2
        }
      ]);

      // 更新本地状态
      setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
      
      // 进入下一题
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        // 问卷完成
        alert('问卷已完成，感谢您的参与！');
      }
    } catch (err) {
      setError('保存答案时出错，请重试');
      console.error(err);
    }
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="w-full max-w-2xl p-4 mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2">问题 {currentQuestion + 1}/{questions.length}</h2>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <div className="flex items-center justify-between gap-2 mb-6 text-lg font-bold">
          <div className="flex-1 p-4 rounded text-center bg-blue-100">
            {currentQ.factor1}
          </div>
          <div className="flex-none">VS</div>
          <div className="flex-1 p-4 rounded text-center bg-yellow-100">
            {currentQ.factor2}
          </div>
        </div>

        <div className="space-y-6">
          <button
            onClick={() => handleAnswer("5")}
            className="w-full p-4 rounded text-center bg-blue-100 hover:bg-blue-200"
          >
            {currentQ.factor1}
          </button>

          <button
            onClick={() => handleAnswer("1")}
            className="w-full p-4 rounded text-center bg-gray-100 hover:bg-gray-200"
          >
            同等重要
          </button>

          <button
            onClick={() => handleAnswer("0.2")}
            className="w-full p-4 rounded text-center bg-yellow-100 hover:bg-yellow-200"
          >
            {currentQ.factor2}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between mb-1">
            <span>进度</span>
            <span>{((currentQuestion + 1) / questions.length * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="h-2.5 rounded-full transition-all duration-300 bg-blue-600"
              style={{width: `${((currentQuestion + 1) / questions.length * 100)}%`}}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
