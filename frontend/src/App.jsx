import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'

function App() {
    const [health, setHealth] = useState("Загрузка...");
    useEffect(() => {
        fetch('https://famcscoin-api.mybsu.online/api/health')
            .then(res => res.json())
            .then(data => setHealth(data.message))
            .catch(err => setHealth("Ошибка сети"));
    }, []);

    return (
        <div style={{
            backgroundColor: 'var(--tg-theme-bg-color)',
            color: 'var(--tg-theme-text-color)',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'sans-serif'
        }}>
            <h1>FAMCS Coin</h1>

            <div style={{ padding: '10px', backgroundColor: 'var(--tg-theme-secondary-bg-color)', borderRadius: '10px' }}>
                <h3>Привет, {WebApp.initDataUnsafe?.user?.first_name || 'Аноним'}!</h3>
                <p>Твой Telegram ID: {WebApp.initDataUnsafe?.user?.id}</p>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h3>Статус Go-сервера:</h3>
                <p>📡 {health}</p>
            </div>

            <button
                onClick={() => WebApp.showAlert("Это нативная кнопка Telegram!")}
                style={{
                    width: '100%',
                    padding: '15px',
                    marginTop: '20px',
                    backgroundColor: 'var(--tg-theme-button-color)',
                    color: 'var(--tg-theme-button-text-color)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                }}
            >
                Тест нативной шторки
            </button>
        </div>
    )
}

export default App