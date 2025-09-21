/**
 * API Layer for Real Estate Slideshow
 * Handles communication with backend Firebird database and filesystem
 */

class RealEstateAPI {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Fetch properties from the backend API
     * @param {Object} options - Query options
     * @param {number} options.limit - Number of properties to fetch
     * @param {number} options.offset - Offset for pagination
     * @param {string} options.status - Property status filter (available, sold, etc.)
     * @param {string} options.type - Property type filter (house, apartment, etc.)
     * @returns {Promise<Array>} Array of property objects
     */
    async fetchProperties(options = {}) {
        const params = new URLSearchParams({
            limit: options.limit || 50,
            offset: options.offset || 0,
            ...options
        });

        const cacheKey = `properties_${params.toString()}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            console.log('Returning cached properties');
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/properties?${params}`);
            const properties = await response.json();
            
            // Validate and normalize property data
            const normalizedProperties = properties.map(this.normalizeProperty);
            
            // Cache the results
            this.cache.set(cacheKey, normalizedProperties);
            
            return normalizedProperties;
        } catch (error) {
            console.error('Failed to fetch properties:', error);
            
            // Return mock data for development/testing
            if (options.useMockData !== false) {
                console.log('Using mock data for development');
                return this.getMockProperties();
            }
            
            throw new Error('Unable to load properties. Please check your connection.');
        }
    }

    /**
     * Fetch a single property by ID
     * @param {string|number} id - Property ID
     * @returns {Promise<Object>} Property object
     */
    async fetchProperty(id) {
        const cacheKey = `property_${id}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/properties/${id}`);
            const property = await response.json();
            const normalizedProperty = this.normalizeProperty(property);
            
            this.cache.set(cacheKey, normalizedProperty);
            return normalizedProperty;
        } catch (error) {
            console.error(`Failed to fetch property ${id}:`, error);
            throw error;
        }
    }

    /**
     * Fetch property images from filesystem
     * @param {string} propertyId - Property ID
     * @returns {Promise<Array>} Array of image URLs
     */
    async fetchPropertyImages(propertyId) {
        const cacheKey = `images_${propertyId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/properties/${propertyId}/images`);
            const images = await response.json();
            
            // Validate image URLs and add fallbacks
            const validatedImages = images.map(img => ({
                url: img.url,
                thumbnail: img.thumbnail || img.url,
                alt: img.alt || `Property ${propertyId} image`,
                caption: img.caption || ''
            }));
            
            this.cache.set(cacheKey, validatedImages);
            return validatedImages;
        } catch (error) {
            console.error(`Failed to fetch images for property ${propertyId}:`, error);
            // Return placeholder image
            return [{
                url: this.getPlaceholderImage(),
                thumbnail: this.getPlaceholderImage(),
                alt: 'Property image not available',
                caption: ''
            }];
        }
    }

    /**
     * Normalize property data from backend
     * @param {Object} property - Raw property data
     * @returns {Object} Normalized property object
     */
    normalizeProperty(property) {
        return {
            id: property.id || property.property_id,
            title: property.title || property.name || 'Untitled Property',
            price: this.formatPrice(property.price),
            location: {
                address: property.address || '',
                city: property.city || '',
                state: property.state || '',
                zip: property.zip || property.postal_code || '',
                country: property.country || 'US'
            },
            features: {
                bedrooms: parseInt(property.bedrooms || property.beds || 0),
                bathrooms: parseFloat(property.bathrooms || property.baths || 0),
                area: parseInt(property.area || property.square_feet || 0),
                type: property.type || property.property_type || 'Unknown',
                yearBuilt: parseInt(property.year_built || property.built_year || 0),
                garage: parseInt(property.garage_spaces || property.garage || 0)
            },
            description: property.description || '',
            status: property.status || 'available',
            images: [], // Will be loaded separately
            createdAt: property.created_at || property.date_added || new Date().toISOString(),
            updatedAt: property.updated_at || property.date_modified || new Date().toISOString()
        };
    }

    /**
     * Format price for display
     * @param {number|string} price - Raw price value
     * @returns {string} Formatted price string
     */
    formatPrice(price) {
        if (!price || isNaN(price)) return 'Price on request';
        
        const numPrice = parseFloat(price);
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(numPrice);
    }

    /**
     * Get placeholder image URL
     * @returns {string} Placeholder image URL
     */
    getPlaceholderImage() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzMzMyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
    }

    /**
     * Fetch with retry logic
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async fetchWithRetry(url, options = {}) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt} failed for ${url}:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear API cache
     */
    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }

    /**
     * Get mock data for development/testing
     * @returns {Array} Mock property data
     */
    getMockProperties() {
        return [
            {
                id: 1,
                title: "Luxury Waterfront Villa",
                price: "$2,850,000",
                location: {
                    address: "123 Ocean Drive",
                    city: "Miami Beach",
                    state: "FL",
                    zip: "33139",
                    country: "US"
                },
                features: {
                    bedrooms: 5,
                    bathrooms: 4.5,
                    area: 4200,
                    type: "Villa",
                    yearBuilt: 2018,
                    garage: 3
                },
                description: "Stunning waterfront villa with panoramic ocean views, private beach access, and state-of-the-art amenities. This architectural masterpiece features floor-to-ceiling windows, an infinity pool, and a gourmet kitchen perfect for entertaining.",
                status: "available",
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 2,
                title: "Modern Downtown Penthouse",
                price: "$1,650,000",
                location: {
                    address: "456 High Street",
                    city: "Seattle",
                    state: "WA",
                    zip: "98101",
                    country: "US"
                },
                features: {
                    bedrooms: 3,
                    bathrooms: 3,
                    area: 2800,
                    type: "Penthouse",
                    yearBuilt: 2020,
                    garage: 2
                },
                description: "Sophisticated penthouse in the heart of downtown with breathtaking city skyline views. Features include a private rooftop terrace, smart home technology, and premium finishes throughout.",
                status: "available",
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 3,
                title: "Charming Victorian Home",
                price: "$875,000",
                location: {
                    address: "789 Elm Avenue",
                    city: "San Francisco",
                    state: "CA",
                    zip: "94102",
                    country: "US"
                },
                features: {
                    bedrooms: 4,
                    bathrooms: 2,
                    area: 2100,
                    type: "Victorian",
                    yearBuilt: 1895,
                    garage: 1
                },
                description: "Beautifully restored Victorian home with original hardwood floors, ornate moldings, and modern updates. Located in a quiet neighborhood with tree-lined streets and excellent schools nearby.",
                status: "available",
                images: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }
}

// Create global API instance
window.realEstateAPI = new RealEstateAPI();