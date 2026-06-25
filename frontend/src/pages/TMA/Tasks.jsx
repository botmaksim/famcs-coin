import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { TasksService } from "@/api/services/TasksService";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/Skeleton";
import { playFanfareSound } from "@/utils/audio";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";

const Tasks = () => {
  const { user, fetchProfile, soundEnabled } = useUser();
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: tasksData, isLoading: loadingTasks, error: tasksError } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await TasksService.getTasks();
      return res.data.tasks || [];
    },
  });

  const { data: configData } = useQuery({
    queryKey: ['webConfig'],
    queryFn: async () => {
      const res = await TasksService.getWebConfig();
      return res.data;
    },
    staleTime: 60 * 60 * 1000,
  });

  const baseReward = configData?.referral_reward || "50000";
  const tasks = tasksData || [];
  const loading = loadingTasks;
  const error = tasksError ? t('tasks.errorLoading') : null;

  const claimMutation = useMutation({
    mutationFn: (taskId) => TasksService.claimTask(taskId),
    onSuccess: (data, taskId) => {
      // Optimistically update tasks list
      queryClient.setQueryData(['tasks'], (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map((t) => (t.id === taskId ? { ...t, is_completed: true } : t));
      });
      fetchProfile(); // Update balance
    },
  });

  const handleClaim = async (task) => {
    if (task.is_completed) return;

    if (
      window.Telegram?.WebApp?.openTelegramLink &&
      task.link_url.includes("t.me")
    ) {
      window.Telegram.WebApp.openTelegramLink(task.link_url);
    } else {
      window.open(task.link_url, "_blank");
    }

    setTimeout(async () => {
      try {
        await claimMutation.mutateAsync(task.id);
        playFanfareSound(soundEnabled);
        toast.success(`Получено +${task.reward_coins.toLocaleString()} коинов`);
      } catch (err) {
        console.error("Claim error:", err);
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
      <h2 className="text-center mb-2.5 mt-0">{t('tasks.title')}</h2>
      <p className="text-center text-slate-600 dark:text-slate-400 mb-[30px] text-sm">
        {t('tasks.subtitle')}
      </p>

      {/* Referral Block */}
      <div className="bg-green-50 dark:bg-[rgba(34,197,94,0.1)] border border-green-200 dark:border-[rgba(34,197,94,0.3)] rounded-2xl p-5 mb-5 text-center shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
        <h3 className="m-0 mb-2.5 text-green-600 dark:text-green-400">{t('tasks.inviteFriend')}</h3>
        <p className="m-0 mb-4 text-sm text-slate-700 dark:text-slate-300">
          {t('tasks.inviteReward', { reward: Number(baseReward).toLocaleString() })}{" "}
          <img
            src="/icons/coin.png"
            alt="coin"
            className="inline-block w-4 h-4 ml-1 align-middle"
          />
        </p>
        <button
          onClick={handleCopyReferral}
          className={`w-full p-3 rounded-xl border-none font-bold text-[15px] cursor-pointer transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] ${copied ? "bg-green-500 dark:bg-green-400 text-white dark:text-slate-900" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          {copied ? t('tasks.copied') : t('tasks.copyLink')}
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
              className="bg-[var(--card-bg)] rounded-2xl p-5 border border-[var(--glass-border)] backdrop-blur-md shadow-[0_4px_6px_rgba(0,0,0,0.1)]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="m-0 mb-1.5 text-lg text-[var(--text-color)]">{task.title}</h3>
                  <p className="m-0 text-[13px] text-slate-600 dark:text-slate-400 leading-tight">
                    {task.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleClaim(task)}
                disabled={task.is_completed}
                className={`w-full p-3 rounded-xl border-none font-bold text-[15px] flex justify-center items-center gap-2 transition-all ${
                  task.is_completed
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-default hidden-shadow"
                    : "bg-blue-600 text-white cursor-pointer shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700"
                }`}
              >
                {task.is_completed ? (
                  t('tasks.completed')
                ) : (
                  <>
                    {t('tasks.claimReward', { reward: task.reward_coins.toLocaleString() })} <img src="/icons/coin.png" alt="coin" className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-slate-600 dark:text-slate-400">{t('tasks.emptyTasks')}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
