class GameLogic {
    static instance = null;
    
    constructor() {
        this.selectedCards = [];
        this.user = null;
        this.calledNumbers = new Set();
        this.currentNumber = null;
        this.gameInterval = null;
        this.isCallerActive = true;
        this.isMuted = false;
        this.currentCardIndex = 0;
        this.players = [];
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
    
    static init(selectedCards, user) {
        if (!GameLogic.instance) {
            GameLogic.instance = new GameLogic();
        }
        GameLogic.instance.selectedCards = selectedCards;
        GameLogic.instance.user = user;
        GameLogic.instance.startGame();
        return GameLogic.instance;
    }
    
    startGame() {
        this.generatePlayerCards();
        this.setupEventListeners();
        this.startCaller();
        this.updatePlayerCount();
        this.setupAudio();
    }
    
    generatePlayerCards() {
        const carousel = document.getElementById('cardsCarousel');
        carousel.innerHTML = '';
        
        this.selectedCards.forEach((cardId, index) => {
            const card = this.generateBingoCard(cardId);
            card.dataset.cardIndex = index;
            carousel.appendChild(card);
        });
        
        document.getElementById('totalCards').textContent = this.selectedCards.length;
        this.showCard(0);
    }
    
    generateBingoCard(cardId) {
        const card = document.createElement('div');
        card.className = 'bingo-card';
        card.innerHTML = `
            <div class="card-header">
                <h3>Card #${cardId}</h3>
                <span class="card-status">Ready</span>
            </div>
            <div class="card-columns">
                <div>B</div>
                <div>I</div>
                <div>N</div>
                <div>G</div>
                <div>O</div>
            </div>
            <div class="card-numbers" id="cardNumbers_${cardId}">
                <!-- Numbers will be generated here -->
            </div>
        `;
        
        this.generateCardNumbers(cardId, card.querySelector('.card-numbers'));
        return card;
    }
    
    generateCardNumbers(cardId, container) {
        // Use cardId as seed for consistent card generation
        const seed = cardId;
        const numbers = [];
        
        // Generate numbers for each column
        this.bingoLetters.forEach((letter, colIndex) => {
            const [min, max] = this.numberRanges[letter];
            const colNumbers = [];
            
            // Generate 5 unique numbers for each column (except center which is FREE)
            while (colNumbers.length < 5) {
                // Use seed to make generation deterministic
                const randomNum = this.seededRandom(seed + colIndex * 100 + colNumbers.length);
                const num = Math.floor(randomNum * (max - min + 1)) + min;
                
                if (!colNumbers.includes(num)) {
                    colNumbers.push(num);
                }
            }
            
            colNumbers.sort((a, b) => a - b);
            numbers.push(...colNumbers);
        });
        
        // Mark center as FREE
        numbers[12] = 'FREE';
        
        // Create number cells
        container.innerHTML = '';
        numbers.forEach((num, index) => {
            const cell = document.createElement('div');
            cell.className = `bingo-cell ${num === 'FREE' ? 'free' : ''}`;
            cell.textContent = num;
            cell.dataset.number = num;
            cell.dataset.position = index;
            cell.dataset.cardId = cardId;
            
            if (num !== 'FREE') {
                cell.addEventListener('click', () => this.toggleNumber(cell));
            }
            
            container.appendChild(cell);
        });
    }
    
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    startCaller() {
        this.gameInterval = setInterval(() => {
            if (this.isCallerActive) {
                this.callNextNumber();
            }
        }, 5000); // Call number every 5 seconds
        
        this.callNextNumber(); // Call first