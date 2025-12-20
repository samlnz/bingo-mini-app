// Bingo Game Logic and Utilities

class BingoGameLogic {
    constructor() {
        this.BINGO_CARDS = new Map();
        this.initializePredefinedCards();
    }
    
    initializePredefinedCards() {
        // Generate 500 fixed bingo cards
        // Each card is deterministic based on its ID
        for (let cardId = 1; cardId <= 500; cardId++) {
            this.BINGO_CARDS.set(cardId, this.generateFixedCard(cardId));
        }
    }
    
    generateFixedCard(cardId) {
        // Fixed algorithm to generate the same card for the same cardId
        const card = {
            id: cardId,
            numbers: [],
            patterns: []
        };
        
        const ranges = [
            { min: 1, max: 15 },   // B
            { min: 16, max: 30 },  // I
            { min: 31, max: 45 },  // N
            { min: 46, max: 60 },  // G
            { min: 61, max: 75 }   // O
        ];
        
        // Use cardId as seed for deterministic random numbers
        let seed = cardId * 9301 + 49297;
        
        for (let col = 0; col < 5; col++) {
            const colNumbers = [];
            const range = ranges[col];
            
            while (colNumbers.length < 5) {
                seed = (seed * 9301 + 49297) % 233280;
                const rand = seed / 233280;
                const num = Math.floor(range.min + rand * (range.max - range.min + 1));
                
                if (!colNumbers.includes(num)) {
                    colNumbers.push(num);
                }
            }
            
            colNumbers.sort((a, b) => a - b);
            card.numbers.push(...colNumbers);
        }
        
        // Set FREE space
        card.numbers[12] = 'FREE';
        
        // Generate possible winning patterns
        card.patterns = this.generateWinningPatterns();
        
        return card;
    }
    
    generateWinningPatterns() {
        const patterns = [];
        
        // Rows
        for (let row = 0; row < 5; row++) {
            patterns.push(Array.from({ length: 5 }, (_, col) => row * 5 + col));
        }
        
        // Columns
        for (let col = 0; col < 5; col++) {
            patterns.push(Array.from({ length: 5 }, (_, row) => row * 5 + col));
        }
        
        // Diagonals
        patterns.push([0, 6, 12, 18, 24]); // Top-left to bottom-right
        patterns.push([4, 8, 12, 16, 20]); // Top-right to bottom-left
        
        return patterns;
    }
    
    checkWinningLine(markedCells, pattern) {
        return pattern.every(index => {
            // Center (index 12) is always considered marked
            return index === 12 || markedCells[index];
        });
    }
    
    getAllWinningPatterns(markedCells) {
        const winningPatterns = [];
        const patterns = this.generateWinningPatterns();
        
        patterns.forEach(pattern => {
            if (this.checkWinningLine(markedCells, pattern)) {
                winningPatterns.push(pattern);
            }
        });
        
        return winningPatterns;
    }
    
    validateBingoClaim(cardId, markedCells, calledNumbers) {
        const card = this.BINGO_CARDS.get(cardId);
        if (!card) return { valid: false, reason: 'Invalid card' };
        
        // Verify all marked cells correspond to called numbers or FREE
        for (let i = 0; i < 25; i++) {
            if (i === 12) continue; // FREE space
            
            if (markedCells[i]) {
                const number = card.numbers[i];
                if (!calledNumbers.includes(number)) {
                    return { valid: false, reason: `Number ${number} not called yet` };
                }
            }
        }
        
        // Check for winning patterns
        const winningPatterns = this.getAllWinningPatterns(markedCells);
        
        if (winningPatterns.length === 0) {
            return { valid: false, reason: 'No winning pattern found' };
        }
        
        return {
            valid: true,
            cardId: cardId,
            patterns: winningPatterns,
            numbers: card.numbers.filter((n, i) => markedCells[i] || i === 12)
        };
    }
    
    getCardNumbers(cardId) {
        return this.BINGO_CARDS.get(cardId)?.numbers || [];
    }
    
    getCardById(cardId) {
        return this.BINGO_CARDS.get(cardId);
    }
    
    // Simulate game with multiple players (for testing)
    simulateGame(playerCount) {
        const players = [];
        const takenCards = new Set();
        
        for (let i = 0; i < playerCount; i++) {
            let cardId;
            do {
                cardId = Math.floor(Math.random() * 500) + 1;
            } while (takenCards.has(cardId) && takenCards.size < 500);
            
            takenCards.add(cardId);
            
            players.push({
                id: `player_${i + 1}`,
                name: `Player ${i + 1}`,
                cards: [cardId],
                marked: Array(25).fill(false)
            });
        }
        
        return {
            players: players,
            takenCards: Array.from(takenCards),
            totalPrize: (playerCount * 10 * 0.8).toFixed(2)
        };
    }
    
    // Generate random called numbers
    generateCalledNumbers(count = 75) {
        const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
        
        // Fisher-Yates shuffle
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        return numbers.slice(0, count);
    }
    
    // Check if a number can be marked on a card
    canMarkNumber(cardId, number) {
        const cardNumbers = this.getCardNumbers(cardId);
        return cardNumbers.includes(number) || number === 'FREE';
    }
    
    // Get the index of a number on a card
    getNumberIndex(cardId, number) {
        const cardNumbers = this.getCardNumbers(cardId);
        return cardNumbers.indexOf(number);
    }
    
    // Calculate prize distribution
    calculatePrizeDistribution(totalPlayers, winnersCount) {
        const totalStake = totalPlayers * 10;
        const houseCommission = totalStake * 0.2;
        const prizePool = totalStake - houseCommission;
        
        if (winnersCount === 0) return { prizePool: 0, houseCommission };
        
        const prizePerWinner = prizePool / winnersCount;
        
        return {
            totalStake,
            houseCommission,
            prizePool,
            prizePerWinner,
            winnersCount
        };
    }
}

// Initialize game logic
window.bingoLogic = new BingoGameLogic();

// Utility functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Local storage helper
class StorageManager {
    constructor() {
        this.prefix = 'bingo_';
    }
    
    set(key, value) {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
    }
    
    get(key) {
        const item = localStorage.getItem(this.prefix + key);
        return item ? JSON.parse(item) : null;
    }
    
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }
    
    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

window.bingoStorage = new StorageManager();

// Sound manager
class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
    }
    
    loadSound(name, url) {
        const audio = new Audio(url);
        this.sounds.set(name, audio);
    }
    
    play(name) {
        if (!this.enabled) return;
        
        const sound = this.sounds.get(name);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Audio play failed:', e));
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

window.bingoSound = new SoundManager();