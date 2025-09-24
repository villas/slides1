# Web2Py Datafeed Controller Functions for Slideshow
# Add these functions to your ivvdata/datafeed.py controller
# Functions to build slideshow data from text file list

import os
import json
from gluon import *

def build_slideshow_data():
    """
    Main function to build complete slideshow data from text file
    POST the text file content to this endpoint
    """
    try:
        # Get text file content from POST request
        text_content = request.vars.text_content or request.body.read()

        if not text_content:
            return dict(error="No text content provided")

        # Parse the text file content
        slideshow_items = parse_slideshow_text(text_content)

        # Build complete data for each item
        complete_data = []
        for item in slideshow_items:
            try:
                if item['type'] == 'SALE':
                    property_data = get_sales_property_details(item['ref'])
                    if property_data:
                        complete_data.append(property_data)
                    # Silently skip if property not found

                elif item['type'] == 'RENT':
                    property_data = get_rental_property_details(item['ref'])
                    if property_data:
                        complete_data.append(property_data)
                    # Silently skip if property not found

                elif item['type'] == 'MSG':
                    message_data = {
                        'id': f"msg-{len(complete_data)}",
                        'title': item['message'],
                        'price': '',
                        'location': '',
                        'bedrooms': '',
                        'bathrooms': '',
                        'area': '',
                        'type': 'Message',
                        'description': item['message'],
                        'images': [],
                        'mainImage': '',
                        'isMessage': True,
                        'backgroundColor': item.get('bgcolor', ''),
                        'displayTime': item.get('secs', 4000)
                    }
                    complete_data.append(message_data)

            except Exception as e:
                # Log error but continue processing other items
                logger.error(f"Error processing item {item}: {str(e)}")
                continue

        return dict(
            success=True,
            data=complete_data,
            count=len(complete_data)
        )

    except Exception as e:
        logger.error(f"Error in build_slideshow_data: {str(e)}")
        return dict(
            success=False,
            error=str(e),
            data=[]
        )

def parse_slideshow_text(text_content):
    """
    Parse the slideshow text file content into structured data
    """
    lines = text_content.split('\n')
    parsed_items = []

    for line in lines:
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        # Parse line: content # comment
        parts = line.split('#', 1)
        content = parts[0].strip()
        comment = parts[1].strip() if len(parts) > 1 else ''

        # Check if it's a message (contains bgcolor or secs)
        if ';bgcolor:' in content or ';secs:' in content:
            # Parse message parameters
            text_parts = content.split(';')
            message = text_parts[0].strip()
            bgcolor = ''
            secs = 4

            for param in text_parts[1:]:
                param = param.strip()
                if param.startswith('bgcolor:'):
                    bgcolor = param.split(':', 1)[1]
                elif param.startswith('secs:'):
                    try:
                        secs = int(param.split(':', 1)[1])
                    except:
                        secs = 4

            parsed_items.append({
                'type': 'MSG',
                'message': message,
                'bgcolor': bgcolor,
                'secs': secs * 1000,  # Convert to milliseconds
                'comment': comment
            })

        else:
            # Property reference
            ref = content.strip()
            if ref.isdigit():
                # Numeric = sales property
                parsed_items.append({
                    'type': 'SALE',
                    'ref': ref,
                    'comment': comment
                })
            else:
                # Alphanumeric = rental property
                parsed_items.append({
                    'type': 'RENT',
                    'ref': ref,
                    'comment': comment
                })

    return parsed_items

