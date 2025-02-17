let tg = window.Telegram.WebApp;
let coins = 0;
let isAnimating = false;
let redIntensity = 0;
let resetTimeout;

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
            // Анимируем кнопку
            startButton.classList.add('expanding');
            
            // После расширения кнопки показываем видео
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
            // Запускаем анимацию маски
            videoMask.classList.add('shrink');
            
            // Ждем окончания анимации маски
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
    
    // Увеличиваем красноту (максимум 50 кликов)
    redIntensity = Math.min(redIntensity + 1, 50);
    updateRedFilter();
    
    // Сбрасываем таймер сброса
    clearTimeout(resetTimeout);
    resetTimeout = setTimeout(resetRedFilter, 1000);
    
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
});

function updateRedFilter() {
    const intensity = redIntensity / 50;
    const overlay = document.querySelector('.red-overlay rect');
    overlay.setAttribute('fill', `rgba(255, 80, 80, ${intensity * 0.6})`);
}

function resetRedFilter() {
    const overlay = document.querySelector('.red-overlay rect');
    overlay.style.transition = 'fill 3s ease-out';
    redIntensity = 0;
    overlay.setAttribute('fill', 'rgba(255,0,0,0)');
    
    setTimeout(() => {
        overlay.style.transition = 'fill 0.3s ease';
    }, 3000);
}

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