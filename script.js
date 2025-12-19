// Dashboard functionality
class Dashboard {
    constructor() {
        this.selectedCards = new Set();
        this.timer = 60;
        this.timerInterval = null;
        this.currentPage = 1;
        this.cardsPerPage = 20;
        this.totalCards = 500;
        
        this.init();
    }
    
    init() {
        this.loadSelectedCards();
        this.initTimer();
        this.generateCardsGrid();
        this.setupEventListeners();
        this.updateUI();
    }
    
    loadSelectedCards() {
        const saved = localStorage.getItem('selectedCards');
        if (saved) {
            this.selectedCards = new Set(JSON.parse(saved));
        }
    }
    
    saveSelectedCards() {
        localStorage.setItem('selectedCards', JSON.stringify([...this.selectedCards]));
    }
    
    initTimer() {
        const timerElement = document.getElementById('timer');
        const progressCircle = document.querySelector('.timer-progress');
        const circumference = 2 * Math.PI * 54;
        
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = circumference;
        
        this.timerInterval = setInterval(() => {
            this.timer--;
            timerElement.textContent = this.timer;
            
            const progress = circumference - (this.timer / 60) * circumference;
            progressCircle.style.strokeDashoffset = progress;
            
            if (this.timer <= 10) {
                timerElement.style.color = '#ff6b6b';
                progressCircle.style.stroke = '#ff6b6b';
            }
            
            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.autoProceed();
            }
        }, 1000);
    }
    
    generateCardsGrid() {
        const grid = document.getElementById('cardsGrid');
        const startIndex = (this.currentPage - 1) * this.cardsPerPage;
        const endIndex = startIndex + this.cardsPerPage;
        
        grid.innerHTML = '';
        
        for (let i = startIndex + 1; i <= Math.min(endIndex, this.totalCards); i++) {
            const card = document.createElement('div');
            card.className = `card-item ${this.selectedCards.has(i) ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="card-number">${i}</div>
                <div class="card-status">Available</div>
            `;
            
            card.addEventListener('click', () => this.toggleCard(i));
            grid.appendChild(card);
        }
        
        this.updatePagination();
    }
    
    toggleCard(cardNumber) {
        if (this.selectedCards.has(cardNumber)) {
            this.selectedCards.delete(cardNumber);
        } else {
            if (this.selectedCards.size >= 2) {
                alert('You can only select up to 2 cards!');
                return;
            }
            this.selectedCards.add(cardNumber);
        }
        
        this.saveSelectedCards();
        this.updateUI();
        this.generateCardsGrid();
    }
    
    updateUI() {
        const count = document.getElementById('selectedCount');
        const startBtn = document.getElementById('startGame');
        
        count.textContent = this.selectedCards.size;
        startBtn.disabled = this.selectedCards.size === 0;
        
        if (this.selectedCards.size > 0) {
            startBtn.innerHTML = `
                <i class="fas fa-play-circle"></i> Start Game
                <span class="btn-subtext">Selected: ${this.selectedCards.size}/2 cards</span>
            `;
        }
    }
    
    updatePagination() {
        const totalPages = Math.ceil(this.totalCards / this.cardsPerPage);
        document.getElementById('currentPage').textContent = this.currentPage;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }
    
    setupEventListeners() {
        // Clear selection
        document.getElementById('clearSelection').addEventListener('click', () => {
            this.selectedCards.clear();
            this.saveSelectedCards();
            this.updateUI();
            this.generateCardsGrid();
        });
        
        // Auto select
        document.getElementById('autoSelect').addEventListener('click', () => {
            if (this.selectedCards.size >= 2) {
                alert('You already have 2 cards selected!');
                return;
            }
            
            const cardsNeeded = 2 - this.selectedCards.size;
            for (let i = 0; i < cardsNeeded; i++) {
                let randomCard;
                do {
                    randomCard = Math.floor(Math.random() * this.totalCards) + 1;
                } while (this.selectedCards.has(randomCard));
                
                this.selectedCards.add(randomCard);
            }
            
            this.saveSelectedCards();
            this.updateUI();
            this.generateCardsGrid();
        });
        
        // Start game
        document.getElementById('startGame').addEventListener('click', () => {
            if (this.selectedCards.size === 0) return;
            
            clearInterval(this.timerInterval);
            localStorage.setItem('selectedCards', JSON.stringify([...this.selectedCards]));
            window.location.href = 'game.html';
        });
        
        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.generateCardsGrid();
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            const totalPages = Math.ceil(this.totalCards / this.cardsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.generateCardsGrid();
            }
        });
        
        // Search
        document.getElementById('cardSearch').addEventListener('input', (e) => {
            const searchValue = parseInt(e.target.value);
            if (searchValue && searchValue >= 1 && searchValue <= this.totalCards) {
                this.currentPage = Math.ceil(searchValue / this.cardsPerPage);
                this.generateCardsGrid();
                
                // Highlight the searched card
                const cards = document.querySelectorAll('.card-item');
                cards.forEach(card => {
                    const cardNum = parseInt(card.querySelector('.card-number').textContent);
                    if (cardNum === searchValue) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        card.style.animation = 'pulse 1s 3';
                    }
                });
            }
        });
    }
    
    autoProceed() {
        if (this.selectedCards.size === 0) {
            // Auto select cards if none selected
            for (let i = 0; i < 2; i++) {
                let randomCard;
                do {
                    randomCard = Math.floor(Math.random() * this.totalCards) + 1;
                } while (this.selectedCards.has(randomCard));
                
                this.selectedCards.add(randomCard);
            }
            this.saveSelectedCards();
        }
        
        setTimeout(() => {
            window.location.href = 'game.html';
        }, 2000);
    }
}

// Initialize dashboard when page loads
if (document.querySelector('.dashboard-container')) {
    document.addEventListener('DOMContentLoaded', () => {
        new Dashboard();
    });
}