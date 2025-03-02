const isWebView = window.Telegram && window.Telegram.WebApp;
const platform = isWebView ? window.Telegram.WebApp.platform : 'web';

// Добавьте определение платформы
document.body.setAttribute('data-platform', platform);

// В начале файла, где объявлены другие константы
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// Добавляем класс к body в зависимости от платформы
document.body.classList.add(isIOS ? 'ios' : 'other-platform');

let tg = window.Telegram.WebApp;
let coins = 0;
let isAnimating = false;
let resetTimeout;
let clickCount = 0;
let resetTimer = null;
let currentAnimation = null;
let currentSection = 'clicker';
let timerSeconds = 0; // Общее время в секундах
let totalCoins = 0;   // Общее количество монет
let nextFartClick = Math.floor(Math.random() * 66);

// Функция для обработки видео-интро
function handleIntroVideo() {
    return new Promise((resolve) => {
        const videoContainer = document.getElementById('intro-video-container');
        const video = document.getElementById('intro-video');
        const videoMask = document.querySelector('.video-mask');
        const gameContainer = document.getElementById('game-container');
        const startButton = document.getElementById('start-video');
        const skipButton = document.getElementById('skip-intro');
        const bottomContainer = document.querySelector('.intro-bottom-container');
        
        // Функция для завершения интро
        const finishIntro = () => {
            videoMask.classList.add('shrink');
            bottomContainer.classList.remove('visible');
            
            setTimeout(() => {
                videoContainer.style.display = 'none';
                gameContainer.style.display = 'flex';
                gameContainer.style.opacity = '1';
                resolve();
            }, 300);
        };
        
        // Обработчик нажатия на кнопку старта
        startButton.addEventListener('click', () => {
            startButton.classList.add('expanding');
            
            setTimeout(() => {
                videoMask.classList.add('visible');
                bottomContainer.classList.add('visible'); // Показываем нижнюю кнопку
                video.muted = false;
                video.volume = 1;
                video.play().catch(error => {
                    console.error('Ошибка воспроизведения видео:', error);
                    video.muted = true;
                    video.play();
                });
            }, 300);
        });

        // Обработчик нажатия на нижнее изображение
        skipButton.addEventListener('click', () => {
            video.pause();
            finishIntro();
        });

        // Когда видео закончится
        video.addEventListener('ended', finishIntro);

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
    // Инициализация Telegram WebApp
    if (window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand(); // Расширяем на весь экран
        
        // Устанавливаем правильную тему
        document.body.classList.add(window.Telegram.WebApp.colorScheme);
    }
    
    // Проверяем и устанавливаем начальное отображение секций
    const gameContainer = document.getElementById('game-container');
    const calendarSection = document.getElementById('calendar-section');
    const leaderboardSection = document.getElementById('leaderboard-section');
    
    // Убедимся, что только секция кликера отображается при загрузке
    gameContainer.style.display = 'flex';
    gameContainer.style.opacity = '0'; // Начально прозрачный до окончания видео
    
    calendarSection.style.display = 'none';
    calendarSection.style.opacity = '0';
    
    leaderboardSection.style.display = 'none';
    leaderboardSection.style.opacity = '0';
    
    // Сначала проигрываем интро
    await handleIntroVideo();

    // После интро показываем секцию кликера
    gameContainer.style.opacity = '1';

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

    // Скрыть загрузочный экран если он существует
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    const firstBtn = document.querySelector('.nav-btn.active');
    updateNavBackground(firstBtn);

    // Инициализация позиции подложки
    const initialActiveBtn = document.querySelector('.nav-btn.active');
    updateNavBackground(initialActiveBtn);

    // Инициализация значений по умолчанию
    updateTimerDisplay();
    updateTotalCoinsDisplay();
});

// Обработчик клика
document.getElementById('click-area').addEventListener('click', async () => {
    if (isAnimating) return;
    
    isAnimating = true;
    const clickElement = document.getElementById('click-animation');
    
    // Явно задаем начальные трансформации
    const baseTranslate = '-15%';
    const scale = window.innerWidth < 600 ? 'scale(1.3)' : 'scale(1)';
    clickElement.style.transform = `translateY(${baseTranslate}) ${scale}`;
    
    // Получаем текущие трансформации после инициализации
    const computedStyle = window.getComputedStyle(clickElement);
    const currentTransform = computedStyle.transform;
    
    // Применяем поворот
    clickElement.style.transform = `${currentTransform} rotate(2deg)`;
    
    setTimeout(() => {
        // Возвращаем к исходным значениям
        clickElement.style.transform = `translateY(${baseTranslate}) ${scale}`;
        isAnimating = false;
    }, 50);
    
    coins++;
    updateCoinsDisplay();
    
    // Проверяем, является ли текущий клик моментом для звука пердежа
    if (coins === nextFartClick) {
        // Проигрываем звук пердежа
        const fartSound = document.getElementById('fart-sound');
        fartSound.currentTime = 0;
        fartSound.play();
        
        // Устанавливаем следующий случайный момент для звука пердежа
        nextFartClick = coins + Math.floor(Math.random() * 66);
    } else {
        // Проигрывание обычного звука клика
        const sound = document.getElementById('tap-sound');
        sound.currentTime = 0;
        sound.play();
    }
    
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

// Добавляем обработчики
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const section = this.dataset.section;
        if (section === currentSection) return;
        
        // Убираем активный класс у всех кнопок
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Управление отображением секций
        const gameContainer = document.getElementById('game-container');
        const calendarSection = document.getElementById('calendar-section');
        const leaderboardSection = document.getElementById('leaderboard-section');
        
        // Функция для плавного перехода
        const fadeSection = (from, to) => {
            // Проверяем, происходит ли переход между кликером и календарем
            const isBackgroundTransition = 
                (currentSection === 'clicker' && section === 'calendar') ||
                (currentSection === 'calendar' && section === 'clicker');

            const ANIMATION_DURATION = 150;

            // Сначала скрываем текущую секцию
            if (isBackgroundTransition) {
                // Плавно скрываем только содержимое
                const fromContent = Array.from(from.children);
                fromContent.forEach(el => {
                    el.style.transition = `opacity ${ANIMATION_DURATION}ms ease-out`;
                    el.style.opacity = '0';
                });
            } else {
                from.style.opacity = '0';
            }

            // Переключаем отображение через таймаут
            setTimeout(() => {
                from.style.display = 'none';
                to.style.display = 'flex';
                
                // Форсируем перерисовку
                void to.offsetWidth;

                if (isBackgroundTransition) {
                    to.style.opacity = '1';
                    // Показываем содержимое новой секции
                    const toContent = Array.from(to.children);
                    toContent.forEach(el => {
                        el.style.transition = `opacity ${ANIMATION_DURATION}ms ease-in`;
                        el.style.opacity = '1';
                    });
                } else {
                    // Показываем новую секцию целиком
                    to.style.opacity = '1';
                    // Убеждаемся, что все дочерние элементы видимы
                    Array.from(to.children).forEach(el => {
                        el.style.opacity = '1';
                    });
                }
            }, ANIMATION_DURATION);
        };
        
        // Определяем текущую и целевую секции
        const currentElement = 
            currentSection === 'clicker' ? gameContainer :
            currentSection === 'calendar' ? calendarSection :
            leaderboardSection;
            
        const targetElement = 
            section === 'clicker' ? gameContainer :
            section === 'calendar' ? calendarSection :
            leaderboardSection;
        
        // Выполняем переход
        fadeSection(currentElement, targetElement);
        
        currentSection = section;
        updateNavBackground(this);
        
        // Обновляем данные при переходе на календарь
        if(section === 'calendar') {
            updateTimerDisplay();
            updateTotalCoinsDisplay();
        }
        
        // Загружаем данные лидерборда при переходе на соответствующую секцию
        if(section === 'leaderboard') {
            loadLeaderboard();
        }
    });
});