def get_sales_property_details(prop_id):
    """
    Get detailed information for a sales property
    Based on your existing prophtml function
    """
    try:
        # Query your property database
        # This is based on your existing prophtml function logic
        prop = db.prop(db.prop.id == prop_id)
        if not prop:
            return None

        # Get property type description
        ptype = db.ptype(db.ptype.ptype_ref == prop.ptype_ref)
        type_desc = ptype.descr if ptype else 'Property'

        # Build image gallery
        images = []
        main_image = ''

        # Check for image gallery (similar to your existing logic)
        if hasattr(prop, 'imagegallery') and prop.imagegallery:
            try:
                gallery = json.loads(prop.imagegallery) if isinstance(prop.imagegallery, str) else prop.imagegallery
                if isinstance(gallery, list) and gallery:
                    # Convert image paths to use pics/ instead of pics_lg/
                    images = [img.replace('pics_lg', 'pics') for img in gallery]
                    main_image = images[0] if images else ''
            except:
                pass

        # If no gallery, try single image field
        if not main_image and hasattr(prop, 'image') and prop.image:
            main_image = prop.image.replace('pics_lg', 'pics')
            images = [main_image]

        # Build property data
        property_data = {
            'id': str(prop.propcode or prop.id),
            'title': prop.pname or 'Untitled Property',
            'price': format_price(prop.price),
            'location': prop.area_name or prop.areaname or 'Location not specified',
            'bedrooms': str(prop.bedrooms or ''),
            'bathrooms': str(prop.bathrooms or ''),
            'area': str(prop.propcode or prop.id),
            'type': type_desc,
            'description': prop.descr or prop.descrlong or prop.descrshort or 'No description available.',
            'images': images,
            'mainImage': main_image,
            'pool': 'Yes' if prop.pool else 'No',
            'reference': str(prop.propcode or prop.id)
        }

        return property_data

    except Exception as e:
        logger.error(f"Error getting sales property {prop_id}: {str(e)}")
        return None

def get_rental_property_details(prop_ref):
    """
    Get detailed information for a rental property
    Based on emailer/controllers/default.py renthtml function
    """
    try:
        # Query rental property database
        # Based on your renthtml function logic
        rental = db(db.prop.prop_ref == prop_ref).select().first()
        if not rental:
            return None

        # Get property type
        ptype = db.ptype(db.ptype.ptype_ref == rental.ptype_ref)
        type_desc = ptype.descr if ptype else 'Rental'

        # Build rental-specific data
        # Based on your renthtml function fields
        rental_data = {
            'id': rental.prop_ref,
            'title': rental.pname or f'Rental Property {rental.prop_ref}',
            'price': format_rental_price(rental.rprice, rental.rcurrency or 'EUR'),
            'location': rental.area_name or rental.areaname or 'Algarve',
            'bedrooms': str(rental.rbeds or rental.bedrooms or ''),
            'bathrooms': '',  # Rental DB may not have bathroom count
            'area': rental.prop_ref,
            'type': type_desc,
            'description': rental.rdescr_en or rental.descr or 'No description available.',
            'images': [],  # Rental images might be stored differently
            'mainImage': '',
            'pool': 'Resort Pool' if rental.pool else 'No',
            'reference': rental.prop_ref,
            'isRental': True,
            'sleeps': str(rental.rcomm_max or ''),
            'duration': '7 nights'  # Default assumption
        }

        # Try to get rental images if available
        if hasattr(rental, 'rimage') and rental.rimage:
            rental_data['mainImage'] = rental.rimage
            rental_data['images'] = [rental.rimage]

        return rental_data

    except Exception as e:
        logger.error(f"Error getting rental property {prop_ref}: {str(e)}")
        return None

def format_price(price):
    """Format price for display"""
    if not price:
        return 'Price on request'

    try:
        # Assume EUR currency
        return f"€{int(price):,}"
    except:
        return str(price)

def format_rental_price(price, currency='EUR'):
    """Format rental price for display"""
    if not price:
        return 'Price on request'

    try:
        currency_symbol = '€' if currency == 'EUR' else '£' if currency == 'GBP' else '$'
        return f"{currency_symbol}{int(price):,} (for 7 nights)"
    except:
        return str(price)

# Example usage:
# POST to /ivvdata/datafeed/build_slideshow_data with text_content parameter
# containing the slideshow-list.txt content