let tg = window.Telegram.WebApp;
let coins = 0;
let isAnimating = false;
let resetTimeout;
let clickCount = 0;
let resetTimer = null;
let currentAnimation = null;

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
    const clickElement = document.getElementById('click-animation');
    
    // Получаем текущие трансформации
    const computedStyle = window.getComputedStyle(clickElement);
    const currentTransform = computedStyle.transform;
    
    // Применяем поворот с сохранением текущего масштаба
    clickElement.style.transform = `${currentTransform} rotate(2deg)`;
    
    setTimeout(() => {
        // Возвращаем исходные трансформации
        const baseTranslate = window.innerWidth >= 1024 ? '-8%' : '-5%';
        const scale = window.innerWidth < 600 ? 'scale(1.3)' : 'scale(1)';
        clickElement.style.transform = `translateY(${baseTranslate}) ${scale}`;
        isAnimating = false;
    }, 50);
    
    coins++;
    updateCoinsDisplay();
    
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
    
    // Обновляем счетчик кликов
    clickCount = Math.min(clickCount + 1, 50);
    const maskOpacity = clickCount * 0.008;
    const maskElement = document.querySelector('.click-mask');
    maskElement.style.opacity = maskOpacity;
    
    // Отменяем предыдущие анимации и таймеры
    if (currentAnimation) {
        cancelAnimationFrame(currentAnimation);
        currentAnimation = null;
    }
    clearTimeout(resetTimer);
    
    // Запускаем новый таймер для начала исчезновения
    resetTimer = setTimeout(() => {
        const startTime = Date.now();
        const startOpacity = maskOpacity;
        
        const animateFade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / 2800, 1); // 2.8 секунды анимации
            const currentOpacity = startOpacity * (1 - progress);
            
            maskElement.style.opacity = currentOpacity;
            
            if (progress < 1) {
                currentAnimation = requestAnimationFrame(animateFade);
            } else {
                clickCount = 0;
                currentAnimation = null;
            }
        };
        
        currentAnimation = requestAnimationFrame(animateFade);
    }, 200); // Начинаем исчезать через 200 мс
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