function updateNavBackground(activeBtn) {
    const nav = document.querySelector('.bottom-nav');
    const bg = document.querySelector('.nav-bg');
    const activeIndex = Array.from(nav.querySelectorAll('.nav-btn')).indexOf(activeBtn);
    
    // Новые позиции в процентах
    const positions = {
        0: 2.5,   // Первая кнопка
        1: 35,    // Вторая кнопка
        2: 67.5   // Третья кнопка
    };
    
    // Устанавливаем новую позицию
    bg.style.left = `${positions[activeIndex]}%`;
    
    // Добавляем небольшую задержку для плавности анимации
    requestAnimationFrame(() => {
        bg.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
}

// Функция для обновления таймера
function updateTimerDisplay() {
    const days = Math.floor(timerSeconds / 86400);
    const hours = Math.floor((timerSeconds % 86400) / 3600);
    const minutes = Math.floor((timerSeconds % 3600) / 60);
    const seconds = timerSeconds % 60;
    
    const timerElement = document.getElementById('calendar-timer');
    if(timerElement) {
        timerElement.textContent = 
            `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// Функция для обновления общего количества монет
function updateTotalCoinsDisplay() {
    const coinsElement = document.getElementById('total-coins');
    if(coinsElement) {
        coinsElement.textContent = totalCoins;
    }
}

// Функция для форматирования больших чисел (K для тысяч, M для миллионов)
function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
}

// Функция загрузки и отображения лидерборда
function loadLeaderboard() {
    const topPlayersList = document.getElementById('top-players');
    if (!topPlayersList) return;
    
    // Очистка текущего содержимого
    topPlayersList.innerHTML = '';
    
    // Пробуем получить данные (в реальности будет запрос к серверу)
    // Для демонстрации используем тестовые данные
    let topPlayers = [];
    
    try {
        // В будущем здесь будет запрос к серверу
        // Сейчас просто используем моковые данные
        topPlayers = [
            {
                "position": 1,
                "username": "Авдей",
                "coins": 1000000,
                "photo_url": "assets/images/winner1.png"
            }
        ];
    } catch (error) {
        console.error('Ошибка при загрузке данных лидерборда:', error);
    }
    
    // Если данных нет, показываем дефолтного победителя
    if (topPlayers.length === 0) {
        topPlayers = [
            {
                "position": 1,
                "username": "Авдей",
                "coins": 1000000,
                "photo_url": "assets/images/winner1.png"
            }
        ];
    }
    
    // Создаем элементы списка для каждого игрока
    topPlayers.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.className = 'player-item';
        
        // Определяем, какое изображение использовать
        let photoUrl = player.photo_url;
        if (!photoUrl) {
            if (player.position === 1) {
                photoUrl = "assets/images/winner1.png";
            } else if (player.position <= 10) {
                photoUrl = "assets/images/top10.png";
            } else if (player.position <= 30) {
                photoUrl = "assets/images/top30.png";
            } else if (player.position <= 100) {
                photoUrl = "assets/images/top100.png";
            } else {
                photoUrl = "assets/images/default-player.png";
            }
        }
        
        // Форматируем количество монет
        const formattedCoins = formatNumber(player.coins);
        
        // Создаем HTML для элемента списка
        playerItem.innerHTML = `
            <div class="player-position">${player.position}</div>
            <div class="player-avatar">
                <img src="${photoUrl}" alt="${player.username}">
            </div>
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-coins">${formattedCoins}</div>
            </div>
        `;
        
        topPlayersList.appendChild(playerItem);
    });
}

