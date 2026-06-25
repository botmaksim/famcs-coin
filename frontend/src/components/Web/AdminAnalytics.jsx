import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const mockDauData = [
  { name: 'Пн', dau: 120 },
  { name: 'Вт', dau: 132 },
  { name: 'Ср', dau: 101 },
  { name: 'Чт', dau: 143 },
  { name: 'Пт', dau: 190 },
  { name: 'Сб', dau: 230 },
  { name: 'Вс', dau: 250 },
];

const mockEmissionData = [
  { name: 'Нед 1', coins: 1000000 },
  { name: 'Нед 2', coins: 1200000 },
  { name: 'Нед 3', coins: 1500000 },
  { name: 'Нед 4', coins: 2100000 },
];

const mockWealthData = [
  { name: 'Квадральфы (>1M)', value: 10 },
  { name: 'Богачи (>100k)', value: 30 },
  { name: 'Средний класс', value: 45 },
  { name: 'Новички', value: 15 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const AdminAnalytics = () => {
  return (
    <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
      <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-5">📈 Аналитика</h3>
      <div className="flex flex-col gap-8">
        <div>
          <h4 className="mb-3 text-[var(--text-color)] opacity-80 font-semibold">Daily Active Users (DAU)</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDauData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="name" stroke="var(--text-color)" fontSize={12} />
                <YAxis stroke="var(--text-color)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }} />
                <Line type="monotone" dataKey="dau" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="mb-3 text-[var(--text-color)] opacity-80 font-semibold">Рост Эмиссии Монет</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockEmissionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="name" stroke="var(--text-color)" fontSize={12} />
                <YAxis stroke="var(--text-color)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }} />
                <Bar dataKey="coins" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h4 className="mb-3 text-[var(--text-color)] opacity-80 font-semibold">Распределение богатства</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockWealthData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({name})=>name}>
                  {mockWealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--glass-border)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
