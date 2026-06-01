import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { useUser } from '../../context/UserContext';

const Wallet = () => {
  const { user, fetchProfile } = useUser();
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
      await fetchProfile(); // Update context to show bound wallet
    } catch (err) {
      alert(err.response?.data || 'Failed to bind wallet');
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
      alert('Запрос на вывод успешно создан!');
      setWithdrawAmount('');
      await fetchProfile();
      await fetchHistory();
    } catch (err) {
      alert(err.response?.data || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: 'var(--text-color)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>💳 Кошелек</h2>

      {!user?.wallet_address ? (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0 }}>Привязка кошелька</h3>
          <p style={{ fontSize: '0.9em', color: '#94a3b8', marginBottom: '15px' }}>
            Для ввода и вывода средств необходимо привязать ваш криптокошелек (например, MetaMask или Tonkeeper).
          </p>
          <form onSubmit={handleBindWallet} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Адрес кошелька (0x... или EQ...)"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none'
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px', borderRadius: '8px', border: 'none',
                backgroundColor: 'var(--accent-color)', color: '#fff',
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Привязка...' : 'Привязать кошелек'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <span style={{ color: '#94a3b8' }}>Ваш кошелек:</span>
              <strong style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '6px' }}>
                {shortenAddress(user.wallet_address)}
              </strong>
            </div>

            <div style={{ padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Депозит</h4>
              <p style={{ fontSize: '0.85em', margin: '0 0 5px 0' }}>Для пополнения баланса отправьте токены на адрес нашего смарт-контракта:</p>
              <code style={{ display: 'block', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.85em' }}>
                {smartContractAddress}
              </code>
            </div>

            <h4 style={{ margin: '0 0 10px 0' }}>Вывод средств</h4>
            <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  placeholder="Сумма"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={user.balance}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', outline: 'none'
                  }}
                  required
                />
                <span style={{ fontSize: '0.9em', color: '#94a3b8' }}>/ {Math.floor(user.balance)} доступно</span>
              </div>
              <button
                type="submit"
                disabled={loading || !withdrawAmount || withdrawAmount > user.balance}
                style={{
                  padding: '12px', borderRadius: '8px', border: 'none',
                  backgroundColor: '#f59e0b', color: '#fff',
                  fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: (loading || withdrawAmount > user.balance) ? 0.5 : 1
                }}
              >
                {loading ? 'Обработка...' : 'Вывести токены (Withdraw)'}
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>История транзакций</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((tx) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: tx.type === 'deposit' ? '#10b981' : '#f59e0b' }}>
                      {tx.type === 'deposit' ? '⬇️ Депозит' : '⬆️ Вывод'}
                    </span>
                    <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <strong>{tx.amount} коинов</strong>
                    <span style={{ fontSize: '0.8em', color: tx.status === 'completed' ? '#10b981' : '#94a3b8' }}>
                      {tx.status === 'pending' ? 'Ожидание ⏳' : 'Выполнено ✅'}
                    </span>
                  </div>
                </div>
              ))}
              {history.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9em' }}>История пуста</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wallet;
