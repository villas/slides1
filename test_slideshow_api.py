#!/usr/bin/env python3
"""
Test script for the new slideshow API
This shows how to call the build_slideshow_data endpoint
"""

import requests

def test_slideshow_api():
    """Test the new slideshow API endpoint"""

    # Sample slideshow list content
    slideshow_text = """# Slideshow Property List
6632 # 4 Bedroom Villa with Pool - Sales property
DD203 # Luxury Beachfront Villa - Rental property
Limited Offer! Next property is 15% off!;bgcolor:yellow;secs:4
VL954 # Countryside Villa - Rental property
6619 # 3 Bedroom Villa with Pool - Sales property"""

    # API endpoint
    api_url = "https://ivvdata.algarvevillaclub.com/datafeed/build_slideshow_data"

    try:
        # POST the text content to the API
        response = requests.post(api_url, data={'text_content': slideshow_text})

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            print(f"Found {result.get('count', 0)} items")

            # Show sample of returned data
            for i, item in enumerate(result.get('data', [])[:2]):  # Show first 2 items
                print(f"\nItem {i+1}:")
                print(f"  Type: {item.get('type')}")
                print(f"  Title: {item.get('title')}")
                print(f"  Reference: {item.get('reference', item.get('id'))}")
                if item.get('mainImage'):
                    print(f"  Image: {item['mainImage']}")
                if item.get('isMessage'):
                    print(f"  Background: {item.get('backgroundColor')}")
                    print(f"  Display Time: {item.get('displayTime')}ms")

        else:
            print(f"❌ API call failed: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_slideshow_api()