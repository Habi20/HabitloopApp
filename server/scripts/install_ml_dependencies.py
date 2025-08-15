
#!/usr/bin/env python3
"""
ML Dependencies Installer for HabitLoop
Installs required Python packages for enhanced ML functionality
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def check_package(package):
    """Check if a package is already installed"""
    try:
        __import__(package)
        print(f"✅ {package} is already installed")
        return True
    except ImportError:
        return False

def main():
    """Main installation function"""
    print("🔄 Installing ML dependencies for HabitLoop...")
    
    required_packages = [
        "pandas",
        "numpy", 
        "scikit-learn",
        "joblib"
    ]
    
    installed_count = 0
    
    for package in required_packages:
        package_name = package.split("==")[0]  # Handle version specifications
        
        if not check_package(package_name):
            if install_package(package):
                installed_count += 1
        else:
            installed_count += 1
    
    print(f"\n📊 Installation Summary:")
    print(f"✅ Successfully installed/verified: {installed_count}/{len(required_packages)} packages")
    
    if installed_count == len(required_packages):
        print("🎉 All ML dependencies are ready!")
        print("🔧 Enhanced Python ML models are now available")
        
        # Test imports
        try:
            import pandas as pd
            import numpy as np
            from sklearn.ensemble import RandomForestClassifier
            print("✅ All imports working correctly")
            return True
        except ImportError as e:
            print(f"❌ Import test failed: {e}")
            return False
    else:
        print("⚠️  Some packages failed to install")
        print("💡 TypeScript fallback will be used for ML operations")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
