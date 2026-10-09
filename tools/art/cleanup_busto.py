#!/usr/bin/env python3
"""Cleanup busto.png:
1. Reconstruct natural white tunic drapery folds, eliminating sword inpaint smear.
2. Paint a natural, beautifully wrapped leather belt connecting into the buckle.
3. Remove red scarf bleed from collar and upper chest.
4. Smooth harsh polygonal boundaries with clean antialiased contours.
"""
import pathlib
import numpy as np
import cv2
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
ORIG_PATH = ROOT / "src/assets/art/characters/ferruccio.png"
BUSTO_PATH = ROOT / "src/assets/art/characters/ferruccio_cutout/busto.png"
BUSTO_BAK = ROOT / "src/assets/art/characters/ferruccio_cutout/busto.png.orig_bak"
OUT_PATH = BUSTO_PATH

def main():
    orig = np.array(Image.open(ORIG_PATH).convert("RGBA"))
    busto_bak = np.array(Image.open(BUSTO_BAK).convert("RGBA"))
    
    H, W = busto_bak.shape[:2] # 471, 255
    crop_orig = orig[310:781, 232:487].copy()
    
    # Start with busto_bak as baseline structure
    rgb = busto_bak[..., :3].astype(np.float32)
    alpha = busto_bak[..., 3].astype(np.float32)
    
    yy, xx = np.mgrid[0:H, 0:W]
    
    # -------------------------------------------------------------
    # 1. CLEAN RED SCARF BLEED ON COLLAR & UPPER CHEST (y < 190)
    # -------------------------------------------------------------
    r = rgb[..., 0]
    g = rgb[..., 1]
    b = rgb[..., 2]
    redness = r - np.maximum(g, b)
    is_upper = (yy < 190) & (alpha > 20)
    
    # Target all red/brown contaminated pixels in collar / upper chest
    red_bleed = is_upper & (
        (redness > 7) |
        ((redness > 3) & (r > 60) & (b < r * 0.84)) |
        ((r > 100) & (g < 90) & (b < 90))
    )
    
    # Dilate red bleed to catch semi-transparent fringe
    k_bleed = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    red_bleed_dilated = cv2.dilate(red_bleed.astype(np.uint8), k_bleed) > 0
    red_bleed_dilated &= is_upper
    
    # Replace bleed pixels by clean inpainting with surrounding white tunic cloth
    rgb_clean = np.clip(rgb, 0, 255).astype(np.uint8)
    inpaint_bleed = cv2.inpaint(rgb_clean, red_bleed_dilated.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA).astype(np.float32)
    rgb[red_bleed_dilated] = inpaint_bleed[red_bleed_dilated]
    
    # Ensure no lingering red tint in upper area
    r_up = rgb[..., 0]
    g_up = rgb[..., 1]
    b_up = rgb[..., 2]
    red_rem = is_upper & (r_up > np.maximum(g_up, b_up) + 4)
    if np.any(red_rem):
        # Desaturate slightly to match clean linen
        neutral = (g_up + b_up) * 0.5 + 4.0
        rgb[..., 0] = np.where(red_rem, neutral, rgb[..., 0])

    # -------------------------------------------------------------
    # 2. UPPER CHEST UNDER SLEEVE (y in 35..195, x in 95..235)
    # -------------------------------------------------------------
    # Replace synthetic repeated Hanning patches with clean painted drapery
    # In Ferruccio's tunic, folds hang vertically down into the waist.
    chest_mask = (yy >= 35) & (yy <= 194) & (xx >= 95) & (xx <= 230) & (alpha > 80)
    
    # Create clean fold ripples flowing down from collar/shoulders to belt
    for y_i in range(35, 195):
        t_y = (y_i - 35) / 160.0 # 0 at top, 1 at belt
        # Vertical fold wave (3-4 vertical drapery folds)
        fold_wave = (
            np.sin((xx[y_i] - 115) * 0.12) * 14.0 +
            np.cos((xx[y_i] - 148) * 0.08) * 10.0 +
            np.sin((xx[y_i] - 180) * 0.16) * 8.0
        ) * (0.65 + 0.35 * t_y)
        
        # Ambient shading:
        # Front chest (x < 160) is bright (~195-212)
        # Side underarm (x > 180) has soft ambient occlusion (~150-175)
        shade = np.clip(1.0 - 0.22 * np.maximum(0, (xx[y_i] - 165) / 50.0), 0.78, 1.0)
        
        target_lum = (196.0 * shade + fold_wave)
        target_rgb = np.stack([
            target_lum * 1.02, # warm ivory tint
            target_lum * 1.00,
            target_lum * 0.97
        ], axis=-1)
        
        row_mask = chest_mask[y_i]
        if np.any(row_mask):
            # Smooth out synthetic blocks by blending towards clean painted drapery
            # Keep fine grain by adding slight microtexture
            rng = np.random.default_rng(y_i * 313)
            grain = rng.normal(0, 1.5, (W, 3))
            blended = rgb[y_i, row_mask] * 0.25 + target_rgb[row_mask] * 0.75 + grain[row_mask]
            rgb[y_i, row_mask] = np.clip(blended, 70, 225)

    # -------------------------------------------------------------
    # 3. BELT: AUTHENTIC BUCKLE + HAND-PAINTED LEATHER STRAP
    # -------------------------------------------------------------
    # Belt spans from x=52 (left waist) to x=186 (buckle)
    # Belt y: 198 to 219 (height ~ 21 pixels)
    # First, restore authentic buckle and knot from crop_orig
    orig_rgb = crop_orig[..., :3].astype(np.float32)
    orig_a = crop_orig[..., 3].astype(np.float32)
    
    buckle_zone = (xx >= 185) & (xx <= 222) & (yy >= 195) & (yy <= 224) & (orig_a > 100)
    rgb[buckle_zone] = orig_rgb[buckle_zone]
    
    # Belt strap curve: slight anatomical dip (1.8 px droop in center)
    belt_center_y = 208.5 + np.sin((xx[0] - 52) / (187 - 52) * np.pi) * 1.8
    belt_half_h = 10.0
    
    for x_i in range(52, 188):
        cy = belt_center_y[x_i]
        for y_i in range(int(cy - belt_half_h - 4), int(cy + belt_half_h + 5)):
            if y_i < 0 or y_i >= H:
                continue
            if alpha[y_i, x_i] < 30:
                continue
            
            dy = (y_i - cy) / belt_half_h
            
            if -1.0 <= dy <= 1.0:
                # Inside leather strap
                light_x = 1.0 - 0.12 * ((x_i - 52) / 135.0)
                rng = np.random.default_rng(x_i * 997 + y_i * 13)
                grain = rng.uniform(-1.5, 1.5)
                
                if dy < -0.75:
                    # Top bevel highlight (overhead light)
                    t_bev = (dy + 1.0) / 0.25
                    col = np.array([68.0, 66.0, 71.0]) * (0.85 + 0.25 * t_bev) * light_x + grain
                elif dy > 0.75:
                    # Bottom bevel shadow / rim
                    t_bev = (1.0 - dy) / 0.25
                    col = np.array([21.0, 21.0, 23.0]) * (0.8 + 0.3 * t_bev) * light_x + grain
                else:
                    # Main leather strap body
                    convex = 1.0 - 0.45 * (dy + 0.2) ** 2
                    col = np.array([30.0, 29.0, 32.0]) * convex * light_x + grain
                
                rgb[y_i, x_i] = np.clip(col, 15, 110)
            
            elif -1.4 <= dy < -1.0:
                # Crease shadow above belt (blouse gathers into belt)
                t_crease = (dy + 1.4) / 0.4
                shadow = 0.64 + 0.36 * (1.0 - t_crease)
                rgb[y_i, x_i] = np.clip(rgb[y_i, x_i] * shadow, 40, 220)
            
            elif 1.0 < dy <= 1.4:
                # Cast shadow below belt onto skirt pleats
                t_shadow = (dy - 1.0) / 0.4
                shadow = 0.62 + 0.38 * t_shadow
                rgb[y_i, x_i] = np.clip(rgb[y_i, x_i] * shadow, 35, 215)

    # -------------------------------------------------------------
    # 4. SKIRT: RECONSTRUCT NATURAL VERTICAL DRAPERY (NO SMEARS!)
    # -------------------------------------------------------------
    # In crop_orig, the skirt has authentic cloth wherever it is NOT the sword, hand, or red scarf.
    # Where was the sword/hand?
    # Hand/grip: x in [80, 160], y in [285, 385]
    # Guard/blade: x in [140, 245], y in [340, 445]
    # Outside that area, crop_orig has authentic master-painted tunic!
    
    # Identify authentic clean cloth in crop_orig:
    skirt_area = (yy >= 223) & (alpha > 80)
    orig_lum = orig_rgb.mean(axis=2)
    orig_sat = orig_rgb.max(axis=2) - orig_rgb.min(axis=2)
    orig_red = (orig_rgb[..., 0] - np.maximum(orig_rgb[..., 1], orig_rgb[..., 2]) > 18)
    
    # Authentic cloth points: high opacity in orig, low saturation, bright (>120), not red scarf, not blade
    is_blade_or_hand = (
        ((orig_lum < 95) & (orig_a > 100)) |
        ((orig_lum < 140) & (orig_sat > 16) & (orig_rgb[..., 0] > orig_rgb[..., 2])) | # leather grip
        ((orig_lum < 135) & (xx >= 125) & (yy >= 310) & (yy <= 455)) # guard and blade
    ) & (xx >= 55) & ~orig_red
    
    # Expand slightly to cover anti-aliased edge of blade
    k_sword = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
    sword_mask = cv2.dilate(is_blade_or_hand.astype(np.uint8), k_sword) > 0
    sword_mask &= skirt_area & (xx >= 70)
    
    # Clean authentic cloth from crop_orig
    authentic_skirt = skirt_area & ~sword_mask & ~orig_red & (orig_lum > 115) & (xx >= 65)
    rgb[authentic_skirt] = orig_rgb[authentic_skirt]
    
    # Now, for the sword_mask region in the skirt:
    # Synthesize clean, natural vertical drapery folds!
    # Instead of Telea inward diffusion (which pulled in dark blade color),
    # we synthesize the vertical drapery folds using authentic fold profiles!
    
    # Let's inspect the fold columns:
    # Across x in [80, 245], there are ~6 vertical pleats:
    # Pleat crests at x ~ 85, 112, 138, 166, 195, 222
    # Pleat valleys at x ~ 98, 125, 152, 180, 208, 235
    for y_idx in range(223, 465):
        t_skirt = (y_idx - 223) / (465 - 223) # 0 at belt, 1 at hem
        flare = 1.0 + t_skirt * 0.12 # gentle downward flaring
        
        # 6 continuous drapery folds matching the rhythm of the authentic skirt
        fold_pattern = (
            np.sin((xx[y_idx] - 110) * 0.23 / flare) * 22.0 +
            np.sin((xx[y_idx] - 140) * 0.11 / flare) * 14.0 +
            np.cos((xx[y_idx] - 170) * 0.05 / flare) * 8.0
        )
        
        # Overall skirt lighting: front-right is lit (~195-212), rear is slightly shaded (~160-185)
        # Lighting gradient across x:
        x_light = np.clip(168.0 + 38.0 * ((xx[y_idx] - 70) / 165.0), 155.0, 206.0)
        
        # Vertical gradient: folds slightly deeper towards hem
        fold_amplitude = 0.85 + 0.35 * t_skirt
        
        # Target fold luminance:
        target_lum = np.clip(x_light + fold_pattern * fold_amplitude, 130.0, 216.0)
        
        # Warm ivory linen color tint:
        # R = 1.02, G = 1.00, B = 0.97
        target_rgb = np.stack([
            target_lum * 1.022,
            target_lum * 1.000,
            target_lum * 0.968
        ], axis=-1)
        
        row_mask = sword_mask[y_idx]
        if np.any(row_mask):
            rng = np.random.default_rng(y_idx * 419)
            grain = rng.normal(0, 1.8, (W, 3))
            rgb[y_idx, row_mask] = np.clip(target_rgb[row_mask] + grain[row_mask], 90, 225)
            
    # Soften transition boundaries of the sword_mask with bilateral blur
    k_feather = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    feather_mask = cv2.GaussianBlur(sword_mask.astype(np.float32), (0, 0), 3.0)[..., None]
    
    # Restore hemline double-stitching at bottom (y in 438..465)
    # In crop_orig, the hemline is authentic at x in [60, 175]
    # For x > 175, continue the clean stitched hem:
    curve = np.sin((xx[0] - 120) * 0.012) * 8.0
    for x_i in range(160, 246):
        if alpha[440, x_i] > 80:
            y_s1 = int(np.clip(443 + curve[x_i], 223, 465))
            y_s2 = int(np.clip(449 + curve[x_i], 223, 465))
            if sword_mask[y_s1, x_i]:
                # Stitch crease and highlight
                rgb[y_s1, x_i] = np.clip(rgb[y_s1, x_i] * 0.72, 50, 200)
                rgb[y_s1 - 1, x_i] = np.clip(rgb[y_s1 - 1, x_i] * 1.08, 70, 230)
            if sword_mask[y_s2, x_i]:
                rgb[y_s2, x_i] = np.clip(rgb[y_s2, x_i] * 0.68, 45, 190)
                rgb[y_s2 - 1, x_i] = np.clip(rgb[y_s2 - 1, x_i] * 1.06, 65, 225)

    # -------------------------------------------------------------
    # 5. SMOOTH SILHOUETTE CONTOURS AND ANTIALIASING
    # -------------------------------------------------------------
    # Clean the alpha mask to eliminate sharp polygon vertices:
    alpha_bin = (alpha > 40).astype(np.uint8)
    k_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    alpha_smooth = cv2.morphologyEx(alpha_bin, cv2.MORPH_CLOSE, k_close)
    k_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    alpha_smooth = cv2.morphologyEx(alpha_smooth, cv2.MORPH_OPEN, k_open)
    
    # 1.2px Gaussian edge feathering
    alpha_soft = cv2.GaussianBlur(alpha_smooth.astype(np.float32) * 255.0, (0, 0), 1.2)
    alpha_final = np.clip(np.minimum(255.0, alpha_soft * 1.45), 0, 255).astype(np.uint8)
    
    # Output final RGBA image
    rgb_final = np.clip(rgb, 0, 255).astype(np.uint8)
    out_img = np.dstack([rgb_final, alpha_final])
    
    Image.fromarray(out_img).save(OUT_PATH, optimize=True)
    print(f"Successfully saved clean busto to {OUT_PATH}")

if __name__ == "__main__":
    main()
