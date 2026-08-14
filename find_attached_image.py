import os
import glob
import shutil

brain_dir = "/Users/carlair/.gemini/antigravity/brain/6fcd06c4-9b2e-4677-bd27-bb4ae3751d8f"
target_asset = "/Users/carlair/.gemini/antigravity/scratch/laxou-production/assets/vendredis_etoiles_hero.jpg"

# Find all recent images in the conversation brain dir
image_files = glob.glob(os.path.join(brain_dir, "**", "*.jpg"), recursive=True) + \
              glob.glob(os.path.join(brain_dir, "**", "*.png"), recursive=True)

print("Found image files in brain dir:", image_files)

# Find the latest created image file
if image_files:
    latest_img = max(image_files, key=os.path.getmtime)
    print(f"Copying latest attachment {latest_img} -> {target_asset}")
    shutil.copy(latest_img, target_asset)
else:
    print("No image found in brain dir, checking alternative paths...")
