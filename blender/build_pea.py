"""Create a schematic coastal district and distribution transformer assets."""
import bpy, json, os, random
from mathutils import Vector
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with open(os.path.join(root, 'public/data/pea-assets.json')) as f: assets = json.load(f)
random.seed(23)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def material(name, color, metallic=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metallic; p.inputs['Roughness'].default_value=.6
    return m
land=material('District',(.07,.075,.12)); road=material('Streets',(.16,.17,.23)); building=material('Buildings',(.20,.23,.31),.2)
sea=material('Coastal water',(.04,.16,.22),.3); green=material('Landscaping',(.08,.20,.16)); steel=material('Transformer steel',(.39,.43,.50),.55)
purple=material('Asset housing',(.34,.20,.50),.3); porcelain=material('Bushings',(.66,.68,.70)); gold=material('Safety markings',(.70,.52,.19)); slab=material('Concrete',(.27,.29,.34))
def box(name,x,z,y,w,d,h,m):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y+h/2)); o=bpy.context.object; o.name=name; o.scale=(w,d,h); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m); return o
box('District platform',20,0,-2,225,235,2,land)
box('Coast',-112,0,-1.4,38,235,.5,sea)
box('Beach promenade',-88,0,.03,8,233,.13,slab)
for x in [-67,-5,27,101]: box('Road',x,0,.05,3,229,.12,road)
for z in [-89,-40,8,57,98]: box('Road',17,z,.05,172,3,.12,road)
for x in range(-77,112,12):
 for z in range(-104,106,12):
  if any(abs(x-a['x'])<12 and abs(z-a['z'])<13 for a in assets): continue
  if any(abs(x-v)<5 for v in [-67,-5,27,101]) or any(abs(z-v)<5 for v in [-89,-40,8,57,98]): continue
  h=random.uniform(2,8)+(random.random()**3)*15
  box('City block',x,z,.15,random.uniform(5,8),random.uniform(5,8),h,building)
  if random.random()<.15:box('Green space',x+3,z+4,.2,3,3,.4,green)
for a in assets:
 x,z=a['x'],a['z']; prefix=a['id']
 box(prefix+' foundation',x,z,.2,11,9,.6,slab)
 box(prefix+' transformer tank',x,z,.8,5,3.8,4,steel)
 box(prefix+' top cover',x,z,4.8,5.5,4.2,.4,purple)
 for dx in [-1.6,0,1.6]:box(prefix+' terminal',x+dx,z,5.2,.45,.5,1.4,porcelain)
 for side in [-1,1]:
  for i in range(7):box(prefix+' radiator fin',x+side*2.8,z-1.5+i*.5,1.2,.7,.2,3,steel)
 box(prefix+' TPO enclosure',x+4,z,.8,1.7,2,3.2,purple)
 box(prefix+' identification',x,z+2.1,2.2,2.4,.12,.9,gold)
 for dx in [-4.5,4.5]:box(prefix+' protection bollard',x+dx,z+3.5,.8,.25,.25,1.4,gold)
box('Primary substation',8,-99,.2,22,14,.8,slab)
for x in [1,14]:
 box('Substation switchgear',x,-99,1,8,7,7,purple)
 for dx in [-2,0,2]:box('Substation bus terminal',x+dx,-99,8,.5,.5,3,porcelain)
for m in list(bpy.data.materials):
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.materials) and o.data.materials[0]==m]
 if len(objs)<2: continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();bpy.context.object.name=m.name
bpy.ops.object.light_add(type='AREA',location=(50,-40,150));bpy.context.object.data.energy=2000;bpy.context.object.data.size=120
bpy.ops.object.camera_add(location=(220,-260,220));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=330;bpy.context.scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'blender/pea-distribution.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public/models/pea-distribution.glb'),export_format='GLB',export_cameras=False,export_lights=False)
