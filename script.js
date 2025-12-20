// Main Game Controller
class BingoGame {
    constructor() {
        this.initTelegramWebApp();
        this.gameState = {
            players: new Map(),
            selectedCards: [],
            calledNumbers: [],
            gameActive: false,
            gameId: this.generateGameId(),
            timer: null,
            autoMode: true,
            isPaused: false
        };
        
        this.init();
    }
    
    initTelegramWebApp() {
        if (typeof Telegram !== 'undefined') {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            this.userData = Telegram.WebApp.initDataUnsafe?.user || {
                id: Math.floor(Math.random() * 1000000),
                first_name: 'Demo User',
                username: 'demo_user'
            };
            
            document.getElementById('userName').textContent = 
                this.userData.first_name || this.userData.username;
        } else {
            // Demo mode for testing
            this.userData = {
                id: 1,
                first_name: 'Demo User',
                username: 'demo_user'
            };
        }
    }
    
    generateGameId() {
        return '#BNG' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    init() {
        this.bindEvents();
        this.startWelcomeTimer();
        this.updatePrizePool();
    }
    
    bindEvents() {
        // Navigation
        document.getElementById('playButton')?.addEventListener('click', () => {
            this.navigateTo('card-select.html');
        });
        
        document.getElementById('backButton')?.addEventListener('click', () => {
            this.navigateTo('index.html');
        });
        
        document.getElementById('confirmSelection')?.addEventListener('click', () => {
            this.confirmCardSelection();
        });
        
        document.getElementById('startGame')?.addEventListener('click', () => {
            this.startGame();
        });
        
        // Card selection
        document.getElementById('cardSearch')?.addEventListener('input', (e) => {
            this.searchCard(e.target.value);
        });
        
        // Game controls
        document.getElementById('bingoBtn')?.addEventListener('click', () => {
            this.claimBingo();
        });
        
        document.getElementById('autoMode')?.addEventListener('change', (e) => {
            this.gameState.autoMode = e.target.checked;
        });
        
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('soundBtn')?.addEventListener('click', () => {
            this.toggleSound();
        });
        
        // Bingo modal
        document.getElementById('cancelBingo')?.addEventListener('click', () => {
            this.hideModal();
        });
        
        document.getElementById('confirmBingo')?.addEventListener('click', () => {
            this.verifyBingo();
        });
    }
    
    navigateTo(page) {
        // Add transition effect
        document.body.style.opacity = '0.8';
        setTimeout(() => {
            window.location.href = page;
        }, 300);
    }
    
    startWelcomeTimer() {
        let timeLeft = 120; // 2 minutes
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            document.getElementById('gameTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.navigateTo('card-select.html');
            }
            
            timeLeft--;
        }, 1000);
        
