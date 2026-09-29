import os
import sys
import math
import random
import time
import shutil
import numpy as np
import cv2

# Set random seed for deterministic rock walls
random.seed(42)
np.random.seed(42)

WIDTH = 1280
HEIGHT = 720
FPS = 30
DURATION_SEC = 45  # 45 seconds comprehensive exploration
TOTAL_FRAMES = FPS * DURATION_SEC

# Authentic ROS RViz SLAM Palette (BGR format)
COLOR_UNEXPLORED_BGR = (108, 116, 120)  # Slate grey #5b6569 (ROS standard unmapped space)
COLOR_FREE_BGR = (252, 252, 254)        # Free space white #fcfcfe
COLOR_WALL_BGR = (12, 14, 18)           # Occupied rock wall black #0c0e12
COLOR_PATH_BGR = (0, 235, 80)           # Fluorescent green odometry path #00eb50
COLOR_PATH_GLOW_BGR = (80, 250, 140)    # Soft path glow
COLOR_RAY_BEAM_BGR = (225, 235, 245)    # Subtle laser scan lines

print(f"Generating Ultra-Realistic 2D SLAM Video: {WIDTH}x{HEIGHT} @ {FPS}fps, {TOTAL_FRAMES} frames ({DURATION_SEC}s)")

# -----------------------------------------------------------------------------
# 1. SUBTERRANEAN MINE MAPPING GEOMETRY
# -----------------------------------------------------------------------------
def make_jagged_line(p1, p2, rough=2.6, seg_len=10):
    """Subdivides a line into realistic jagged rock segments with natural fractures."""
    x1, y1 = p1
    x2, y2 = p2
    dist = math.hypot(x2 - x1, y2 - y1)
    if dist < 4:
        return [p1, p2]
    
    num_segs = max(1, int(dist / seg_len))
    dx = (x2 - x1) / num_segs
    dy = (y2 - y1) / num_segs
    
    nx = -dy / (math.hypot(dx, dy) + 1e-6)
    ny = dx / (math.hypot(dx, dy) + 1e-6)
    
    points = [p1]
    for i in range(1, num_segs):
        px = x1 + i * dx
        py = y1 + i * dy
        jitter = random.uniform(-rough, rough)
        points.append((px + nx * jitter, py + ny * jitter))
    points.append(p2)
    return points

# Blueprints for realistic underground mine network
corridor_main_top = [(80, 315), (340, 315)]
corridor_main_bot = [(80, 415), (340, 415)]

junction_nw = [(340, 315), (340, 230), (430, 230)]
junction_ne = [(530, 230), (620, 230), (620, 315)]
junction_se = [(620, 415), (620, 490), (530, 490)]
junction_sw = [(430, 490), (340, 490), (340, 415)]

north_drift_w = [(430, 230), (430, 150), (330, 150), (330, 60)]
north_drift_top = [(330, 60), (640, 60)]
north_drift_e = [(640, 60), (640, 150), (530, 150), (530, 230)]

east_crosscut_top = [(620, 315), (860, 315), (860, 220), (1180, 220)]
east_chamber_right = [(1180, 220), (1180, 500)]
east_chamber_bot = [(1180, 500), (860, 500), (860, 415), (620, 415)]

south_loop_top = [(530, 490), (530, 570), (780, 570), (860, 500)]
south_loop_bot = [(430, 490), (430, 660), (860, 660), (920, 570), (920, 500)]

west_collapse_top = [(340, 415), (210, 520), (130, 590)]
west_collapse_end = [(130, 590), (170, 660)]
west_collapse_bot = [(170, 660), (290, 600), (340, 490)]

portal_gate = [(80, 315), (60, 315), (60, 415), (80, 415)]

# Rock Pillars & Internal Rubble Formations
pillar_central = [(455, 340), (505, 340), (505, 390), (455, 390), (455, 340)]
pillar_north = [(460, 90), (510, 90), (510, 120), (460, 120), (460, 90)]
pillar_east = [(970, 320), (1050, 320), (1050, 400), (970, 400), (970, 320)]
debris_pile_west = [(210, 550), (250, 560), (240, 605), (200, 595), (210, 550)]
debris_rock_2 = [(165, 610), (185, 615), (180, 635), (160, 630), (165, 610)]

