/**
 * Real Estate Slideshow Controller
 * Manages slideshow presentation, navigation, and property display
 */

class RealEstateSlideshow {
    constructor() {
        this.properties = [];
        this.currentIndex = 0;
        this.isPlaying = true;
        this.autoAdvanceInterval = null;
        this.autoAdvanceDelay = 8000; // 8 seconds per slide
        this.isLoading = false;
        this.keyboardEnabled = true;
        
        // DOM elements
        this.elements = {
            loading: document.getElementById('loading'),
            slideWrapper: document.getElementById('slideWrapper'),
            currentSlide: document.getElementById('currentSlide'),
            nextSlidePreload: document.getElementById('nextSlidePreload'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            playPauseIcon: document.getElementById('playPauseIcon'),
            progressBar: document.getElementById('progressBar'),
            currentSlideNum: document.getElementById('currentSlideNum'),
            totalSlides: document.getElementById('totalSlides'),
            errorMessage: document.getElementById('errorMessage')
        };
        
        this.init();
    }

    /**
     * Initialize the slideshow
     */
    async init() {
        try {
            this.showLoading(true);
            this.setupEventListeners();
            
            // Load properties from API
            this.properties = await window.realEstateAPI.fetchProperties();
            
            if (this.properties.length === 0) {
                throw new Error('No properties available');
            }
            
            // Load images for all properties
            await this.preloadPropertyImages();
            
            // Initialize first slide
            this.updateSlideCounter();
            await this.displaySlide(0);
            this.preloadNextSlide();
            
            this.showLoading(false);
            this.startAutoAdvance();
            
            console.log(`Slideshow initialized with ${this.properties.length} properties`);
        } catch (error) {
            console.error('Failed to initialize slideshow:', error);
            this.showError(error.message);
        }
    }

    /**
     * Setup event listeners for navigation and keyboard controls
     */
    setupEventListeners() {
        // Navigation buttons
        this.elements.prevBtn.addEventListener('click', () => this.previousSlide());
        this.elements.nextBtn.addEventListener('click', () => this.nextSlide());
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (!this.keyboardEnabled) return;
            
            switch (event.code) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    event.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    event.preventDefault();
                    this.nextSlide();
                    break;
                case 'Space':
                    event.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'Home':
                    event.preventDefault();
                    this.goToSlide(0);
                    break;
                case 'End':
                    event.preventDefault();
                    this.goToSlide(this.properties.length - 1);
                    break;
                case 'Escape':
                    event.preventDefault();
                    if (this.isPlaying) this.pause();
                    break;
            }
        });
        
        // Touch/swipe support for mobile and TV remotes
        let startX = 0;
        let startY = 0;
        
        this.elements.slideWrapper.addEventListener('touchstart', (event) => {
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
        }, { passive: true });
        
        this.elements.slideWrapper.addEventListener('touchend', (event) => {
            if (!startX || !startY) return;
            
            const endX = event.changedTouches[0].clientX;
            const endY = event.changedTouches[0].clientY;
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Only trigger if horizontal swipe is more significant than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    this.nextSlide();
                } else {
                    this.previousSlide();
                }
            }
            
            startX = 0;
            startY = 0;
        }, { passive: true });
        
        // Handle visibility change (pause when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.isPlaying) {
                this.play();
            }
        });
        
        // Handle window resize for responsive adjustments
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Preload images for all properties
     */
    async preloadPropertyImages() {
        const imagePromises = this.properties.map(async (property, index) => {
            try {
                const images = await window.realEstateAPI.fetchPropertyImages(property.id);
                this.properties[index].images = images;
            } catch (error) {
                console.warn(`Failed to load images for property ${property.id}:`, error);
                this.properties[index].images = [{
                    url: window.realEstateAPI.getPlaceholderImage(),
                    thumbnail: window.realEstateAPI.getPlaceholderImage(),
                    alt: 'Property image not available',
                    caption: ''
                }];
            }
        });
        
        await Promise.allSettled(imagePromises);
    }

    /**
     * Display a specific slide
     * @param {number} index - Slide index to display
     */
    async displaySlide(index) {
        if (index < 0 || index >= this.properties.length || this.isLoading) return;
        
        this.isLoading = true;
        this.currentIndex = index;
        const property = this.properties[index];
        
        try {
            // Create slide HTML
            const slideHTML = this.createSlideHTML(property);
            
            // Update current slide
            this.elements.currentSlide.innerHTML = slideHTML;
            
            // Update progress bar
            this.updateProgress();
            
            // Update slide counter
            this.updateSlideCounter();
            
            // Announce to screen readers
            this.announceSlideChange(property);
            
            this.isLoading = false;
        } catch (error) {
            console.error('Error displaying slide:', error);
            this.isLoading = false;
        }
    }

    /**
     * Create HTML for a property slide
     * @param {Object} property - Property data
     * @returns {string} HTML string for the slide
     */
    createSlideHTML(property) {
        const location = `${property.location.address}, ${property.location.city}, ${property.location.state} ${property.location.zip}`;
        const mainImage = property.images && property.images.length > 0 
            ? property.images[0] 
            : { url: window.realEstateAPI.getPlaceholderImage(), alt: 'Property image not available' };
        
        return `
            <div class="property-images">
                <img src="${mainImage.url}" 
                     alt="${mainImage.alt}" 
                     class="property-image"
                     loading="lazy"
                     onerror="this.src='${window.realEstateAPI.getPlaceholderImage()}'">
            </div>
            <div class="property-details">
                <h1 class="property-title">${this.escapeHtml(property.title)}</h1>
                <div class="property-price">${property.price}</div>
                <div class="property-location">${this.escapeHtml(location)}</div>
                
                <div class="property-features">
                    <div class="feature-item">
                        <span class="feature-value">${property.features.bedrooms}</span>
                        <span class="feature-label">Bedrooms</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-value">${property.features.bathrooms}</span>
                        <span class="feature-label">Bathrooms</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-value">${property.features.area.toLocaleString()}</span>
                        <span class="feature-label">Sq Ft</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-value">${property.features.type}</span>
                        <span class="feature-label">Type</span>
                    </div>
                    ${property.features.yearBuilt ? `
                    <div class="feature-item">
                        <span class="feature-value">${property.features.yearBuilt}</span>
                        <span class="feature-label">Built</span>
                    </div>` : ''}
                    ${property.features.garage > 0 ? `
                    <div class="feature-item">
                        <span class="feature-value">${property.features.garage}</span>
                        <span class="feature-label">Garage</span>
                    </div>` : ''}
                </div>
                
                ${property.description ? `
                <div class="property-description">
                    ${this.escapeHtml(property.description)}
                </div>` : ''}
            </div>
        `;
    }

    /**
     * Preload the next slide for smooth transitions
     */
    preloadNextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.properties.length;
        const nextProperty = this.properties[nextIndex];
        
        if (nextProperty && nextProperty.images && nextProperty.images.length > 0) {
            const img = new Image();
            img.src = nextProperty.images[0].url;
        }
    }

    /**
     * Navigate to previous slide
     */
    previousSlide() {
        const prevIndex = this.currentIndex === 0 
            ? this.properties.length - 1 
            : this.currentIndex - 1;
        this.goToSlide(prevIndex);
    }

    /**
     * Navigate to next slide
     */
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.properties.length;
        this.goToSlide(nextIndex);
    }

    /**
     * Go to a specific slide
     * @param {number} index - Slide index
     */
    async goToSlide(index) {
        if (index === this.currentIndex || this.isLoading) return;
        
        await this.displaySlide(index);
        this.preloadNextSlide();
        
        // Reset auto-advance timer
        if (this.isPlaying) {
            this.resetAutoAdvance();
        }
    }

    /**
     * Toggle play/pause state
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * Start auto-advance
     */
    play() {
        this.isPlaying = true;
        this.elements.playPauseIcon.textContent = '⏸️';
        this.elements.playPauseBtn.setAttribute('aria-label', 'Pause slideshow');
        this.startAutoAdvance();
    }

    /**
     * Stop auto-advance
     */
    pause() {
        this.isPlaying = false;
        this.elements.playPauseIcon.textContent = '▶️';
        this.elements.playPauseBtn.setAttribute('aria-label', 'Play slideshow');
        this.stopAutoAdvance();
    }

    /**
     * Start auto-advance timer
     */
    startAutoAdvance() {
        if (!this.isPlaying) return;
        
        this.stopAutoAdvance();
        this.autoAdvanceInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoAdvanceDelay);
    }

    /**
     * Stop auto-advance timer
     */
    stopAutoAdvance() {
        if (this.autoAdvanceInterval) {
            clearInterval(this.autoAdvanceInterval);
            this.autoAdvanceInterval = null;
        }
    }

    /**
     * Reset auto-advance timer
     */
    resetAutoAdvance() {
        if (this.isPlaying) {
            this.startAutoAdvance();
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = ((this.currentIndex + 1) / this.properties.length) * 100;
        this.elements.progressBar.style.setProperty('--progress', `${progress}%`);
    }

    /**
     * Update slide counter
     */
    updateSlideCounter() {
        this.elements.currentSlideNum.textContent = this.currentIndex + 1;
        this.elements.totalSlides.textContent = this.properties.length;
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        this.elements.loading.style.display = show ? 'block' : 'none';
        this.elements.slideWrapper.style.display = show ? 'none' : 'block';
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.showLoading(false);
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.style.display = 'block';
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Responsive adjustments if needed
        console.log('Window resized, adjusting layout if necessary');
    }

    /**
     * Announce slide change to screen readers
     * @param {Object} property - Property data
     */
    announceSlideChange(property) {
        const announcement = `Showing property ${this.currentIndex + 1} of ${this.properties.length}: ${property.title}, ${property.price}`;
        
        // Create a temporary element for screen reader announcement
        const announcement_element = document.createElement('div');
        announcement_element.setAttribute('aria-live', 'polite');
        announcement_element.setAttribute('aria-atomic', 'true');
        announcement_element.className = 'sr-only';
        announcement_element.textContent = announcement;
        
        document.body.appendChild(announcement_element);
        setTimeout(() => document.body.removeChild(announcement_element), 1000);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} unsafe - Unsafe string
     * @returns {string} Safe HTML string
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Get current property data
     * @returns {Object} Current property object
     */
    getCurrentProperty() {
        return this.properties[this.currentIndex];
    }

    /**
     * Refresh slideshow data
     */
    async refresh() {
        try {
            this.showLoading(true);
            this.pause();
            
            // Clear cache and reload
            window.realEstateAPI.clearCache();
            this.properties = await window.realEstateAPI.fetchProperties();
            
            if (this.properties.length === 0) {
                throw new Error('No properties available');
            }
            
            await this.preloadPropertyImages();
            
            // Reset to first slide
            this.currentIndex = 0;
            this.updateSlideCounter();
            await this.displaySlide(0);
            this.preloadNextSlide();
            
            this.showLoading(false);
            this.play();
            
            console.log('Slideshow refreshed successfully');
        } catch (error) {
            console.error('Failed to refresh slideshow:', error);
            this.showError(error.message);
        }
    }
}

// Initialize slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.slideshow = new RealEstateSlideshow();
});