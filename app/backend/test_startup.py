#!/usr/bin/env python3
"""
Test script to verify FastAPI app startup
"""
import sys


def test_app_import():
    """Test if the app can be imported"""
    try:
        from app_fastapi import app

        print("✅ App imported successfully")
        return app
    except Exception as e:
        print(f"❌ Failed to import app: {e}")
        return None


def test_app_routes():
    """Test if the app has the expected routes"""
    try:
        app = test_app_import()
        if not app:
            return False

        # Check if routes exist
        routes = [route.path for route in app.routes]
        print(f"✅ App routes: {routes}")

        # Check for required routes
        required_routes = ["/", "/health"]
        for route in required_routes:
            if route in routes:
                print(f"✅ Route {route} found")
            else:
                print(f"❌ Route {route} missing")
                return False

        return True
    except Exception as e:
        print(f"❌ App routes test failed: {e}")
        return False


if __name__ == "__main__":
    print("Testing FastAPI app startup...")
    success = test_app_routes()
    if success:
        print("✅ All tests passed!")
        sys.exit(0)
    else:
        print("❌ Tests failed!")
        sys.exit(1)
