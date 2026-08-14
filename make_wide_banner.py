from PIL import Image, ImageFilter
import os

input_path = "/Users/carlair/.gemini/antigravity/scratch/laxou-production/assets/logo_laxou_official_18.jpg"
output_path = "/Users/carlair/.gemini/antigravity/scratch/laxou-production/assets/vendredis_banner_wide.jpg"

if os.path.exists(input_path):
    img = Image.open(input_path).convert("RGB")
    w, h = img.size
    print(f"Original image size: {w}x{h}")

    # Create a 16:6 widescreen canvas (1920x600)
    target_w, target_h = 1920, 560
    
    # Create background by extending border color or blurred version of img
    bg = img.resize((target_w, target_h)).filter(ImageFilter.GaussianBlur(30))
    
    # Place original centered and scaled to fit height nicely
    scale_factor = target_h / h
    new_w = int(w * scale_factor)
    scaled_img = img.resize((new_w, target_h), Image.Resampling.LANCZOS)
    
    paste_x = (target_w - new_w) // 2
    bg.paste(scaled_img, (paste_x, 0))
    
    bg.save(output_path, quality=95)
    print(f"Saved wide banner to {output_path}")
else:
    print(f"File {input_path} not found.")
