import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import apiClient from "../../api/client";
import { toast } from "react-hot-toast";
import { Skeleton } from "../../components/Skeleton";

const Tasks = () => {
  const { user, fetchProfile } = useUser();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [baseReward, setBaseReward] = useState("50000");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/tasks");
      setTasks(res.data.tasks || []);

      const confRes = await apiClient.get("/web/config");
      if (confRes.data && confRes.data.referral_reward) {
        setBaseReward(confRes.data.referral_reward);
      }
    } catch (err) {
      setError("Не удалось загрузить задания");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleClaim = async (task) => {
    if (task.is_completed) return;

    // Open Telegram link or normal link
    if (
      window.Telegram?.WebApp?.openTelegramLink &&
      task.link_url.includes("t.me")
    ) {
      window.Telegram.WebApp.openTelegramLink(task.link_url);
    } else {
      window.open(task.link_url, "_blank");
    }

    // Small delay to simulate user looking at the group before claiming
    setTimeout(async () => {
      try {
        await apiClient.post("/tasks/claim", { task_id: task.id });
        toast.success(`Получено +${task.reward_coins.toLocaleString()} коинов`);
        await fetchProfile(); // Update balance in context
        await fetchTasks(); // Update tasks list to show completed status
      } catch (err) {
        console.error("Claim error:", err);
        // Might fail if already completed via race condition
        const msg = err.response?.data || "Не удалось получить награду";
        if (err.response?.status !== 409) {
          toast.error(msg);
        }
      }
    }, 2000);
  };

  const handleCopyReferral = () => {
    const refLink = "https://t.me/famcs_coin_bot?startapp=ref_" + user?.tg_id;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 pb-[90px] font-sans">
      <h2 className="text-center mb-2.5 mt-0">Задания (Earn)</h2>
      <p className="text-center text-slate-600 mb-[30px] text-sm">
        Выполняй простые квесты и получай монеты!
      </p>

      {/* Referral Block */}
      <div className="bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded-2xl p-5 mb-5 text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <h3 className="m-0 mb-2.5 text-green-400">🎁 Пригласи друга</h3>
        <p className="m-0 mb-4 text-sm text-slate-700">
          Получи {Number(baseReward).toLocaleString()}{" "}
          <img
            src="/icons/coin.png"
            alt="coin"
            className="inline-block w-4 h-4 ml-1 align-middle"
          />{" "}
          за каждого друга!
        </p>
        <button
          onClick={handleCopyReferral}
          className={`w-full p-3 rounded-xl border-none font-bold text-[15px] cursor-pointer transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] ${copied ? "bg-green-400 text-slate-900" : "bg-blue-600 text-white"}`}
        >
          {copied ? "Скопировано! ✅" : "Скопировать ссылку"}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl w-full" />
          ))}
        </div>
      )}
      {error && <div className="text-center text-red-500">{error}</div>}

      {!loading && !error && (
        <div className="flex flex-col gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-[rgba(18,18,18,0.75)] rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] backdrop-blur-md shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="m-0 mb-1.5 text-lg">{task.title}</h3>
                  <p className="m-0 text-[13px] text-slate-600 leading-tight">
                    {task.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleClaim(task)}
                disabled={task.is_completed}
                className={`w-full p-3 rounded-xl border-none font-bold text-[15px] flex justify-center items-center gap-2 transition-all ${
                  task.is_completed
                    ? "bg-slate-100 text-slate-600 cursor-default hidden-shadow"
                    : "bg-blue-600 text-white cursor-pointer shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
                }`}
              >
                {task.is_completed
                  ? "Выполнено"
                  : `Выполнить (+${task.reward_coins.toLocaleString()}  <img src="/icons/coin.png" alt="coin" className="inline-block w-4 h-4 ml-1 align-middle" />)`}
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-slate-600">Заданий пока нет</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
