"""
Example Python API implementation for Real Estate Slideshow
This shows how to integrate with Firebird database and filesystem images

Requirements:
- fastapi
- fdb (Firebird database driver)
- python-multipart

Install: pip install fastapi fdb python-multipart uvicorn
Run: uvicorn backend_example:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import fdb
import os
from typing import List, Optional
import json

app = FastAPI(title="Real Estate Slideshow API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static images from filesystem
app.mount("/images", StaticFiles(directory="property_images"), name="images")

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': '/path/to/firebird/database.fdb',
    'user': 'SYSDBA',
    'password': 'your_password'
}

def get_db_connection():
    """Get Firebird database connection"""
    return fdb.connect(**DB_CONFIG)

@app.get("/api/properties")
async def get_properties(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    type: Optional[str] = None
):
    """
    Fetch properties from Firebird database
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Build SQL query with filters
        query = """
            SELECT 
                property_id,
                title,
                price,
                address,
                city,
                state,
                zip_code,
                bedrooms,
                bathrooms,
                area_sqft,
                property_type,
                year_built,
                garage_spaces,
                description,
                status,
                created_date,
                modified_date
            FROM properties 
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
            
        if type:
            query += " AND property_type = ?"
            params.append(type)
            
        query += " ORDER BY created_date DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        properties = []
        for row in rows:
            property_data = {
                "id": row[0],
                "title": row[1],
                "price": row[2],
                "address": row[3],
                "city": row[4],
                "state": row[5],
                "zip": row[6],
                "bedrooms": row[7],
                "bathrooms": row[8],
                "area": row[9],
                "type": row[10],
                "year_built": row[11],
                "garage_spaces": row[12],
                "description": row[13],
                "status": row[14],
                "created_at": row[15].isoformat() if row[15] else None,
                "updated_at": row[16].isoformat() if row[16] else None
            }
            properties.append(property_data)
            
        conn.close()
        return properties
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/properties/{property_id}")
async def get_property(property_id: int):
    """
    Fetch single property by ID
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                property_id,
                title,
                price,
                address,
                city,
                state,
                zip_code,
                bedrooms,
                bathrooms,
                area_sqft,
                property_type,
                year_built,
                garage_spaces,
                description,
                status,
                created_date,
                modified_date
            FROM properties 
            WHERE property_id = ?
        """, [property_id])
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Property not found")
            
        property_data = {
            "id": row[0],
            "title": row[1],
            "price": row[2],
            "address": row[3],
            "city": row[4],
            "state": row[5],
            "zip": row[6],
            "bedrooms": row[7],
            "bathrooms": row[8],
            "area": row[9],
            "type": row[10],
            "year_built": row[11],
            "garage_spaces": row[12],
            "description": row[13],
            "status": row[14],
            "created_at": row[15].isoformat() if row[15] else None,
            "updated_at": row[16].isoformat() if row[16] else None
        }
        
        conn.close()
        return property_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/properties/{property_id}/images")
async def get_property_images(property_id: int):
    """
    Get images for a property from filesystem
    """
    try:
        # Define image directory structure
        image_dir = f"property_images/{property_id}"
        
        if not os.path.exists(image_dir):
            # Return empty array if no images found
            return []
        
        images = []
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        
        # Scan directory for image files
        for filename in sorted(os.listdir(image_dir)):
            if any(filename.lower().endswith(ext) for ext in allowed_extensions):
                # Create thumbnail path (assume thumbnails are in 'thumbs' subdirectory)
                thumb_path = os.path.join(image_dir, 'thumbs', filename)
                
                image_data = {
                    "url": f"/images/{property_id}/{filename}",
                    "thumbnail": f"/images/{property_id}/thumbs/{filename}" if os.path.exists(thumb_path) else f"/images/{property_id}/{filename}",
                    "alt": f"Property {property_id} image - {filename}",
                    "caption": ""
                }
                images.append(image_data)
        
        return images
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading images: {str(e)}")

@app.get("/")
async def root():
    """
    API status endpoint
    """
    return {
        "message": "Real Estate Slideshow API",
        "version": "1.0.0",
        "endpoints": {
            "properties": "/api/properties",
            "property": "/api/properties/{id}",
            "images": "/api/properties/{id}/images"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)