blueprint_lines = [
    corridor_main_top,
    corridor_main_bot,
    junction_nw,
    junction_ne,
    junction_se,
    junction_sw,
    north_drift_w,
    north_drift_top,
    north_drift_e,
    east_crosscut_top,
    east_chamber_right,
    east_chamber_bot,
    south_loop_top,
    south_loop_bot,
    west_collapse_top,
    west_collapse_end,
    west_collapse_bot,
    portal_gate,
    pillar_central,
    pillar_north,
    pillar_east,
    debris_pile_west,
    debris_rock_2
]

wall_segments = []
for poly in blueprint_lines:
    for i in range(len(poly) - 1):
        pts = make_jagged_line(poly[i], poly[i+1], rough=2.4, seg_len=10)
        for j in range(len(pts) - 1):
            wall_segments.append((pts[j], pts[j+1]))

print(f"Generated {len(wall_segments)} rock wall segments.")

# Spatial Grid for Fast Raycasting
GRID_SIZE = 80
spatial_grid = {}
for seg in wall_segments:
    (x1, y1), (x2, y2) = seg
    min_gx = max(0, int(min(x1, x2) / GRID_SIZE))
    max_gx = min(WIDTH // GRID_SIZE, int(max(x1, x2) / GRID_SIZE))
    min_gy = max(0, int(min(y1, y2) / GRID_SIZE))
    max_gy = min(HEIGHT // GRID_SIZE, int(max(y1, y2) / GRID_SIZE))
    
    for gx in range(min_gx, max_gx + 1):
        for gy in range(min_gy, max_gy + 1):
            key = (gx, gy)
            if key not in spatial_grid:
                spatial_grid[key] = []
            spatial_grid[key].append(seg)

def ray_segment_intersect(ox, oy, dx, dy, max_range, p1, p2):
    x1, y1 = p1
    x2, y2 = p2
    vx = x2 - x1
    vy = y2 - y1
    det = dx * vy - dy * vx
    if abs(det) < 1e-7:
        return None
    t = ((x1 - ox) * vy - (y1 - oy) * vx) / det
    u = ((x1 - ox) * dy - (y1 - oy) * dx) / det
    if t > 0.01 and t <= max_range and 0.0 <= u <= 1.0:
        return t
    return None

def cast_lidar_ray(ox, oy, angle, max_range=330):
    dx = math.cos(angle)
    dy = math.sin(angle)
    closest_t = max_range
    hit = False
    
    min_x = min(ox, ox + dx * max_range)
    max_x = max(ox, ox + dx * max_range)
    min_y = min(oy, oy + dy * max_range)
    max_y = max(oy, oy + dy * max_range)
    
    min_gx = max(0, int(min_x / GRID_SIZE))
    max_gx = min(WIDTH // GRID_SIZE, int(max_x / GRID_SIZE))
    min_gy = max(0, int(min_y / GRID_SIZE))
    max_gy = min(HEIGHT // GRID_SIZE, int(max_y / GRID_SIZE))
    
    checked = set()
    for gx in range(min_gx, max_gx + 1):
        for gy in range(min_gy, max_gy + 1):
            segs = spatial_grid.get((gx, gy), [])
            for s in segs:
                s_id = id(s)
                if s_id in checked:
                    continue
                checked.add(s_id)
                t = ray_segment_intersect(ox, oy, dx, dy, closest_t, s[0], s[1])
                if t is not None and t < closest_t:
                    closest_t = t
                    hit = True
                    
    hx = ox + dx * closest_t
    hy = oy + dy * closest_t
    return hx, hy, closest_t, hit

# -----------------------------------------------------------------------------
# 2. FLIGHT TRAJECTORY (Smooth Spline Interpolation)
# -----------------------------------------------------------------------------
path_waypoints = [
    (110, 365),    # 0: Portal entry
    (230, 365),    # 1: Down Main Haulage Drift
    (370, 365),    # 2: Arrive at Central Junction
    (410, 340),    # 3: Angle North
    (480, 240),    # 4: North Crosscut
    (480, 150),    # 5: Enter North Stope Room
    (380, 105),    # 6: Scan West side of North Stope (Survivor #1 zone)
    (580, 105),    # 7: Scan East side of North Stope
    (550, 170),    # 8: Exit North Stope
    (500, 250),    # 9: Return to North Crosscut
    (560, 340),    # 10: Central Junction East drift
    (680, 365),    # 11: East Crosscut
    (820, 365),    # 12: Approach Refuge Chamber
    (960, 280),    # 13: Enter Refuge Chamber Bay B
    (1100, 290),   # 14: Scan deep corner
    (1110, 430),   # 15: Scan Refuge survival capsule (Survivor #3 zone)
    (990, 450),    # 16: South alcove of Refuge Chamber
    (860, 460),    # 17: Exit Refuge Chamber into South Loop
    (740, 530),    # 18: South Return Haulage Drift
    (580, 610),    # 19: Mid South Loop
    (460, 550),    # 20: Approach West junction
    (380, 435),    # 21: Loop Closure back at Central Hub
    (270, 490),    # 22: Enter West Collapse Zone
    (195, 570),    # 23: Inspect Rock Collapse Debris (Survivor #2 zone)
    (160, 615),    # 24: Deepest reach of Collapse Drift
    (220, 550),    # 25: Pull back slightly to stable hover
    (240, 530)     # 26: Final mapping completed hover
]

def catmull_rom_spline(pts, num_samples=TOTAL_FRAMES):
    extended = [pts[0]] + pts + [pts[-1]]
    total_pts = []
    segments = len(pts) - 1
    samples_per_seg = num_samples / segments
    
    for i in range(1, len(extended) - 2):
        p0 = extended[i - 1]
        p1 = extended[i]
        p2 = extended[i + 1]
        p3 = extended[i + 2]
        
        num_steps = int((i) * samples_per_seg) - int((i - 1) * samples_per_seg)
        for s in range(num_steps):
            t = s / float(max(1, num_steps))
            t2 = t * t
            t3 = t2 * t
            
            x = 0.5 * ((2 * p1[0]) +
                       (-p0[0] + p2[0]) * t +
                       (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                       (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            
            y = 0.5 * ((2 * p1[1]) +
                       (-p0[1] + p2[1]) * t +
                       (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                       (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            total_pts.append((x, y))
            
    while len(total_pts) < num_samples:
        total_pts.append(pts[-1])
    return total_pts[:num_samples]

flight_path = catmull_rom_spline(path_waypoints, TOTAL_FRAMES)

# -----------------------------------------------------------------------------
# 3. DRONE SPRITE RENDERER (Image 5 Quadcopter + ROS TF Coordinate Axes)
# -----------------------------------------------------------------------------
def draw_drone_sprite(canvas, x, y, yaw, prop_angle, scale=1.15):
    body_length = 26 * scale
    body_width = 16 * scale
    arm_span = 28 * scale
    motor_radius = 4.0 * scale
    prop_length = 16 * scale
    
    cos_y = math.cos(yaw)
    sin_y = math.sin(yaw)
    
    def local_to_global(lx, ly):
        gx = x + (lx * cos_y - ly * sin_y)
        gy = y + (lx * sin_y + ly * cos_y)
        return int(round(gx)), int(round(gy))
    
    # 1. ROS TF Coordinate Triad (from Image 1)
    # Red Arrow = +X (Forward)
    fx, fy = local_to_global(body_length * 1.6, 0)
    cv2.arrowedLine(canvas, (int(x), int(y)), (fx, fy), (0, 0, 240), 2, tipLength=0.25, line_type=cv2.LINE_AA)
    
    # Green Arrow = +Y (Left)
    lx, ly = local_to_global(0, -body_width * 1.7)
    cv2.arrowedLine(canvas, (int(x), int(y)), (lx, ly), (0, 220, 0), 2, tipLength=0.25, line_type=cv2.LINE_AA)
    
    # Blue Dot = +Z (Center)
    cv2.circle(canvas, (int(x), int(y)), 3, (240, 60, 60), -1, lineType=cv2.LINE_AA)
    
    # 2. 4 Curved Structural Arms (Image 5 Quadcopter Arms)
    arm_offsets = [
        (arm_span * 0.75, -arm_span * 0.75),   # Front-Left
        (arm_span * 0.75, arm_span * 0.75),    # Front-Right
        (-arm_span * 0.75, -arm_span * 0.75),  # Rear-Left
        (-arm_span * 0.75, arm_span * 0.75)    # Rear-Right
    ]
    
    for ax, ay in arm_offsets:
        p_root = local_to_global(ax * 0.3, ay * 0.3)
        p_motor = local_to_global(ax, ay)
        
        # Carbon arm tube
        cv2.line(canvas, p_root, p_motor, (15, 18, 22), int(4.5 * scale), cv2.LINE_AA)
        cv2.line(canvas, p_root, p_motor, (65, 75, 90), int(2.0 * scale), cv2.LINE_AA)
        
        # Motor Hub
        cv2.circle(canvas, p_motor, int(motor_radius), (12, 14, 18), -1, cv2.LINE_AA)
        cv2.circle(canvas, p_motor, int(motor_radius * 0.6), (190, 200, 210), -1, cv2.LINE_AA)
        
        # Propeller Blur Disk
        overlay = canvas.copy()
        cv2.circle(overlay, p_motor, int(prop_length), (210, 220, 230), -1, cv2.LINE_AA)
        cv2.addWeighted(overlay, 0.22, canvas, 0.78, 0, canvas)
        
        # Rotating Dual-Blade Propellers (High RPM)
        p_angle = prop_angle + (math.pi / 2 if (ax * ay > 0) else 0)
        pdx = math.cos(p_angle) * prop_length
        pdy = math.sin(p_angle) * prop_length
        tip1 = (int(p_motor[0] + pdx), int(p_motor[1] + pdy))
        tip2 = (int(p_motor[0] - pdx), int(p_motor[1] - pdy))
        cv2.line(canvas, tip1, tip2, (18, 22, 28), int(2.8 * scale), cv2.LINE_AA)
        cv2.circle(canvas, tip1, int(1.5 * scale), (245, 245, 250), -1, cv2.LINE_AA)
        cv2.circle(canvas, tip2, int(1.5 * scale), (245, 245, 250), -1, cv2.LINE_AA)
        
    # 3. Streamlined Aerodynamic Fuselage (Image 5 silhouette)
    body_pts = [
        local_to_global(body_length * 0.85, 0),                       # Nose tip
        local_to_global(body_length * 0.6, -body_width * 0.45),       # Front-Left shoulder
        local_to_global(0, -body_width * 0.55),                       # Mid-Left waist
        local_to_global(-body_length * 0.7, -body_width * 0.4),      # Rear-Left hip
        local_to_global(-body_length * 0.85, 0),                      # Tail tip
        local_to_global(-body_length * 0.7, body_width * 0.4),       # Rear-Right hip
        local_to_global(0, body_width * 0.55),                        # Mid-Right waist
        local_to_global(body_length * 0.6, body_width * 0.45)        # Front-Right shoulder
    ]
    body_poly = np.array(body_pts, dtype=np.int32)
    cv2.fillPoly(canvas, [body_poly], (16, 20, 25), cv2.LINE_AA)
    cv2.polylines(canvas, [body_poly], True, (80, 95, 110), int(1.5 * scale), cv2.LINE_AA)
    
    # 4. Front Optical Gimbal Camera & Laser Turret
    nose_cam_p1 = local_to_global(body_length * 0.85, -body_width * 0.22)
    nose_cam_p2 = local_to_global(body_length * 1.18, 0)
    nose_cam_p3 = local_to_global(body_length * 0.85, body_width * 0.22)
    cv2.fillPoly(canvas, [np.array([nose_cam_p1, nose_cam_p2, nose_cam_p3], dtype=np.int32)], (10, 12, 16), cv2.LINE_AA)
    cv2.circle(canvas, nose_cam_p2, int(2.5 * scale), (245, 190, 50), -1, cv2.LINE_AA) # Lens optical coating
    
    # Top LiDAR Turret (Pulsing Cyan Ring)
    cv2.circle(canvas, (int(x), int(y)), int(5.0 * scale), (25, 30, 40), -1, cv2.LINE_AA)
    cv2.circle(canvas, (int(x), int(y)), int(2.8 * scale), (245, 210, 30), -1, cv2.LINE_AA)
    
    # 5. Strobe Navigation LEDs
    strobe_r = local_to_global(arm_span * 0.75, arm_span * 0.75)
    cv2.circle(canvas, strobe_r, int(2.5 * scale), (0, 255, 100), -1, cv2.LINE_AA)
    strobe_l = local_to_global(arm_span * 0.75, -arm_span * 0.75)
    cv2.circle(canvas, strobe_l, int(2.5 * scale), (0, 0, 255), -1, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# 4. MASTER RENDERING LOOP WITH RAYCASTING & OCCUPANCY ACCUMULATION
# -----------------------------------------------------------------------------
free_mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
wall_mask = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
history_path = []

raw_video_path = "upthrust_lidar_raw.mp4"
final_video_path = "upthrust_lidar.mp4"

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(raw_video_path, fourcc, FPS, (WIDTH, HEIGHT))

start_time = time.time()
print("Starting frame generation...")

# Pre-render subtle coordinate grid background
grid_bg = np.full((HEIGHT, WIDTH, 3), COLOR_UNEXPLORED_BGR, dtype=np.uint8)
for gx in range(40, WIDTH, 80):
    for gy in range(40, HEIGHT, 80):
        cv2.drawMarker(grid_bg, (gx, gy), (122, 130, 135), cv2.MARKER_CROSS, 6, 1)

for frame_idx in range(TOTAL_FRAMES):
    px, py = flight_path[frame_idx]
    history_path.append((px, py))
    
    # Yaw angle from trajectory direction
    if frame_idx < TOTAL_FRAMES - 1:
        npx, npy = flight_path[frame_idx + 1]
        raw_yaw = math.atan2(npy - py, npx - px)
    else:
        ppx, ppy = flight_path[frame_idx - 1]
        raw_yaw = math.atan2(py - ppy, px - ppx)
    yaw = raw_yaw
    
    prop_angle = (frame_idx * 1.8) % (2 * math.pi)
    
    # -------------------------------------------------------------------------
    # A. 720-Ray RPLiDAR Sweep & High-Density Raycasting
    # -------------------------------------------------------------------------
    NUM_RAYS = 540
    scan_poly_pts = []
    ray_hits = []
    ray_fan_lines = []
    
    for r in range(NUM_RAYS):
        angle = r * (2 * math.pi / NUM_RAYS)
        hx, hy, dist, did_hit = cast_lidar_ray(px, py, angle, max_range=320)
        scan_poly_pts.append((int(round(hx)), int(round(hy))))
        
        if did_hit:
            ray_hits.append((hx, hy))
            # Dense radial ray scan lines (Image 1 style)
            if r % 2 == 0:
                ray_fan_lines.append(((int(px), int(py)), (int(hx), int(hy))))
        else:
            # Frontier open beam lines
            if r % 3 == 0:
                ray_fan_lines.append(((int(px), int(py)), (int(hx), int(hy))))
                
    # Update Free Space Mask with Current Scan Polygon
    scan_poly_arr = np.array(scan_poly_pts, dtype=np.int32)
    cv2.fillPoly(free_mask, [scan_poly_arr], 255)
    
    # Update Wall Mask with Hit Points (realistic laser beam scatter & rock roughness)
    for hx, hy in ray_hits:
        ix, iy = int(round(hx)), int(round(hy))
        if 0 <= ix < WIDTH and 0 <= iy < HEIGHT:
            cv2.circle(wall_mask, (ix, iy), 2, 255, -1)
            if random.random() < 0.35:
                jx = ix + random.randint(-1, 1)
                jy = iy + random.randint(-1, 1)
                if 0 <= jx < WIDTH and 0 <= jy < HEIGHT:
                    wall_mask[jy, jx] = 255

    # -------------------------------------------------------------------------
    # B. Frame Assembly (Grey Canvas + Free Space White + Radial Laser Lines + Black Walls)
    # -------------------------------------------------------------------------
    frame = grid_bg.copy()
    
    # Apply Free Space (White)
    frame[free_mask == 255] = COLOR_FREE_BGR
    
    # Render LiDAR Raycasting Fan Lines (Authentic ROS SLAM Spoke Artifacts as in Image 1)
    ray_layer = frame.copy()
    for p_start, p_end in ray_fan_lines:
        cv2.line(ray_layer, p_start, p_end, (210, 222, 230), 1, cv2.LINE_AA)
    cv2.addWeighted(ray_layer, 0.40, frame, 0.60, 0, frame)
    
    # Apply Solid Black Obstacle Walls
    frame[wall_mask == 255] = COLOR_WALL_BGR
    
    # -------------------------------------------------------------------------
    # C. Odometry Trajectory Trail (Glowing Green Ribbon from Image 1)
    # -------------------------------------------------------------------------
    if len(history_path) > 1:
        path_pts = np.array([(int(round(x)), int(round(y))) for x, y in history_path], dtype=np.int32)
        
        # Soft outer glow
        path_glow = frame.copy()
        cv2.polylines(path_glow, [path_pts], False, COLOR_PATH_GLOW_BGR, 4, cv2.LINE_AA)
        cv2.addWeighted(path_glow, 0.45, frame, 0.55, 0, frame)
        
        # Sharp green ribbon line
        cv2.polylines(frame, [path_pts], False, COLOR_PATH_BGR, 2, cv2.LINE_AA)
        
        # Historical Waypoint Nodes
        for idx_step in range(0, len(history_path), 40):
            wx, wy = history_path[idx_step]
            cv2.circle(frame, (int(wx), int(wy)), 3, (0, 180, 50), -1, cv2.LINE_AA)
            cv2.circle(frame, (int(wx), int(wy)), 1, (255, 255, 255), -1, cv2.LINE_AA)

    # -------------------------------------------------------------------------
    # D. Tactical Mine Annotation & Discovery Markers (Uncovered in Free Space)
    # -------------------------------------------------------------------------
    # 1. Portal Delta-7
    if free_mask[365, 140] == 255:
        cv2.putText(frame, "[PORTAL DELTA-7]", (100, 295), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (80, 90, 100), 1, cv2.LINE_AA)
        
    # 2. Main Haulage Drift
    if free_mask[365, 240] == 255:
        cv2.putText(frame, "MAIN HAULAGE DRIFT", (190, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (120, 130, 140), 1, cv2.LINE_AA)
        
    # 3. Central Junction
    if free_mask[365, 420] == 255:
        cv2.putText(frame, "CENTRAL JUNCTION #1", (360, 265), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (90, 100, 115), 1, cv2.LINE_AA)
        
    # 4. North Stope Room & Survivor #1 Discovery Marker
    if free_mask[110, 420] == 255:
        cv2.putText(frame, "NORTH DRIFT #2 [SECTOR DELTA]", (350, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (60, 70, 80), 1, cv2.LINE_AA)
        sx1, sy1 = 380, 108
        pulse = 0.5 + 0.5 * math.sin(frame_idx * 0.18)
        cv2.drawMarker(frame, (sx1, sy1), (0, 200, 50), cv2.MARKER_DIAMOND, int(16 + 4 * pulse), 2)
        cv2.putText(frame, "SURV-01 [VITALS STABLE]", (sx1 + 14, sy1 + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 160, 30), 1, cv2.LINE_AA)

    # 5. Refuge Chamber Bay B & Survivor #3 Marker
    if free_mask[350, 920] == 255:
        cv2.putText(frame, "REFUGE CHAMBER BAY B", (900, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.44, (40, 50, 60), 1, cv2.LINE_AA)
        cv2.putText(frame, "SURVIVOR REFUGE CAPSULE [O2 NORMAL]", (870, 475), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (180, 120, 20), 1, cv2.LINE_AA)
        sx3, sy3 = 1110, 430
        cv2.drawMarker(frame, (sx3, sy3), (220, 140, 0), cv2.MARKER_SQUARE, 14, 2)
        cv2.putText(frame, "SURV-03 [HELMET BEACON]", (sx3 - 165, sy3 + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (200, 120, 0), 1, cv2.LINE_AA)

    # 6. West Collapse Zone & Survivor #2 (Trapped Rubble) Marker
    if free_mask[550, 210] == 255:
        cv2.putText(frame, "CROSSCUT #1 [COLLAPSE ZONE]", (120, 535), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (40, 40, 180), 1, cv2.LINE_AA)
        sx2, sy2 = 195, 570
        pulse2 = 0.5 + 0.5 * math.sin(frame_idx * 0.22)
        cv2.drawMarker(frame, (sx2, sy2), (0, 40, 240), cv2.MARKER_TILTED_CROSS, int(16 + 4 * pulse2), 2)
        cv2.putText(frame, "SURV-02 [TRAPPED RUBBLE]", (sx2 - 10, sy2 + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 30, 220), 1, cv2.LINE_AA)

    # 7. Methane Gas Zone Pulse in Junction North
    if free_mask[250, 480] == 255:
        gx, gy = 480, 250
        g_rad = int(34 + 4 * math.sin(frame_idx * 0.12))
        gas_overlay = frame.copy()
        cv2.circle(gas_overlay, (gx, gy), g_rad, (0, 180, 255), 1, cv2.LINE_AA)
        cv2.putText(gas_overlay, "CH4 POCKET 3.8% LEL", (gx - 55, gy - g_rad - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (0, 140, 220), 1, cv2.LINE_AA)
        cv2.addWeighted(gas_overlay, 0.7, frame, 0.3, 0, frame)

    # -------------------------------------------------------------------------
    # E. Render Drone Sprite (Exact Image 5 Quadcopter Silhouette + Yaw Heading)
    # -------------------------------------------------------------------------
    draw_drone_sprite(frame, px, py, yaw, prop_angle, scale=1.15)
    
    # -------------------------------------------------------------------------
    # F. Subtle HUD Info Header & Telemetry Watermark
    # -------------------------------------------------------------------------
    cv2.putText(frame, "RPLiDAR 2D SLAM  |  OCCUPANCY GRID RESOLUTION: 0.05m  |  ROS 2 CARTOGRAPHER", (25, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.42, (20, 25, 30), 1, cv2.LINE_AA)
    
    cv2.line(frame, (25, HEIGHT - 25), (125, HEIGHT - 25), (30, 35, 40), 2, cv2.LINE_AA)
    cv2.line(frame, (25, HEIGHT - 30), (25, HEIGHT - 20), (30, 35, 40), 2, cv2.LINE_AA)
    cv2.line(frame, (125, HEIGHT - 30), (125, HEIGHT - 20), (30, 35, 40), 2, cv2.LINE_AA)
    cv2.putText(frame, "5.0 METERS", (45, HEIGHT - 32), cv2.FONT_HERSHEY_SIMPLEX, 0.36, (40, 45, 50), 1, cv2.LINE_AA)
    
    drone_hud_str = f"UAV-01 POSE: X={px/20.0 - 20.0:+.2f}m  Y={py/20.0 - 18.0:+.2f}m  YAW={math.degrees(yaw)%360:.1f} deg"
    cv2.putText(frame, drone_hud_str, (WIDTH - 440, HEIGHT - 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.40, (30, 35, 40), 1, cv2.LINE_AA)
    
    out.write(frame)
    
    if (frame_idx + 1) % 150 == 0 or frame_idx == TOTAL_FRAMES - 1:
        elapsed = time.time() - start_time
        fps_rendered = (frame_idx + 1) / elapsed
        print(f"Rendered {frame_idx + 1}/{TOTAL_FRAMES} frames ({((frame_idx + 1)/TOTAL_FRAMES)*100:.1f}%) @ {fps_rendered:.1f} fps")

out.release()
print("Raw video render complete. Converting to optimized web H.264 MP4 with ffmpeg...")

# Faststart H.264 MP4
ffmpeg_cmd = f'ffmpeg -y -i "{raw_video_path}" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -crf 18 -preset fast -movflags +faststart "{final_video_path}"'
os.system(ffmpeg_cmd)

# Copy to public/ directory
public_dest = os.path.join("public", final_video_path)
if os.path.exists("public"):
    shutil.copy(final_video_path, public_dest)
    print(f"Copied final video to {public_dest}")

if os.path.exists(raw_video_path):
    os.remove(raw_video_path)

print(f"Successfully generated realistic 2D SLAM video: {final_video_path}")
