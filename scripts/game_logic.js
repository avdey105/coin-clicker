let tg = window.Telegram.WebApp;
let coins = 0;
let isAnimating = false;
let resetTimeout;
let clickCount = 0;
let resetTimer = null;

// Функция для обработки видео-интро
function handleIntroVideo() {
    return new Promise((resolve) => {
        const videoContainer = document.getElementById('intro-video-container');
        const video = document.getElementById('intro-video');
        const videoMask = document.querySelector('.video-mask');
        const gameContainer = document.getElementById('game-container');
        const startButton = document.getElementById('start-video');
        
        // Обработчик нажатия на кнопку
        startButton.addEventListener('click', () => {
            startButton.classList.add('expanding');
            
            setTimeout(() => {
                videoMask.classList.add('visible');
                video.muted = false;
                video.volume = 1;
                video.play().catch(error => {
                    console.error('Ошибка воспроизведения видео:', error);
                    video.muted = true;
                    video.play();
                });
            }, 300); // Время анимации расширения кнопки
        });

        // Когда видео закончится
        video.addEventListener('ended', () => {
            videoMask.classList.add('shrink');
            
            setTimeout(() => {
                videoContainer.style.display = 'none';
                gameContainer.style.display = 'flex';
                gameContainer.style.opacity = '1';
                resolve();
            }, 300);
        });

        // Обработка ошибок
        video.addEventListener('error', () => {
            videoContainer.style.display = 'none';
            gameContainer.style.display = 'flex';
            resolve();
        });
    });
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    // Сначала проигрываем интро
    await handleIntroVideo();

    // Загрузка сохраненного прогресса
    try {
        const userData = await tg.CloudStorage.getValue('userProgress');
        if (userData) {
            coins = parseInt(userData);
            updateCoinsDisplay();
        }
    } catch (error) {
        console.error('Ошибка при загрузке прогресса:', error);
    }

    // Скрыть загрузочный экран
    document.getElementById('loading-screen').style.display = 'none';
});

// Обработчик клика
document.getElementById('click-area').addEventListener('click', async () => {
    if (isAnimating) return;
    
    isAnimating = true;
    coins++;
    updateCoinsDisplay();
    
    // Анимация нажатия с уменьшенной длительностью
    const clickElement = document.getElementById('click-animation');
    clickElement.style.animation = 'tap-animation 0.05s steps(2)';
    
    // Проигрывание звука
    const sound = document.getElementById('tap-sound');
    sound.currentTime = 0;
    sound.play();
    
    // Сохранение прогресса
    try {
        await tg.CloudStorage.setValue('userProgress', coins.toString());
    } catch (error) {
        console.error('Ошибка при сохранении прогресса:', error);
    }
    
    setTimeout(() => {
        clickElement.style.animation = '';
        isAnimating = false;
    }, 100);

    // Обновляем счетчик кликов
    clickCount = Math.min(clickCount + 1, 50); // Максимум 50 кликов
    const maskOpacity = clickCount * 0.008; // 0-0.4 opacity (100-60% прозрачности)
    document.querySelector('.click-mask').style.opacity = maskOpacity;

    // Сбрасываем таймер при каждом клике
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
        clickCount = 0;
        document.querySelector('.click-mask').style.opacity = 0;
    }, 3000);
});

// Обновление отображения монет
function updateCoinsDisplay() {
    document.getElementById('coins-amount').textContent = coins;
}

// Обновляем стили анимации
const style = document.createElement('style');
style.textContent = `
@keyframes coin-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
`;
document.head.appendChild(style); 