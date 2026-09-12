"""Deterministic, illustrative Bangkok district. Run with Blender --background --python."""
import bpy, math, random, os
from mathutils import Vector
random.seed(42)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def mat(name,color,metal=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.68
 return m
building=mat('Architecture • blue slate',(.13,.24,.31),.25)
roof=mat('Roof • pale steel',(.25,.38,.44),.3)
landmark=mat('Landmarks • jade',(.16,.52,.49),.35)
gold=mat('Temple • sandstone',(.59,.48,.28),.3)
ground=mat('District ground',(.045,.085,.105))
road=mat('Road network',(.105,.17,.20))
park=mat('Urban tree canopy',(.09,.25,.19))
water=mat('Chao Phraya',(.018,.24,.30),.5)
meshes={}
def box(name,x,y,z,w,d,h,material):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(x,y,z+h/2)); o=bpy.context.object; o.name=name; o.scale=(w,d,h); bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(material); return o
def river(y): return -33+19*math.sin(y/48)+8*math.sin(y/23)
box('Bangkok district base',0,0,-2,260,250,2,ground)
verts=[]; faces=[]
for i in range(151):
 y=-126+i*252/150; x=river(y); verts.extend([(x-9,y,.12),(x+9,y,.12)])
 if i: k=2*i; faces.append((k-2,k-1,k+1,k))
mesh=bpy.data.meshes.new('River ribbon'); mesh.from_pydata(verts,[],faces); mesh.update(); ob=bpy.data.objects.new('Chao Phraya River',mesh); bpy.context.collection.objects.link(ob); ob.data.materials.append(water)
# Roads and buildings use a deliberately schematic layout, not surveyed GIS.
for x in range(-120,130,16):
 for y in range(-120,130,16):
  if abs(x-river(y))<16: continue
  box('Local streets',x,y,.04,15.3,15.3,.06,road)
  box('City block',x,y,.10,13.8,13.8,.1,ground)
  if 25<x<60 and -10<y<25:
   box('Lumphini green space',x,y,.2,13,13,.3,park); continue
  for dx,dy in [(-3.5,-3.5),(3.5,-3.5),(-3.5,3.5),(3.5,3.5)]:
   xx=x+dx; yy=y+dy
   if any((xx-a)**2+(yy-b)**2<120 for a,b in [(12,-39),(53,28),(-49,20),(-12,60)]):continue
   central=math.exp(-((x-35)**2+(y+10)**2)/6500)
   h=random.uniform(2,9)+random.random()**3*34*central
   w=random.uniform(3.6,5.7); d=random.uniform(3.7,5.8)
   box('Bangkok building',xx,yy,.2,w,d,h,building)
   if h>12: box('Rooftop',xx,yy,h+.2,w*.7,d*.7,.7,roof)
# Stylized MahaNakhon with pixel setbacks.
for i in range(16):
 x=12+(1.3 if 5<=i<=10 else 0); y=-39+(1 if i in [5,6,11,12] else 0)
 box('MahaNakhon • pixel tower',x,y,i*3.4,7 if i<14 else 6,7,3.35,landmark)
 for j in range(3):
  if (i+j)%5==0: box('Pixel terrace',x-4,y-2+j*2,i*3.4,1.5,1.6,2,roof)
# Baiyoke II stepped crown.
for z,w,h in [(0,11,5),(5,7,43),(48,5,8),(56,3,5)]:box('Baiyoke Tower II',53,28,z,w,w,h,landmark)
box('Baiyoke antenna',53,28,61,.35,.35,7,roof)
# Wat Arun pagoda and four satellites.
for dx,dy,s in [(0,0,1),(-5,-5,.42),(5,-5,.42),(-5,5,.42),(5,5,.42)]:
 for i in range(7):
  bpy.ops.mesh.primitive_cone_add(vertices=8,radius1=(5-i*.57)*s,radius2=(4.3-i*.57)*s,depth=3*s,location=(-49+dx,20+dy,(i*3+1.5)*s))
  bpy.context.object.name='Wat Arun • prang'; bpy.context.object.data.materials.append(gold)
box('Grand Palace courtyard',-12,60,.3,15,13,1,gold)
for dx in [-4,0,4]:
 box('Grand Palace hall',-12+dx,60,1.3,3.4,8,4,gold)
 bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=3.6,radius2=0,depth=5,location=(-12+dx,60,7)); bpy.context.object.data.materials.append(gold)
for y in [-70,-12,75]:box('River crossing',river(y),y,.6,28,2.7,.6,roof)
# Join by material: fast browser rendering, editable meshes in Blender.
for m in list(bpy.data.materials):
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH' and len(o.data.materials) and o.data.materials[0]==m]
 if not objs:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in objs:o.select_set(True)
 bpy.context.view_layer.objects.active=objs[0]; bpy.ops.object.join(); bpy.context.object.name=m.name
bpy.ops.object.light_add(type='AREA',location=(40,-40,150)); bpy.context.object.data.energy=1800; bpy.context.object.data.shape='DISK'; bpy.context.object.data.size=150
bpy.ops.object.camera_add(location=(210,-250,220)); cam=bpy.context.object; cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=350; bpy.context.scene.camera=cam
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'blender/bangkok.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(root,'public/models/bangkok.glb'),export_format='GLB',export_cameras=False,export_lights=False)
print('Bangkok model generated.')
