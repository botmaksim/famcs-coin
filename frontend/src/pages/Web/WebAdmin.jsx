import { useState, useEffect } from "react";
import { AdminService } from "../../api/services/AdminService";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";

const WebAdmin = () => {
  const { user, fetchProfile } = useUser();
  const navigate = useNavigate();

  const [authTgId, setAuthTgId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [resolveEventId, setResolveEventId] = useState("");
  const [resolveOption, setResolveOption] = useState("0");

  // Check auth state on mount
  useEffect(() => {
    if (localStorage.getItem("web_admin_auth")) {
      setIsAuthenticated(true);
      fetchProfile();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authTgId || !authPassword) return;

    const authToken = `web:${authTgId}:${authPassword}`;
    localStorage.setItem("web_admin_auth", authToken);
    setIsAuthenticated(true);
    fetchProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem("web_admin_auth");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleResolveBet = async (e) => {
    e.preventDefault();
    if (!resolveEventId || resolveOption === "") return;

    try {
      await AdminService.closeBet(parseInt(resolveEventId), parseInt(resolveOption));
      alert("Событие успешно завершено!");
      setResolveEventId("");
    } catch (err) {
      alert(err.response?.data || "Ошибка при завершении события");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-5 font-sans">
        <h2 className="text-2xl font-bold mb-8">Вход в панель управления</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-[300px]">
          <input
            type="number"
            placeholder="Ваш TG ID"
            value={authTgId}
            onChange={(e) => setAuthTgId(e.target.value)}
            className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <button
            type="submit"
            className="p-3 rounded-lg border-none bg-orange-500 text-white font-bold cursor-pointer shadow-md hover:bg-orange-600 transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  if (user && user.role !== "admin" && user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-red-500 p-5 text-center font-sans">
        <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
        <p className="mb-5">Ваша роль: {user.role}. Требуется admin или superadmin.</p>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-300 transition-colors"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 font-sans max-w-[800px] mx-auto bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="m-0 flex items-center gap-2 text-2xl font-bold text-orange-500">
          
          Админ Панель
        </h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Выйти ({user?.username})
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl mb-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="mt-0 text-xl font-bold mb-4">Управление ставками</h3>
        <p className="text-sm text-slate-500 mb-4">Здесь можно завершить текущее событие и распределить выигрыши из пула.</p>
        <form onSubmit={handleResolveBet} className="flex flex-col gap-3">
          <input
            type="number"
            placeholder="ID События (Event ID)"
            value={resolveEventId}
            onChange={(e) => setResolveEventId(e.target.value)}
            className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <select
            value={resolveOption}
            onChange={(e) => setResolveOption(e.target.value)}
            className="p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="0">Вариант 1 (Победа первого исхода)</option>
            <option value="1">Вариант 2 (Победа второго исхода)</option>
          </select>
          <button
            type="submit"
            className="p-3 rounded-lg border-none bg-orange-500 text-white font-bold cursor-pointer hover:bg-orange-600 transition-colors shadow-md"
          >
            Завершить событие
          </button>
        </form>
      </div>
      
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl mb-5 shadow-sm border border-slate-100 dark:border-slate-700">
        <h3 className="mt-0 text-xl font-bold mb-4">Отзывы и Магазин</h3>
        <p className="text-sm text-slate-500">Управление отзывами и редактирование ценников магазина пока доступно только через прямое подключение к базе данных.</p>
      </div>

    </div>
  );
};

export default WebAdmin;
