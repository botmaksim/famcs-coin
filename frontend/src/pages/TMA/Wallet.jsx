import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';
import { Skeleton } from '../../components/Skeleton';

const Wallet = () => {
  const { user, loading: userLoading, fetchProfile } = useUser();
  const [walletInput, setWalletInput] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const smartContractAddress = import.meta.env.VITE_SMART_CONTRACT_ADDRESS || '0xComingSoon...';

  const fetchHistory = async () => {
    try {
      const res = await apiClient.get('/crypto/history');
      setHistory(res.data.history || []);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    if (user?.wallet_address) {
      fetchHistory();
    }
  }, [user]);

  const handleBindWallet = async (e) => {
    e.preventDefault();
    if (!walletInput) return;
    setLoading(true);
    try {
      await apiClient.post('/crypto/wallet', { wallet_address: walletInput });
      toast.success('Кошелек успешно привязан!');
      await fetchProfile(); // Update context to show bound wallet
    } catch (err) {
      toast.error(err.response?.data || 'Failed to bind wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || isNaN(withdrawAmount)) return;
    setLoading(true);
    try {
      await apiClient.post('/crypto/withdraw', { amount: parseInt(withdrawAmount) });
      toast.success('Запрос на вывод успешно создан!');
      setWithdrawAmount('');
      await fetchProfile();
      await fetchHistory();
    } catch (err) {
      toast.error(err.response?.data || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (userLoading) {
    return (
      <div className="p-5 font-sans">
        <h2 className="text-center mb-5 text-slate-800"><img src="/icons/wallet.png" alt="wallet" className="inline-block w-6 h-6 mr-2 align-middle" /> Кошелек</h2>
        <Skeleton className="w-full h-48 rounded-2xl mb-5" />
      </div>
    );
  }

  return (
    <div className="p-5 font-sans text-slate-800">
      <h2 className="text-center mb-5"><img src="/icons/wallet.png" alt="wallet" className="inline-block w-6 h-6 mr-2 align-middle" /> Кошелек</h2>

      {!user?.wallet_address ? (
        <div className="bg-[rgba(18,18,18,0.75)] p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_6px_rgba(0,0,0,0.1)]">
          <h3 className="mt-0 text-black">Привязка кошелька</h3>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            Для ввода и вывода средств необходимо привязать вашего крипто-кошелька (например, MetaMask или Tonkeeper).
          </p>
          <form onSubmit={handleBindWallet} className="flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Адрес кошелька (0x... или EQ...)"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="p-3 rounded-lg border border-slate-200 bg-slate-100 text-black outline-none focus:border-blue-600 focus:bg-[rgba(0,0,0,0.4)] transition-all"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`p-3 rounded-lg border-none font-bold transition-all ${loading ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]'}`}
            >
              {loading ? 'Привязка...' : 'Привязать кошелек'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="bg-[rgba(18,18,18,0.75)] p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_6px_rgba(0,0,0,0.1)] mb-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600">Ваш кошелек:</span>
              <strong className="bg-slate-50 px-2.5 py-1 rounded mx-0 font-mono text-sm text-black border border-[rgba(255,255,255,0.05)]">
                {shortenAddress(user.wallet_address)}
              </strong>
            </div>

            <div className="p-4 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-xl mb-4">
              <h4 className="m-0 mb-2.5 text-blue-400">Депозит</h4>
              <p className="text-[13px] m-0 mb-2 leading-relaxed text-slate-700">Для пополнения баланса отправьте токены на адрес нашего смарт-контракта:</p>
              <code className="block p-2 bg-[rgba(0,0,0,0.3)] rounded font-mono break-all text-[13px] border border-[rgba(255,255,255,0.05)] text-black shadow-inner">
                {smartContractAddress}
              </code>
            </div>

            <h4 className="m-0 mb-2.5 text-black">Вывод средств</h4>
            <form onSubmit={handleWithdraw} className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  placeholder="Сумма"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={user.balance}
                  className="flex-1 p-3 rounded-lg border border-slate-200 bg-slate-100 text-black outline-none focus:border-blue-600 transition-all font-mono"
                  required
                />
                <span className="text-[13px] text-slate-600 select-none">/ {Math.floor(user.balance)} доступно</span>
              </div>
              <button
                type="submit"
                disabled={loading || !withdrawAmount || withdrawAmount > user.balance}
                className={`p-3 rounded-lg border-none font-bold transition-all ${
                  (loading || withdrawAmount > user.balance) 
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed opacity-70 hidden-shadow' 
                  : 'bg-blue-600 text-white cursor-pointer shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-600 text-white'
                }`}
              >
                {loading ? 'Обработка...' : 'Вывести токены (Withdraw)'}
              </button>
            </form>
          </div>

          <div className="bg-[rgba(18,18,18,0.75)] p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] shadow-[0_4px_6px_rgba(0,0,0,0.1)] mb-20">
            <h3 className="mt-0 mb-4 text-black">История транзакций</h3>
            <div className="flex flex-col gap-2.5">
              {history.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-3 rounded-xl shadow-sm transition-colors hover:bg-white">
                  <div className="flex flex-col gap-1">
                    <span className={`font-bold text-[15px] ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {tx.type === 'deposit' ? '⬇️ Депозит' : '⬆️ Вывод'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(tx.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <strong className="text-black font-mono">{tx.amount} коинов</strong>
                    <span className={`text-xs ${tx.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {tx.status === 'pending' ? 'Ожидание ⏳' : 'Выполнено ✅'}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && <p className="text-center text-slate-500 text-sm py-4 m-0">История пуста</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;
