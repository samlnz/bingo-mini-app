class BingoGame {
    constructor() {
        this.calledNumbers = new Set();
        this.currentNumber = null;
        this.gameInterval = null;
        this.isPaused = false;
        this.isMuted = false;
        this.callSpeed = 5000; // 5 seconds
        this.playerCards = [];
        this.currentCardIndex = 0;
        this.winners = [];
        this.autoBingo = true;
        
        this.bingoLetters = ['B', 'I', 'N', 'G', 'O'];
        this.numberRanges = {
            'B': [1, 15],
            'I': [16, 30],
            'N': [31, 45],
            'G': [46, 60],
            'O': [61, 75]
        };
    }
    
    init() {
        this.loadGameData();
        this.setupEventListeners();
        this.startNumberCaller();
        this.updateGameStats();
        this.generatePlayerCards();
    }
    
    loadGameData() {
        // Load selected cards
        const selectedCards = JSON.parse(localStorage.getItem('selectedCards') || '[]');
        const stake = localStorage.getItem('gameStake') || '10';
        const gameId = localStorage.getItem('currentGameId') || 'BB' + Math.random().toString(36).substr(2, 6).toUpperCase();
        
        // Set UI values
        document.getElementById('gameId').textContent = gameId;
        document.getElementById('gameBet').textContent = stake;
        
        // Calculate pool (players * bet)
        const players = Math.floor(Math.random() * 200) + 100; // Random players 100-300
        const pool = players * parseInt(stake);
        
        document.getElementById('playersCount').textContent = players;
        document.getElementById('gamePool').textContent = pool;
        
        // Generate cards for player
        this.generateCardsForPlayer(selectedCards);
    }
    
    generateCardsForPlayer(selectedCardIds) {
        selectedCardIds.forEach((cardId, index) => {
            const card = this.generateBingoCard(cardId);
            this.playerCards.push(card);
            
            if (index === 0) {
                this.displayCard(card);
            }
        });
        
        // Update card navigation
        document.getElementById('cardNumber').textContent = selectedCardIds[0] || '1';
    }
    
    generateBingoCard(cardId) {
        // Use cardId as seed for consistent card generation
        const card = {
            id: cardId,
            numbers: [],
            marked: new Set(['FREE']), // Center is always marked
            isWinning: false
        };
        
        // Generate unique numbers for each column
        this.bingoLetters.forEach(letter => {
            const [min, max] = this.numberRanges[letter];
            const columnNumbers = [];
            
            // Generate 5 unique numbers per column
            for (let i = 0; i < 5; i++) {
                let num;
                let attempts = 0;
                
                do {
                    // Use cardId to make generation deterministic
                    const seed = cardId * 100 + letter.charCodeAt(0) + i;
                    const random = this.seededRandom(seed);
                    num = Math.floor(random * (max - min + 1)) + min;
                    attempts++;
                } while (columnNumbers.includes(num) && attempts < 100);
                
                columnNumbers.push(num);
            }
            
            card.numbers.push(...columnNumbers);
        });
        
        // Mark center as FREE
        card.numbers[12] = 'FREE';
        
        return card;
    }
    
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    displayCard(card) {
        const cells = document.querySelectorAll('.bingo-cell');
        
        cells.forEach((cell, index) => {
            const number = card.numbers[index];
            cell.textContent = number;
            cell.dataset.number = number;
            
            // Clear previous marks
            cell.classList.remove('marked', 'winning');
            
            if (number === 'FREE') {
                cell.classList.add('free');
                cell.classList.add('marked');
            } else {
                cell.classList.remove('free');
                
                // Check if this number is marked
                if (card.marked.has(number)) {
                    cell.classList.add('marked');
                }
            }
        });
    }
    
    startNumberCaller() {
        this.gameInterval = setInterval(() => {
            if (!this.isPaused) {
                this.callNextNumber();
            }
        }, this.callSpeed);
        
        // Call first number immediately
        setTimeout(() => this.callNextNumber(), 1000);
    }
    
    callNextNumber() {
        if (this.calledNumbers.size >= 75) {
            this.endGame();
            return;
        }
        
        let letter, number;
        let attempts = 0;
        
        do {
            letter = this.bingoLetters[Math.floor(Math.random() * 5)];
            const [min, max] = this.numberRanges[letter];
            number = Math.floor(Math.random() * (max - min + 1)) + min;
            attempts++;
        } while (this.calledNumbers.has(`${letter}-${number}`) && attempts < 100);
        
        this.currentNumber = `${letter}-${number}`;
        this.calledNumbers.add(this.currentNumber);
        
        // Update display
        this.updateNumberDisplay(letter, number);
        this.updateRecentNumbers();
        this.markNumbersOnCards();
        this.checkForWinners();
        
        // Play sound
        if (!this.isMuted) {
            this.playCallSound();
        }
        
        // Update stats
        document.getElementById('calledCount').textContent = this.calledNumbers.size;
        
        // Update pool (simulate player joining)
        const currentPool = parseInt(document.getElementById('gamePool').textContent);
        const betAmount = parseInt(document.getElementById('gameBet').textContent);
        const newPool = currentPool + Math.floor(Math.random() * 10) * betAmount;
        document.getElementById('gamePool').textContent = newPool;
    }
    
    updateNumberDisplay(letter, number) {
        const numberBall = document.querySelector('.number-ball');
        numberBall.textContent = `${letter}-${number}`;
        
        // Add animation
        numberBall.style.animation = 'none';
        setTimeout(() => {
            numberBall.style.animation = 'pulse 2s infinite';
        }, 10);
    }
    
    updateRecentNumbers() {
        const recentContainer = document.getElementById('recentNumbers');
        const recentNumbers = Array.from(this.calledNumbers).slice(-6);
        
        recentContainer.innerHTML = '';
        recentNumbers.reverse().forEach(num => {
            const div = document.createElement('div');
            div.className = 'recent-number';
            div.textContent = num;
            recentContainer.appendChild(div);
        });
    }
    
    markNumbersOnCards() {
        const [letter, number] = this.currentNumber.split('-');
        
        this.playerCards.forEach(card => {
            // Check if this number exists on the card
            if (card.numbers.includes(parseInt(number))) {
                card.marked.add(parseInt(number));
                
                // If this is the current card, update UI
                if (card === this.getCurrentCard()) {
                    const cells = document.querySelectorAll('.bingo-cell');
                    cells.forEach(cell => {
                        if (cell.dataset.number === number) {
                            cell.classList.add('marked');
                        }
                    });
                }
            }
        });
    }
    
    checkForWinners() {
        this.playerCards.forEach(card => {
            if (card.isWinning) return; // Already won
            
            const winningLine = this.checkCardForWin(card);
            if (winningLine) {
                card.isWinning = true;
                this.winners.push({
                    cardId: card.id,
                    winningLine: winningLine,
                    winningNumber: this.currentNumber
                });
                
                // Highlight winning line
                this.highlightWinningLine(card, winningLine);
                
                if (this.autoBingo) {
                    this.declareWinner();
                } else {
                    // Enable BINGO button
                    document.getElementById('bingoBtn').style.display = 'block';
                }
            }
        });
    }
    
    checkCardForWin(card) {
        // Convert card numbers to 5x5 grid
        const grid = [];
        for (let i = 0; i < 5; i++) {
            grid[i] = [];
            for (let j = 0; j < 5; j++) {
                const num = card.numbers[i * 5 + j];
                const isMarked = num === 'FREE' || card.marked.has(num);
                grid[i][j] = isMarked;
            }
        }
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            if (grid[row].every(cell => cell)) {
                return {type: 'row', index: row};
            }
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            const column = [grid[0][col], grid[1][col], grid[2][col], grid[3][col], grid[4][col]];
            if (column.every(cell => cell)) {
                return {type: 'column', index: col};
            }
        }
        
        // Check diagonals
        const diag1 = [grid[0][0], grid[1][1], grid[2][2], grid[3][3], grid[4][4]];
        if (diag1.every(cell => cell)) {
            return {type: 'diagonal', index: 0};
        }
        
        const diag2 = [grid[0][4], grid[1][3], grid[2][2], grid[3][1], grid[4][0]];
        if (diag2.every(cell => cell)) {
            return {type: 'diagonal', index: 1};
        }
        
        return null;
    }
    
    highlightWinningLine(card, winningLine) {
        // Only highlight if this is the current card
        if (card !== this.getCurrentCard()) return;
        
        const cells = document.querySelectorAll('.bingo-cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            let shouldHighlight = false;
            
            switch (winningLine.type) {
                case 'row':
                    shouldHighlight = row === winningLine.index;
                    break;
                case 'column':
                    shouldHighlight = col === winningLine.index;
                    break;
                case 'diagonal':
                    if (winningLine.index === 0) {
                        shouldHighlight = row === col;
                    } else {
                        shouldHighlight = row + col === 4;
                    }
                    break;
            }
            
            if (shouldHighlight) {
                cell.classList.add('winning');
            }
        });
    }
    
    declareWinner() {
        const modal = document.getElementById('winnersModal');
        const user = JSON.parse(localStorage.getItem('telegramUser') || '{}');
        
        // Update winner info
        document.getElementById('winnerUsername').textContent = user.username || 'player_' + user.id;
        document.getElementById('winnerPrize').textContent = document.getElementById('gamePool').textContent;
        document.getElementById('winningCard').textContent = this.getCurrentCard().id;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Play win sound
        if (!this.isMuted) {
            this.playWinSound();
        }
        
        // Stop the game
        clearInterval(this.gameInterval);
        this.isPaused = true;
        
        // Record win in history
        this.recordWin();
    }
    
    recordWin() {
        const history = JSON.parse(localStorage.getItem('gameHistory') || '[]');
        const win = {
            gameId: document.getElementById('gameId').textContent,
            cardId: this.getCurrentCard().id,
            prize: document.getElementById('gamePool').textContent,
            timestamp: new Date().toISOString(),
            numbersCalled: this.calledNumbers.size
        };
        
        history.unshift(win);
        if (history.length > 50) history.pop(); // Keep only last 50
        
        localStorage.setItem('gameHistory', JSON.stringify(history));
        
        // Add to wallet
        this.addToWallet(parseInt(win.prize));
    }
    
    addToWallet(amount) {
        const wallet = JSON.parse(localStorage.getItem('userWallet') || '{"main":0,"play":0,"total":0}');
        wallet.main += amount;
        wallet.total = wallet.main + wallet.play;
        localStorage.setItem('userWallet', JSON.stringify(wallet));
    }
    
    getCurrentCard() {
        return this.playerCards[this.currentCardIndex];
    }
    
    updateGameStats() {
        // Update player count periodically
        setInterval(() => {
            const currentPlayers = parseInt(document.getElementById('playersCount').textContent);
            const change = Math.floor(Math.random() * 21) - 10; // -10 to +10
            const newPlayers = Math.max(100, Math.min(500, currentPlayers + change));
            document.getElementById('playersCount').textContent = newPlayers;
            
            // Update pool
            const bet = parseInt(document.getElementById('gameBet').textContent);
            const pool = parseInt(document.getElementById('gamePool').textContent);
            document.getElementById('gamePool').textContent = pool + (change * bet);
        }, 30000);
    }
    
    setupEventListeners() {
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            const icon = document.querySelector('#pauseBtn i');
            const text = document.querySelector('#pauseBtn');
            
            if (this.isPaused) {
                icon.className = 'fas fa-play';
                text.innerHTML = '<i class="fas fa-play"></i> Resume';
            } else {
                icon.className = 'fas fa-pause';
                text.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
        });
        
        // Mute button
        document.getElementById('muteBtn').addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            const icon = document.querySelector('#muteBtn i');
            
            if (this.isMuted) {
                icon.className = 'fas fa-volume-mute';
            } else {
                icon.className = 'fas fa-volume-up';
            }
        });
        
        // Speed button
        document.getElementById('speedBtn').addEventListener('click', () => {
            const speeds = [3000, 5000, 10000]; // Fast, Normal, Slow
            const labels = ['Fast', 'Normal', 'Slow'];
            const currentIndex = speeds.indexOf(this.callSpeed);
            const nextIndex = (currentIndex + 1) % speeds.length;
            
            this.callSpeed = speeds[nextIndex];
            document.getElementById('speedBtn').innerHTML = 
                `<i class="fas fa-tachometer-alt"></i> ${labels[nextIndex]}`;
            
            // Restart interval with new speed
            clearInterval(this.gameInterval);
            this.startNumberCaller();
        });
        
        // Auto BINGO toggle
        document.getElementById('autoBingo').addEventListener('change', (e) => {
            this.autoBingo = e.target.checked;
        });
        
        // BINGO button
        document.getElementById('bingoBtn').addEventListener('click', () => {
            if (this.winners.length > 0) {
                this.declareWinner();
            }
        });
        
        // Card navigation
        document.getElementById('prevCard').addEventListener('click', () => {
            if (this.currentCardIndex > 0) {
                this.currentCardIndex--;
                this.displayCard(this.getCurrentCard());
                document.getElementById('cardNumber').textContent = this.getCurrentCard().id;
            }
        });
        
        document.getElementById('nextCard').addEventListener('click', () => {
            if (this.currentCardIndex < this.playerCards.length - 1) {
                this.currentCardIndex++;
                this.displayCard(this.getCurrentCard());
                document.getElementById('cardNumber').textContent = this.getCurrentCard().id;
            }
        });
        
        // Modal buttons
        document.getElementById('claimPrize').addEventListener('click', () => {
            document.getElementById('winnersModal').style.display = 'none';
            window.location.href = 'wallet.html';
        });
        
        document.getElementById('playAgain').addEventListener('click', () => {
            document.getElementById('winnersModal').style.display = 'none';
            window.location.href = 'select.html';
        });
        
        // Click on bingo cells
        document.querySelectorAll('.bingo-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const number = cell.dataset.number;
                if (number !== 'FREE') {
                    cell.classList.toggle('marked');
                    
                    // Update card data
                    const card = this.getCurrentCard();
                    if (cell.classList.contains('marked')) {
                        card.marked.add(parseInt(number));
                    } else {
                        card.marked.delete(parseInt(number));
                    }
                    
                    // Check for win after manual mark
                    this.checkForWinners();
                }
            });
        });
    }
    
    playCallSound() {
        const audio = document.getElementById('callAudio');
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
    
    playWinSound() {
        const audio = document.getElementById('winAudio');
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Win audio play failed:', e));
    }
    
    endGame() {
        alert('All numbers have been called! Game Over.');
        clearInterval(this.gameInterval);
    }
}