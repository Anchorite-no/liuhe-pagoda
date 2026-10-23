"""Shared render setup: Cycles on the GPU, AgX, a studio sweep or a plain sky."""
import math

import bmesh
import bpy
from mathutils import Vector


def engine(scene, samples=64, w=1600, h=1000, exposure=-0.75):
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    scene.cycles.device = "GPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.resolution_percentage = 100
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = exposure


def plain_world(scene, sun_elev_deg=28, sun_rot_deg=205, strength=0.3, warm=False, energy=3.0):
    world = bpy.data.worlds.new("Sky")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    bg = nt.nodes.new("ShaderNodeBackground")
    outw = nt.nodes.new("ShaderNodeOutputWorld")
    sky = nt.nodes.new("ShaderNodeTexSky")
    sky.sky_type = "MULTIPLE_SCATTERING"
    sky.sun_disc = False
    sky.sun_elevation = math.radians(sun_elev_deg)
    sky.sun_rotation = math.radians(sun_rot_deg)
    sky.aerosol_density = 2.0
    nt.links.new(sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength
    nt.links.new(bg.outputs["Background"], outw.inputs["Surface"])
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = energy
    sun.angle = math.radians(1.2)
    sun.color = (1.0, 0.86, 0.7) if warm else (1.0, 0.94, 0.86)
    so = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(so)
    el = math.radians(sun_elev_deg)
    so.rotation_euler = (math.pi / 2 - el, 0, math.radians(sun_rot_deg) + math.pi / 2)
    return so


def sweep(scene, color=(0.52, 0.5, 0.47), half_width=700, depth=600, back=200, radius=160, top=900):
    gm = bpy.data.materials.new("Sweep")
    gm.use_nodes = True
    gb = gm.node_tree.nodes["Principled BSDF"]
    gb.inputs["Base Color"].default_value = (*color, 1)
    gb.inputs["Roughness"].default_value = 0.95
    bm = bmesh.new()
    n = 40
    prof = [(-depth + i * (depth + back) / n, 0.0) for i in range(n + 1)]
    for i in range(1, 25):
        a = (i / 24) * (math.pi / 2)
        prof.append((back + radius * math.sin(a), radius - radius * math.cos(a)))
    prof.append((back + radius, top))
    rows = [[bm.verts.new((-half_width, y, z)), bm.verts.new((half_width, y, z))] for (y, z) in prof]
    for i in range(len(rows) - 1):
        bm.faces.new((rows[i][0], rows[i][1], rows[i + 1][1], rows[i + 1][0]))
    me = bpy.data.meshes.new("Sweep")
    bm.to_mesh(me)
    ob = bpy.data.objects.new("Sweep", me)
    scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(gm)
    return ob


def camera(scene, name="Cam"):
    cd = bpy.data.cameras.new(name)
    cam = bpy.data.objects.new(name, cd)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cd.clip_end = 6000
    return cam


def aim(cam, pos, target, lens):
    cam.location = Vector(pos)
    cam.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
