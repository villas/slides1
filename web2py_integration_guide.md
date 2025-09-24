# Web2Py Integration Guide

## Adding Slideshow Functions to ivvdata/datafeed.py

### 1. Add the Functions

Copy the functions from `datafeed_slideshow_functions.py` into your `applications/ivvdata/controllers/datafeed.py` file.

### 2. Required Imports

Make sure you have these imports at the top of your controller:

```python
import os
import json
from gluon import *
```

### 3. Database Access

The functions assume you have access to these database tables:
- `db.prop` - Property table
- `db.ptype` - Property type table

### 4. API Endpoint

The new endpoint will be available at:
```
POST https://ivvdata.algarvevillaclub.com/datafeed/build_slideshow_data
```

### 5. Request Format

Send POST requests with:
- **Parameter**: `text_content`
- **Value**: Content of your `slideshow-list.txt` file

### 6. Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "6632",
      "title": "4 Bedroom Villa with Pool",
      "price": "€750,000",
      "location": "Goncinha",
      "bedrooms": "4",
      "bathrooms": "3",
      "area": "6632",
      "type": "Villa",
      "description": "Beautiful villa in Goncinha...",
      "images": ["http://www.villas-vacations.com/pics/6632/1~6632_goncinha.jpg"],
      "mainImage": "http://www.villas-vacations.com/pics/6632/1~6632_goncinha.jpg",
      "pool": "Yes",
      "reference": "6632"
    }
  ],
  "count": 1
}
```

### 7. Error Handling

If a property is not found, it will be silently skipped. Check the web2py logs for any errors.

### 8. Testing

Use the `test_slideshow_api.py` script to test the endpoint before deploying.

### 9. Security

Since this is public data, no authentication is required. The endpoint only reads data and doesn't modify anything.

### 10. Performance

Consider adding caching to the `build_slideshow_data` function if it will be called frequently.