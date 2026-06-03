import bpy
import json
import os
import mathutils

'''
=============================================================================
HAIR CALCULATOR - BLENDER PARTING EXPORTER
=============================================================================

HOW TO USE THIS SCRIPT & CREATE PERFECT BOX BRAID PARTINGS:

1. PREPARE THE HEAD:
   - Import `custom_bust.glb` into Blender.

2. CREATE THE PARTING GRID:
   - Add a new Plane (Shift+A -> Mesh -> Plane).
   - Go to Edit Mode (Tab) and Subdivide it multiple times (Right Click -> Subdivide) 
     until you have a nice grid of small squares.
   - These squares represent the exact "Boxes" for the box braids!

3. SHRINKWRAP TO SCALP:
   - Add a "Shrinkwrap" Modifier to your grid.
   - Set the Target to your `custom_bust` head mesh.
   - Change Mode to "Project", enable "Negative" and "Positive", and check "Outside Surface".
   - Now, wrap and move your grid vertices around so it covers the scalp perfectly.

4. ASSIGN REGIONS (Optional but recommended):
   - To tell the app which hair falls which way, create 3 Materials on your grid object:
     - Material 0 (Slot 1): Name it "Top" (Assign to the crown/top squares)
     - Material 1 (Slot 2): Name it "Sides" (Assign to side squares)
     - Material 2 (Slot 3): Name it "Back" (Assign to back of head squares)
   - Go into Edit mode, select faces, and click "Assign" on the respective material.

5. EXPORT:
   - In Object Mode, select ONLY your Grid object.
   - Open the Scripting Workspace in Blender.
   - Paste this entire script into the text editor.
   - Run the script (Play button).
   - It will generate `box_braids.json` on your Desktop!

=============================================================================
'''

def export_partings():
    # Get the active selected object
    obj = bpy.context.active_object
    
    if not obj or obj.type != 'MESH':
        print("ERROR: Please select a Mesh object first!")
        return

    # Ensure we are in Object mode to get updated mesh data
    if bpy.context.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    # Apply modifiers (like Shrinkwrap) to get the final deformed mesh
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = obj.evaluated_get(depsgraph)
    mesh = eval_obj.to_mesh()

    matrix_world = obj.matrix_world
    normal_matrix = matrix_world.to_3x3().inverted().transposed()

    partings = []

    # Loop through all polygons (faces)
    for poly in mesh.polygons:
        # 1. Get the center of the face in world coordinates
        local_center = poly.center
        world_center = matrix_world @ local_center
        
        # 2. Get the normal of the face in world coordinates
        local_normal = poly.normal
        world_normal = (normal_matrix @ local_normal).normalized()
        
        # 3. Determine the region based on Material Index
        # Material 0: Top ('t'), Material 1: Sides ('s'), Material 2: Back ('b')
        region_char = 't'
        if poly.material_index == 1:
            region_char = 's'
        elif poly.material_index == 2:
            region_char = 'b'
        else:
            # Fallback auto-calculation if no materials are set
            if world_normal.y > 0.5:
                region_char = 't'
            elif world_normal.z < -0.2:
                region_char = 'b'
            else:
                region_char = 's'

        # Format exactly as the Hair Calculator App expects:
        # Y and Z axes might need to be flipped depending on your Blender export settings,
        # but standard Three.js assumes Y is up. Blender assumes Z is up.
        # We will map Blender (X, Y, Z) to Three.js (X, Z, -Y)
        
        t_x = round(world_center.x, 4)
        t_y = round(world_center.z, 4)  # Blender Z is Three.js Y
        t_z = round(-world_center.y, 4) # Blender Y is Three.js -Z

        n_x = round(world_normal.x, 4)
        n_y = round(world_normal.z, 4)
        n_z = round(-world_normal.y, 4)

        partings.append({
            "p": [t_x, t_y, t_z],
            "n": [n_x, n_y, n_z],
            "r": region_char
        })

    # Cleanup evaluated mesh
    eval_obj.to_mesh_clear()

    # Save to desktop
    desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop') 
    # Fallback for Mac/Linux
    if not os.path.exists(desktop):
        desktop = os.path.join(os.path.expanduser('~'), 'Desktop')

    out_path = os.path.join(desktop, 'box_braids.json')
    
    with open(out_path, 'w') as f:
        json.dump(partings, f, separators=(',', ':')) # compact json
        
    print(f"SUCCESS! Exported {len(partings)} partings to {out_path}")

# Run the export
export_partings()