        this.gameState.timer = timer;
    }
    
    updatePrizePool() {
        // In real app, fetch from backend
        const playerCount = this.gameState.players.size || 0;
        const prize = (playerCount * 10) * 0.8; // 20% commission
        document.getElementById('prizePool').textContent = `${prize} Birr`;
        document.getElementById('playerCount').textContent = playerCount;
    }
    
    // Card Selection Logic
    generateCardGrid() {
        const grid = document.getElementById('cardsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= 500; i++) {
            const card = document.createElement('div');
            card.className = 'card-number';
            card.textContent = i;
            card.dataset.cardId = i;
            
            card.addEventListener('click', () => {
                this.toggleCardSelection(i, card);
            });
            
            grid.appendChild(card);
        }
        
        this.updateSelectedCards();
    }
    
    toggleCardSelection(cardId, element) {
        const index = this.gameState.selectedCards.indexOf(cardId);
        
        if (index > -1) {
            // Deselect
            this.gameState.selectedCards.splice(index, 1);
            element.classList.remove('selected');
        } else {
            // Select (max 2)
            if (this.gameState.selectedCards.length >= 2) {
                alert('Maximum 2 cards allowed per player');
                return;
            }
            
            // Check if card is already taken by another player
            if (this.isCardTaken(cardId)) {
                alert('This card is already taken by another player');
                return;
            }
            
            this.gameState.selectedCards.push(cardId);
            element.classList.add('selected');
        }
        
        this.updateSelectedCards();
    }
    
    isCardTaken(cardId) {
        // In real app, check with backend
        // For demo, simulate some taken cards
        const takenCards = [5, 10, 15, 20, 25]; // Demo taken cards
        return takenCards.includes(cardId);
    }
    
    updateSelectedCards() {
        const count = this.gameState.selectedCards.length;
        const cost = count * 10;
        
        document.getElementById('selectedCount').textContent = count;
        document.getElementById('cardsCost').textContent = `${cost} Birr`;
        document.getElementById('totalCost').textContent = `${cost} Birr`;
        
        const confirmBtn = document.getElementById('confirmSelection');
        confirmBtn.disabled = count === 0;
        
        // Update selected cards list
        const list = document.getElementById('selectedCardsList');
        if (list) {
            list.innerHTML = this.gameState.selectedCards
                .map(card => `<span class="selected-card-tag">Card ${card}</span>`)
                .join('');
        }
    }
    
    confirmCardSelection() {
        if (this.gameState.selectedCards.length === 0) {
            alert('Please select at least one card');
            return;
        }
        
        // In real app, send to backend
        const selection = {
            userId: this.userData.id,
            userName: this.userData.username || this.userData.first_name,
            cards: [...this.gameState.selectedCards],
            timestamp: Date.now()
        };
        
        // Store locally
        localStorage.setItem('bingo_selection', JSON.stringify(selection));
        
        // Update player count
        this.gameState.players.set(this.userData.id, selection);
        this.updatePrizePool();
        
        alert('Cards confirmed! Game will start when timer ends.');
    }
    
    startGame() {
        const selection = JSON.parse(localStorage.getItem('bingo_selection'));
        
        if (!selection || selection.cards.length === 0) {
            alert('Please select cards first');
            return;
        }
        
        // Generate bingo cards
        this.generatePlayerCards(selection.cards);
        
        // Start the game
        this.gameState.gameActive = true;
        this.navigateTo('caller.html');
        
        // Start number calling after a delay
        setTimeout(() => {
            this.startNumberCalling();
        }, 2000);
    }
    
    // Bingo Card Generation
    generatePlayerCards(cardIds) {
        const container = document.getElementById('playerCardsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        cardIds.forEach((cardId, index) => {
            const bingoCard = this.generateBingoCard(cardId);
            const cardElement = this.createCardElement(bingoCard, index + 1);
            container.appendChild(cardElement);
        });
        
        // Store for game logic
        this.gameState.playerCards = cardIds.map(id => ({
            cardId: id,
            numbers: this.generateBingoCard(id),
            marked: Array(25).fill(false)
        }));
    }
    
    generateBingoCard(cardId) {
        // Deterministic card generation based on cardId
        const numbers = [];
        const ranges = [
            { min: 1, max: 15 },   // B
            { min: 16, max: 30 },  // I
            { min: 31, max: 45 },  // N
            { min: 46, max: 60 },  // G
            { min: 61, max: 75 }   // O
        ];
        
        // Use cardId as seed for deterministic generation
        let seed = cardId;
        
        for (let col = 0; col < 5; col++) {
            const colNumbers = [];
            const range = ranges[col];
            
            // Generate 5 unique numbers for this column
            while (colNumbers.length < 5) {
                seed = (seed * 9301 + 49297) % 233280;
                const rand = seed / 233280;
                const num = Math.floor(range.min + rand * (range.max - range.min + 1));
                
                if (!colNumbers.includes(num)) {
                    colNumbers.push(num);
                }
            }
            
            // Sort and add to numbers array
            colNumbers.sort((a, b) => a - b);
            numbers.push(...colNumbers);
        }
        
        // Set middle cell as FREE
        numbers[12] = 'FREE';
        
        return numbers;
    }
    
    createCardElement(numbers, cardNumber) {
        const card = document.createElement('div');
        card.className = 'bingo-card';
        card.dataset.cardId = cardNumber;
        
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `
            <span>Card ${cardNumber}</span>
            <span class="card-status">Playing</span>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'bingo-grid';
        
        // Create cells
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.dataset.index = i;
            cell.dataset.number = numbers[i];
            
            if (i === 12) {
                cell.classList.add('free');
                cell.textContent = 'FREE';
            } else {
                cell.textContent = numbers[i];
            }
            
            // Add click handler for manual marking
            cell.addEventListener('click', () => {
                if (!this.gameState.autoMode && numbers[i] !== 'FREE') {
                    this.markNumber(numbers[i], i, cardNumber - 1);
                }
            });
            
            grid.appendChild(cell);
        }
        
        card.appendChild(header);
        card.appendChild(grid);
        
        return card;
    }
    
    // Game Logic
    startNumberCalling() {
        if (this.gameState.isPaused) return;
        
        const interval = setInterval(() => {
            if (!this.gameState.gameActive || this.gameState.isPaused) {
                clearInterval(interval);
                return;
            }
            
            this.callNextNumber();
            
            // Check for auto winners
            if (this.gameState.autoMode) {
                this.checkAutoWinners();
            }
            
        }, 5000); // 5 second interval
        
        this.gameState.callingInterval = interval;
    }
    
    callNextNumber() {
        // Generate random number 1-75 that hasn't been called
        let number;
        do {
            number = Math.floor(Math.random() * 75) + 1;
        } while (this.gameState.calledNumbers.includes(number));
        
        this.gameState.calledNumbers.push(number);
        
        // Update display
        this.updateNumberDisplay(number);
        
        // Mark on player cards if auto mode
        if (this.gameState.autoMode) {
            this.markNumberOnAllCards(number);
        }
        
        // Update called numbers board
        this.updateCalledNumbersBoard();
        
        // Play audio (you'll need to add audio files)
        this.playNumberCallAudio(number);
    }
    
    updateNumberDisplay(number) {
        const letter = this.getBingoLetter(number);
        
        document.getElementById('currentNumber').textContent = number;
        document.getElementById('numberLetter').textContent = letter;
        
        // Add to last numbers display
        const lastNumbers = document.getElementById('lastNumbers');
        if (lastNumbers) {
            const chip = document.createElement('div');
            chip.className = 'number-chip called';
            chip.textContent = number;
            lastNumbers.prepend(chip);
            
            // Keep only last 10 numbers
            while (lastNumbers.children.length > 10) {
                lastNumbers.removeChild(lastNumbers.lastChild);
            }
        }
        
        // Update stats
        document.getElementById('calledNumbers').textContent = 
            this.gameState.calledNumbers.length;
    }
    
    getBingoLetter(number) {
        if (number <= 15) return 'B';
        if (number <= 30) return 'I';
        if (number <= 45) return 'N';
        if (number <= 60) return 'G';
        return 'O';
    }
    
    markNumberOnAllCards(number) {
        this.gameState.playerCards?.forEach((card, cardIndex) => {
            const index = card.numbers.indexOf(number);
            if (index !== -1) {
                this.markNumber(number, index, cardIndex, true);
            }
        });
    }
    
    markNumber(number, cellIndex, cardIndex, auto = false) {
        if (!this.gameState.gameActive) return;
        
        // Only mark if number has been called (unless it's FREE)
        if (number !== 'FREE' && !this.gameState.calledNumbers.includes(number) && !auto) {
            alert('This number has not been called yet!');
            return;
        }
        
        // Update game state
        if (this.gameState.playerCards[cardIndex]) {
            this.gameState.playerCards[cardIndex].marked[cellIndex] = true;
        }
        
        // Update UI
        const cardElement = document.querySelector(`[data-card-id="${cardIndex + 1}"]`);
        if (cardElement) {
            const cell = cardElement.querySelector(`[data-index="${cellIndex}"]`);
            if (cell && !cell.classList.contains('free')) {
                cell.classList.add('marked');
            }
        }
        
        // Check for win
        if (this.checkCardForWin(cardIndex)) {
            if (this.gameState.autoMode) {
                this.declareWinner(cardIndex);
            }
        }
    }
    
    checkCardForWin(cardIndex) {
        const card = this.gameState.playerCards[cardIndex];
        if (!card) return false;
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            let complete = true;
            for (let col = 0; col < 5; col++) {
                const index = row * 5 + col;
                if (index !== 12 && !card.marked[index]) { // Center is always marked
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            let complete = true;
            for (let row = 0; row < 5; row++) {
                const index = row * 5 + col;
                if (index !== 12 && !card.marked[index]) {
                    complete = false;
                    break;
                }
            }
            if (complete) return true;
        }
        
        // Check diagonals
        let diagonal1 = true;
        let diagonal2 = true;
        for (let i = 0; i < 5; i++) {
            const index1 = i * 5 + i;
            const index2 = i * 5 + (4 - i);
            
            if (index1 !== 12 && !card.marked[index1]) diagonal1 = false;
            if (index2 !== 12 && !card.marked[index2]) diagonal2 = false;
        }
        
        return diagonal1 || diagonal2;
    }
    
    checkAutoWinners() {
        this.gameState.playerCards?.forEach((card, index) => {
            if (this.checkCardForWin(index)) {
                this.declareWinner(index);
            }
        });
    }
    
    claimBingo() {
        // Check if any card has a winning pattern
        let hasWin = false;
        let winningCardIndex = -1;
        
        this.gameState.playerCards?.forEach((card, index) => {
            if (this.checkCardForWin(index)) {
                hasWin = true;
                winningCardIndex = index;
            }
        });
        
        if (!hasWin) {
            alert('No winning pattern detected! Please check your card.');
            return;
        }
        
        // Show confirmation modal
        this.showModal();
    }
    
    showModal() {
        document.getElementById('bingoModal').style.display = 'flex';
    }
    
    hideModal() {
        document.getElementById('bingoModal').style.display = 'none';
    }
    
    verifyBingo() {
        this.hideModal();
        
        // Verify with server in real app
        // For demo, just declare winner
        this.declareWinner(0);
    }
    
    declareWinner(cardIndex) {
        this.gameState.gameActive = false;
        clearInterval(this.gameState.callingInterval);
        
        // Calculate prize
        const playerCount = this.gameState.players.size;
        const prize = (playerCount * 10) * 0.8;
        
        // Highlight winning cells
        this.highlightWinningCells(cardIndex);
        
        // Play winning sound
        this.playBingoAudio();
        
        // Show winner page after delay
        setTimeout(() => {
            this.showWinnerPage(prize);
        }, 2000);
    }
    
    highlightWinningCells(cardIndex) {
        const cardElement = document.querySelector(`[data-card-id="${cardIndex + 1}"]`);
        if (!cardElement) return;
        
        const cells = cardElement.querySelectorAll('.bingo-cell');
        cells.forEach(cell => {
            if (cell.classList.contains('marked') || cell.classList.contains('free')) {
                cell.classList.add('winning');
            }
        });
    }
    
    showWinnerPage(prize) {
        // Update winner info
        document.getElementById('winnerName').textContent = 
            this.userData.first_name || 'Winner';
        document.getElementById('winnerTelegram').textContent = 
            this.userData.username ? `@${this.userData.username}` : 'Telegram User';
        document.getElementById('winnerPrize').textContent = `${prize} Birr`;
        document.getElementById('totalPlayers').textContent = this.gameState.players.size;
        document.getElementById('totalCards').textContent = this.gameState.selectedCards.length;
        document.getElementById('totalCalls').textContent = this.gameState.calledNumbers.length;
        
        // Create confetti
        this.createConfetti();
        
        // Navigate to winner page
        this.navigateTo('winner.html');
        
        // Auto return to selection after 5 seconds
        setTimeout(() => {
            this.navigateTo('card-select.html');
        }, 5000);
    }
    
    createConfetti() {
        const container = document.getElementById('confettiContainer');
        if (!container) return;
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = [
                '#f72585', '#4361ee', '#4cc9f0', '#f8961e', '#43aa8b'
            ][Math.floor(Math.random() * 5)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            
            container.appendChild(confetti);
            
            // Animate
            const animation = confetti.animate([
                { top: '-10px', opacity: 1 },
                { top: '100vh', opacity: 0 }
            ], {
                duration: Math.random() * 3000 + 2000,
                easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
            });
            
            animation.onfinish = () => confetti.remove();
        }
    }
    
    updateCalledNumbersBoard() {
        this.gameState.calledNumbers.forEach(number => {
            const letter = this.getBingoLetter(number);
            const column = document.getElementById(`column${letter}`);
            if (column) {
                const numbersList = column.querySelector('.numbers-list');
                const chip = document.createElement('div');
                chip.className = 'number-chip called';
                chip.textContent = number;
                numbersList.appendChild(chip);
            }
        });
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        const btn = document.getElementById('pauseBtn');
        
        if (this.gameState.isPaused) {
            btn.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(this.gameState.callingInterval);
        } else {
            btn.innerHTML = '<i class="fas fa-pause"></i>';
            this.startNumberCalling();
        }
    }
    
    toggleSound() {
        const btn = document.getElementById('soundBtn');
        btn.classList.toggle('active');
    }
    
    playNumberCallAudio(number) {
        // You'll need to add your audio files
        const audio = document.getElementById('numberCallAudio');
        // audio.src = `audio/${number}.mp3`;
        // audio.play().catch(e => console.log('Audio error:', e));
    }
    
    playBingoAudio() {
        const audio = document.getElementById('bingoAudio');
        // audio.src = 'audio/bingo.mp3';
        // audio.play().catch(e => console.log('Audio error:', e));
    }
    
    searchCard(value) {
        if (!value || value < 1 || value > 500) return;
        
        const card = document.querySelector(`[data-card-id="${value}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.animation = 'pulse 1s';
            setTimeout(() => {
                card.style.animation = '';
            }, 1000);
        }
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bingoGame = new BingoGame();
    
    // Initialize specific page components
    if (window.location.pathname.includes('card-select.html')) {
        bingoGame.generateCardGrid();
        bingoGame.startSelectionTimer();
    } else if (window.location.pathname.includes('caller.html')) {
        bingoGame.initializeGamePage();
    } else if (window.location.pathname.includes('winner.html')) {
        bingoGame.startNextGameTimer();
    }
});