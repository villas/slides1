// Slideshow Application
class PropertySlideshow {
    constructor() {
        this.properties = [];
        this.currentIndex = 0;
        this.isPlaying = true;
        this.intervalId = null;
        this.slideInterval = 8000; // 8 seconds
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;

        // DOM elements
        this.elements = {
            container: document.querySelector('.slideshow-container'),
            image: document.getElementById('propertyImg'),
            title: document.getElementById('propertyTitle'),
            price: document.getElementById('propertyPrice'),
            location: document.getElementById('propertyLocation'),
            bedrooms: document.getElementById('bedrooms'),
            bathrooms: document.getElementById('bathrooms'),
            area: document.getElementById('area'),
            propertyType: document.getElementById('propertyType'),
            description: document.getElementById('propertyDescription'),
            progressFill: document.getElementById('progressFill'),
            slideCounter: document.getElementById('slideCounter'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            playPauseIcon: document.getElementById('playPauseIcon'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            errorMessage: document.getElementById('errorMessage')
        };

        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadProperties();
            this.setupEventListeners();
            this.startSlideshow();
            this.updateDisplay();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to initialize slideshow:', error);
            this.showError();
        }
    }

    async loadProperties() {
        try {
            // First try to load from curated slideshow list
            const listResponse = await fetch('/api/slideshow-list');
            if (listResponse.ok) {
                const listData = await listResponse.json();
                this.properties = [];

                for (const item of listData) {
                    if (item.type === 'MSG') {
                        // Handle message items
                        this.properties.push({
                            id: `msg-${Date.now()}`,
                            title: item.message,
                            price: '',
                            location: '',
                            bedrooms: '',
                            bathrooms: '',
                            area: '',
                            type: 'Message',
                            description: item.message,
                            images: [],
                            mainImage: '',
                            isMessage: true,
                            backgroundColor: item.bgcolor ? this.getColorValue(item.bgcolor) : '',
                            displayTime: item.secs || 4000
                        });
                    } else if (item.type === 'RENT') {
                        // Handle rental properties
                        const rentalData = await this.loadRentalProperty(item.ref);
                        if (rentalData) {
                            this.properties.push(rentalData);
                        }
                    } else {
                        // Handle sales properties (default)
                        const salesData = await this.loadSalesProperty(item.ref);
                        if (salesData) {
                            this.properties.push(salesData);
                        }
                    }
                }

                if (this.properties.length > 0) {
                    console.log(`Loaded ${this.properties.length} curated items from slideshow list`);
                    this.preloadImages();
                    return;
                }
            }

            // Fallback to full API if list fails
            await this.loadFromAPI();

        } catch (error) {
            console.error('Failed to load from slideshow list, falling back to API:', error);
            await this.loadFromAPI();
        }
    }

    async loadFromAPI() {
        // Original API loading logic as fallback
        try {
            const corsProxy = 'https://api.allorigins.win/get?url=';
            const apiUrl = encodeURIComponent('https://ivvdata.algarvevillaclub.com/datafeed/properties.json?type=saleonly');
            const response = await fetch(corsProxy + apiUrl);

            if (response.ok) {
                const proxyData = await response.json();
                const data = JSON.parse(proxyData.contents);

                this.properties = data.properties
                    .filter(property => property.imagegallery && property.imagegallery.length > 0)
                    .map(property => ({
                        id: property.propcode,
                        title: property.title || 'Untitled Property',
                        price: this.formatPrice(property.price),
                        location: property.areaname || 'Location not specified',
                        bedrooms: property.bedrooms || 0,
                        bathrooms: property.bathrooms || 0,
                        area: property.propcode || 'N/A',
                        type: property.ptypedescription || 'Property',
                        description: property.description || 'No description available.',
                        images: property.imagegallery.map(img => img.replace('pics_lg', 'pics')),
                        mainImage: property.imagegallery[0].replace('pics_lg', 'pics')
                    }));

                console.log(`Loaded ${this.properties.length} properties from API via CORS proxy`);
            } else {
                throw new Error(`CORS proxy returned ${response.status}: ${response.statusText}`);
            }

            this.preloadImages();

        } catch (error) {
            console.error('Failed to load properties from API, using mock data:', error);
            this.properties = this.getMockProperties();
            this.preloadImages();
        }
    }

    async loadSalesProperty(propRef) {
        try {
            const corsProxy = 'https://api.allorigins.win/get?url=';
            const apiUrl = encodeURIComponent('https://ivvdata.algarvevillaclub.com/datafeed/properties.json?type=saleonly');
            const response = await fetch(corsProxy + apiUrl);

            if (response.ok) {
                const proxyData = await response.json();
                const data = JSON.parse(proxyData.contents);

                const property = data.properties.find(p =>
                    p.propcode == propRef ||
                    p.id == propRef
                );

                if (property && property.imagegallery && property.imagegallery.length > 0) {
                    return {
                        id: property.propcode,
                        title: property.title || 'Untitled Property',
                        price: this.formatPrice(property.price),
                        location: property.areaname || 'Location not specified',
                        bedrooms: property.bedrooms || 0,
                        bathrooms: property.bathrooms || 0,
                        area: property.propcode || 'N/A',
                        type: property.ptypedescription || 'Property',
                        description: property.description || 'No description available.',
                        images: property.imagegallery.map(img => img.replace('pics_lg', 'pics')),
                        mainImage: property.imagegallery[0].replace('pics_lg', 'pics')
                    };
                }
            }
        } catch (error) {
            console.error(`Failed to load sales property ${propRef}:`, error);
        }
        return null;
    }

    async loadRentalProperty(propRef) {
        // For now, return a placeholder rental property
        // In the future, this could integrate with your rental API
        return {
            id: propRef,
            title: `Rental Property ${propRef}`,
            price: 'Price on request',
            location: 'Algarve',
            bedrooms: 'TBD',
            bathrooms: '',
            area: propRef,
            type: 'Rental',
            description: `Luxury rental property ${propRef}. Contact us for availability and pricing.`,
            images: [],
            mainImage: '',
            isRental: true
        };
    }

    getColorValue(colorName) {
        const colors = {
            'yellow': '#ffd700',
            'red': '#ff4444',
            'blue': '#4444ff',
            'green': '#44ff44',
            'orange': '#ffaa44',
            'purple': '#aa44ff'
        };
        return colors[colorName.toLowerCase()] || colorName;
    }

    getMockProperties() {
        return [
            {
                id: 1,
                title: 'Luxury Villa with Ocean View',
                price: this.formatPrice(850000),
                location: 'Albufeira, Algarve',
                bedrooms: 4,
                bathrooms: 3,
                area: '320m²',
                type: 'Villa',
                description: 'Stunning 4-bedroom villa with panoramic ocean views, private pool, and modern amenities. Perfect for luxury living in the Algarve.',
                images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
                mainImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
            },
            {
                id: 2,
                title: 'Modern Apartment in City Center',
                price: this.formatPrice(425000),
                location: 'Faro, Algarve',
                bedrooms: 2,
                bathrooms: 2,
                area: '95m²',
                type: 'Apartment',
                description: 'Contemporary 2-bedroom apartment in the heart of Faro. Walking distance to shops, restaurants, and the marina.',
                images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'],
                mainImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
            },
            {
                id: 3,
                title: 'Charming Townhouse',
                price: this.formatPrice(320000),
                location: 'Lagoa, Algarve',
                bedrooms: 3,
                bathrooms: 2,
                area: '140m²',
                type: 'Townhouse',
                description: 'Beautifully restored 3-bedroom townhouse with traditional Algarve architecture and modern interior design.',
                images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
                mainImage: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
            },
            {
                id: 4,
                title: 'Beachfront Penthouse',
                price: this.formatPrice(675000),
                location: 'Vilamoura, Algarve',
                bedrooms: 3,
                bathrooms: 3,
                area: '180m²',
                type: 'Penthouse',
                description: 'Exclusive beachfront penthouse with stunning sea views, rooftop terrace, and direct beach access.',
                images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
                mainImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
            },
            {
                id: 5,
                title: 'Countryside Farmhouse',
                price: this.formatPrice(295000),
                location: 'Monchique, Algarve',
                bedrooms: 3,
                bathrooms: 2,
                area: '200m²',
                type: 'Farmhouse',
                description: 'Charming countryside farmhouse surrounded by olive groves and vineyards. Includes a small plot of land.',
                images: ['https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800'],
                mainImage: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800'
            }
        ];
    }

    preloadImages() {
        this.properties.forEach(property => {
            const img = new Image();
            img.src = property.mainImage;
        });
    }

    setupEventListeners() {
        // Button controls
        this.elements.prevBtn.addEventListener('click', () => this.previousSlide());
        this.elements.nextBtn.addEventListener('click', () => this.nextSlide());
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Touch/swipe gestures
        this.elements.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.elements.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.elements.container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Mouse controls (click on image areas)
        this.elements.image.addEventListener('click', (e) => this.handleImageClick(e));

        // Visibility change to pause/resume when tab is not active
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    handleKeyPress(e) {
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                this.nextSlide();
                break;
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.properties.length - 1);
                break;
        }
    }

    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchMove(e) {
        // Prevent scrolling when swiping
        e.preventDefault();
    }

    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.touchEndY = e.changedTouches[0].screenY;
        this.handleSwipe();
    }

    handleSwipe() {
        const deltaX = this.touchStartX - this.touchEndX;
        const deltaY = this.touchStartY - this.touchEndY;
        const minSwipeDistance = 50;

        // Determine if it's a horizontal or vertical swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                this.nextSlide(); // Swipe left
            } else {
                this.previousSlide(); // Swipe right
            }
        }
    }

    handleImageClick(e) {
        const rect = this.elements.image.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const imageWidth = rect.width;

        if (clickX < imageWidth / 2) {
            this.previousSlide(); // Left side click
        } else {
            this.nextSlide(); // Right side click
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseSlideshow();
        } else {
            this.resumeSlideshow();
        }
    }

    startSlideshow() {
        this.clearInterval();
        if (this.isPlaying) {
            this.intervalId = setInterval(() => {
                this.nextSlide();
            }, this.slideInterval);
        }
    }

    pauseSlideshow() {
        this.isPlaying = false;
        this.clearInterval();
        this.updatePlayPauseButton();
    }

    resumeSlideshow() {
        this.isPlaying = true;
        this.startSlideshow();
        this.updatePlayPauseButton();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pauseSlideshow();
        } else {
            this.resumeSlideshow();
        }
    }

    clearInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    nextSlide() {
        this.goToSlide((this.currentIndex + 1) % this.properties.length);
    }

    previousSlide() {
        this.goToSlide((this.currentIndex - 1 + this.properties.length) % this.properties.length);
    }

    goToSlide(index) {
        this.currentIndex = index;
        this.updateDisplay();
        this.startSlideshow(); // Reset the timer
    }

    updateDisplay() {
        const property = this.properties[this.currentIndex];

        // Handle message items differently
        if (property.isMessage) {
            this.showMessage(property);
            return;
        }

        // Handle rental properties (no image)
        if (property.isRental && !property.mainImage) {
            this.showRentalProperty(property);
            return;
        }

        // Default property display
        this.showProperty(property);
    }

    showProperty(property) {
        // Show property image section
        this.elements.image.style.display = 'block';

        // Update image with fade effect
        this.elements.image.style.opacity = '0';
        setTimeout(() => {
            this.elements.image.src = property.mainImage || '';
            this.elements.image.alt = `Image of ${property.title}`;
            this.elements.image.style.opacity = '1';
        }, 150);

        // Update text content
        this.elements.title.textContent = property.title;
        this.elements.price.textContent = property.price;
        this.elements.location.textContent = property.location;
        this.elements.bedrooms.textContent = property.bedrooms;
        this.elements.bathrooms.textContent = property.bathrooms;
        this.elements.area.textContent = property.area;
        this.elements.propertyType.textContent = property.type;
        this.elements.description.textContent = property.description;

        // Update progress and counter
        this.updateProgress();
        this.updateCounter();
    }

    showRentalProperty(property) {
        // Hide image section for rentals without images
        this.elements.image.style.display = 'none';

        // Update text content
        this.elements.title.textContent = property.title;
        this.elements.price.textContent = property.price;
        this.elements.location.textContent = property.location;
        this.elements.bedrooms.textContent = property.bedrooms;
        this.elements.bathrooms.textContent = property.bathrooms;
        this.elements.area.textContent = property.area;
        this.elements.propertyType.textContent = property.type;
        this.elements.description.textContent = property.description;

        // Update progress and counter
        this.updateProgress();
        this.updateCounter();
    }

    showMessage(message) {
        // Hide image section for messages
        this.elements.image.style.display = 'none';

        // Clear property details
        this.elements.title.textContent = '';
        this.elements.price.textContent = '';
        this.elements.location.textContent = '';
        this.elements.bedrooms.textContent = '';
        this.elements.bathrooms.textContent = '';
        this.elements.area.textContent = '';
        this.elements.propertyType.textContent = '';

        // Show message content
        this.elements.description.innerHTML = this.parseSimpleMessage(message.description);

        // Apply background color if specified
        if (message.backgroundColor) {
            document.body.style.background = message.backgroundColor;
            setTimeout(() => {
                document.body.style.background = 'var(--primary-gradient)';
            }, message.displayTime);
        }

        // Auto-advance after display time for messages
        if (message.displayTime && this.isPlaying) {
            setTimeout(() => {
                if (this.isPlaying) {
                    this.nextSlide();
                }
            }, message.displayTime);
        }

        // Update progress and counter
        this.updateProgress();
        this.updateCounter();
    }

    parseSimpleMessage(messageText) {
        // Simple message parser - just display as plain text for now
        // Could be enhanced later for basic formatting
        return `<div style="font-size: 2rem; text-align: center; padding: 2rem;">${messageText}</div>`;
    }

    updateProgress() {
        const progress = ((this.currentIndex + 1) / this.properties.length) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
    }

    updateCounter() {
        this.elements.slideCounter.textContent = `${this.currentIndex + 1}/${this.properties.length}`;
    }

    updatePlayPauseButton() {
        this.elements.playPauseIcon.textContent = this.isPlaying ? '⏸️' : '▶️';
        this.elements.playPauseBtn.setAttribute('aria-label',
            this.isPlaying ? 'Pause slideshow' : 'Play slideshow');
    }

    formatPrice(price) {
        if (!price) return 'Price on request';

        // Assume price is in euros, format accordingly
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    showLoading() {
        this.elements.loadingIndicator.style.display = 'block';
        this.elements.errorMessage.style.display = 'none';
    }

    hideLoading() {
        this.elements.loadingIndicator.style.display = 'none';
    }

    showError() {
        this.elements.loadingIndicator.style.display = 'none';
        this.elements.errorMessage.style.display = 'block';
    }
}

// Initialize the slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PropertySlideshow();
});

// Handle page unload to clean up intervals
window.addEventListener('beforeunload', () => {
    if (window.slideshowInstance && window.slideshowInstance.clearInterval) {
        window.slideshowInstance.clearInterval();
    }
});