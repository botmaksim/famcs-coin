import { useState, useEffect } from "react";
import { AdminService } from "../../api/services/AdminService";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { AdminAnalytics } from "../../components/Web/AdminAnalytics";
import { AdminTasks } from "../../components/Web/AdminTasks";
import { AdminDAO } from "../../components/Web/AdminDAO";
import { AdminStaff } from "../../components/Web/AdminStaff";
import { AdminSettings } from "../../components/Web/AdminSettings";

const WebAdmin = () => {
  const { user, fetchProfile } = useUser();
  const navigate = useNavigate();

  const [authTgId, setAuthTgId] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Broadcast states
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [bonusTgId, setBonusTgId] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");

  const [resolveEventId, setResolveEventId] = useState("");
  const [resolveOption, setResolveOption] = useState("A");

  // Tasks states
  const [tasks, setTasks] = useState([]);

  // DAO Moderation states
  const [pendingProposals, setPendingProposals] = useState([]);

  // Ban states
  const [banTgId, setBanTgId] = useState("");
  const [banReason, setBanReason] = useState("");
  const [isBannedToggle, setIsBannedToggle] = useState(true);

  // Settings states
  const [settings, setSettings] = useState({});
  const [editingSetting, setEditingSetting] = useState(null);
  const [settingValue, setSettingValue] = useState("");

  // Check auth state on mount
  useEffect(() => {
    if (localStorage.getItem("web_admin_auth")) {
      setIsAuthenticated(true);
      fetchProfile();
      fetchTasks();
      fetchPendingDao();
      fetchSettings();
    }
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await AdminService.getSettings();
      if (res.data && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await AdminService.getTasks();
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchPendingDao = async () => {
    try {
      const res = await AdminService.getPendingProposals();
      setPendingProposals(res.data.proposals || []);
    } catch (err) {
      console.error("Failed to fetch pending DAO proposals", err);
    }
  };

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

  const handleBonusDrop = async (e) => {
    e.preventDefault();
    if (!bonusTgId || !bonusAmount) return;

    try {
      await AdminService.giveBonus(bonusTgId, bonusAmount);
      alert("Бонус успешно начислен!");
      setBonusTgId("");
      setBonusAmount("");
      fetchProfile();
    } catch (err) {
      alert(err.response?.data || "Ошибка при начислении бонуса");
    }
  };

  const handleResolveBet = async (e) => {
    e.preventDefault();
    if (!resolveEventId || !resolveOption) return;

    try {
      await AdminService.resolveBet(parseInt(resolveEventId), resolveOption);
      alert("Событие успешно завершено!");
      setResolveEventId("");
    } catch (err) {
      alert(err.response?.data || "Ошибка при завершении события");
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      // Mocked endpoint call
      await new Promise(r => setTimeout(r, 1000)); 
      alert("Рассылка успешно завершена!");
      setBroadcastMessage("");
    } catch (err) {
      alert("Ошибка при рассылке");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banTgId) return;

    try {
      await AdminService.banUser(banTgId, banReason, isBannedToggle);
      alert(`Пользователь успешно ${isBannedToggle ? "забанен" : "разбанен"}!`);
      setBanTgId("");
      setBanReason("");
    } catch (err) {
      alert(err.response?.data || "Ошибка при изменении статуса блокировки");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] p-5 font-sans">
        <h2 className="text-2xl font-bold mb-8">Вход в панель управления</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-[300px]">
          <input
            type="number"
            placeholder="Ваш TG ID"
            value={authTgId}
            onChange={(e) => setAuthTgId(e.target.value)}
            className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Мастер-пароль"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="p-3 rounded-lg border-none bg-[var(--accent-color)] text-black font-bold cursor-pointer shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:bg-[#b0f242] transition-colors"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  if (user && user.role !== "admin" && user.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-color)] text-red-500 p-5 text-center font-sans">
        <h2 className="text-2xl font-bold mb-2">Доступ запрещен</h2>
        <p className="mb-5">Ваша роль: {user.role}. Требуется admin или superadmin.</p>
        <button
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-lg bg-white/10 text-white border-none cursor-pointer hover:bg-white/20 transition-colors"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 font-sans max-w-[800px] mx-auto bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="m-0 flex items-center gap-2 text-2xl font-bold">
          <img src="/icons/crown.png" alt="crown" className="w-6 h-6" />
          Панель Управления
        </h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg bg-white/10 text-white border-none cursor-pointer hover:bg-white/20 transition-colors"
        >
          Выйти ({user?.username})
        </button>
      </div>

      {user?.role === "superadmin" && (
        <>
          <AdminAnalytics />

          <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
            <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">📢 Массовые рассылки</h3>
            <form onSubmit={handleBroadcast} className="flex flex-col gap-3">
              <textarea
                placeholder="Текст сообщения для рассылки всем пользователям..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
                className="p-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(128,128,128,0.1)] text-[var(--text-color)] resize-y outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isBroadcasting}
                className={`p-3 rounded-lg border-none font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all ${isBroadcasting ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 cursor-pointer hover:bg-blue-700'}`}
              >
                {isBroadcasting ? "Отправка..." : "Отправить рассылку"}
              </button>
            </form>
          </div>
        </>
      )}

      <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
        <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">🎁 Bonus Drop</h3>
        <form onSubmit={handleBonusDrop} className="flex flex-col gap-3">
          <input
            type="number"
            placeholder="TG ID студента"
            value={bonusTgId}
            onChange={(e) => setBonusTgId(e.target.value)}
            className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Сумма коинов"
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
            className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="p-3 rounded-lg border-none bg-[var(--accent-color)] text-black font-bold cursor-pointer hover:bg-[#b0f242] transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
          >
            Начислить
          </button>
        </form>
      </div>

      {(user?.role === "superadmin" || user?.permissions?.includes("manage_tasks")) && (
        <AdminTasks tasks={tasks} fetchTasks={fetchTasks} />
      )}

      {(user?.role === "superadmin" || user?.permissions?.includes("moderate_dao")) && (
        <AdminDAO pendingProposals={pendingProposals} fetchPendingDao={fetchPendingDao} />
      )}

      {(user?.role === "superadmin" || user?.permissions?.includes("ban_users")) && (
        <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
          <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">🚫 Модерация Пользователей</h3>
          <form onSubmit={handleBanUser} className="flex flex-col gap-3">
            <input
              type="number"
              placeholder="TG ID пользователя"
              value={banTgId}
              onChange={(e) => setBanTgId(e.target.value)}
              className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Причина (опционально, увидят при входе)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={isBannedToggle}
              onChange={(e) => setIsBannedToggle(e.target.value === "true")}
              className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 [&>option]:text-black"
            >
              <option value="true">Забанить 🚫</option>
              <option value="false">Разбанить 🟢</option>
            </select>
            <button
              type="submit"
              className={`p-3 rounded-lg border-none font-bold cursor-pointer transition-colors ${isBannedToggle ? 'bg-red-500/20 text-red-500 border border-red-500 hover:bg-red-500/30' : 'bg-[var(--accent-color)] text-black shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:bg-[#b0f242]'}`}
            >
              Применить статус
            </button>
          </form>
        </div>
      )}

      {user?.role === "superadmin" && (
        <>
          <AdminStaff />
          
          <div className="bg-[var(--card-bg)] p-5 rounded-xl mb-5 border border-[var(--glass-border)]">
            <h3 className="mt-0 text-[var(--text-color)] text-xl font-bold mb-4">🎲 Завершить Тотализатор</h3>
            <form onSubmit={handleResolveBet} className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Event ID"
                value={resolveEventId}
                onChange={(e) => setResolveEventId(e.target.value)}
                className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={resolveOption}
                onChange={(e) => setResolveOption(e.target.value)}
                className="p-3 rounded-lg border-none bg-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 [&>option]:text-black"
              >
                <option value="A">Исход A (Победа первого)</option>
                <option value="B">Исход B (Победа второго)</option>
                <option value="cancel">Отменить (Возврат пула)</option>
              </select>
              <button
                type="submit"
                className="p-3 rounded-lg border-none bg-[var(--accent-color)] text-black font-bold cursor-pointer hover:bg-[#b0f242] transition-colors shadow-[0_0_15px_rgba(163,230,53,0.3)]"
              >
                Завершить событие
              </button>
            </form>
          </div>

          <AdminSettings 
            settings={settings}
            editingSetting={editingSetting}
            setEditingSetting={setEditingSetting}
            settingValue={settingValue}
            setSettingValue={setSettingValue}
            fetchSettings={fetchSettings}
          />
        </>
      )}
    </div>
  );
};

export default WebAdmin;
