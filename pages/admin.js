import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Admin() {
  const [responses, setResponses] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses();
    }
  }, [isAuthenticated]);

  async function fetchResponses() {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('获取数据失败');
      console.error(error);
      return;
    }

    setResponses(data);
  }

  function handleLogin(e) {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('密码错误');
    }
  }

  function calculateWeights(sessionResponses) {
    const matrix = Array(5).fill().map(() => Array(5).fill(1));
    sessionResponses.forEach(response => {
      const [i, j] = response.question_id.split('-').map(Number);
      matrix[i][j] = response.value;
      matrix[j][i] = 1 / response.value;
    });

    // 简单的权重计算（几何平均法）
    const weights = matrix.map(row => 
      Math.pow(row.reduce((a, b) => a * b, 1), 1/5)
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    return weights.map(w => (w/sum).toFixed(4));
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl mb-4">管理员登录</h2>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="w-full p-2 border rounded mb-4"
          />
          <button 
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            登录
          </button>
        </form>
      </div>
    );
  }

  // 按会话ID分组响应数据
  const sessionGroups = responses.reduce((groups, response) => {
    const { session_id } = response;
    if (!groups[session_id]) {
      groups[session_id] = [];
    }
    groups[session_id].push(response);
    return groups;
  }, {});

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">问卷数据分析</h1>
      
      <div className="grid gap-4">
        {Object.entries(sessionGroups).map(([sessionId, sessionResponses]) => {
          const weights = calculateWeights(sessionResponses);
          return (
            <div key={sessionId} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-bold mb-2">会话ID: {sessionId}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">原始答案:</h4>
                  <ul className="space-y-1">
                    {sessionResponses.map(response => (
                      <li key={response.id}>
                        {response.factor1} vs {response.factor2}: {response.value}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">计算权重:</h4>
                  <ul className="space-y-1">
                    {weights.map((weight, index) => (
                      <li key={index}>
                        {["文化传承价值", "品质与标准", "品牌发展", "生态价值", "产业发展"][index]}: 
                        {weight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
