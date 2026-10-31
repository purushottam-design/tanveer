import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A real, self-contained WebGL scene. No image CDN or 3D model download required.
export function createHeroScene(host, initiallyMoving = true) {
  if (!host) return { setMotion() {}, destroy() {} };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    host.dataset.fallback = 'true';
    return { setMotion() {}, destroy() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.3 : 1.65));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 70);
  camera.position.set(0, 0, 15);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const root = new THREE.Group();
  root.position.set(3.25, .3, 0);
  scene.add(root);
  const lime = new THREE.MeshPhysicalMaterial({ color: 0xc9ff5d, metalness: .58, roughness: .23, clearcoat: 1, clearcoatRoughness: .16, envMapIntensity: 1.4 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0xc6d1bd, metalness: 1, roughness: .12, clearcoat: 1, envMapIntensity: 2.2 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x29361b, metalness: .8, roughness: .2, envMapIntensity: 2 });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.55, .3, 120, 14, 2, 3), chrome);
  knot.position.set(.5, 1.15, -2.2);
  knot.rotation.set(.6, -.3, .3);
  root.add(knot);
  const outer = new THREE.Mesh(new THREE.TorusGeometry(3.1, .025, 8, 110), lime);
  outer.rotation.set(1.05, .3, -.3);
  outer.position.z = -2;
  root.add(outer);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.7, .012, 8, 110), chrome);
  orbit.rotation.set(-.7, .9, .7);
  orbit.position.z = -2;
  root.add(orbit);

  const starShape = new THREE.Shape();
  const segments = 32;
  for (let i = 0; i < segments; i++) {
    const radius = i % 4 === 0 || i % 4 === 3 ? 1 : .35;
    const angle = i / segments * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const starGeometry = new THREE.ExtrudeGeometry(starShape, { depth: .22, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .045, bevelThickness: .045 });
  starGeometry.center();
  const star = new THREE.Mesh(starGeometry, lime);
  star.position.set(-2.25, -1.6, 1);
  star.scale.setScalar(.85);
  star.rotation.set(.25, -.35, .2);
  root.add(star);
  const star2 = new THREE.Mesh(starGeometry, chrome);
  star2.scale.setScalar(.35);
  star2.position.set(2.1, 2.6, 0);
  root.add(star2);
  const wireGeometry = new THREE.IcosahedronGeometry(1.1, 1);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(wireGeometry), new THREE.LineBasicMaterial({ color: 0xc9ff5d, transparent: true, opacity: .19 }));
  wire.position.set(-.2, -1.8, -2);
  root.add(wire);
  wireGeometry.dispose();

  const count = window.innerWidth < 700 ? 36 : 80;
  const fragments = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.06), dark, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399963;
    const radius = 2.8 + (i % 9) * .17;
    dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -3 - (i % 5) * .4);
    dummy.rotation.set(i * .5, i * .2, i * .3);
    dummy.scale.setScalar(.7 + (i % 3) * .6);
    dummy.updateMatrix();
    fragments.setMatrixAt(i, dummy.matrix);
  }
  root.add(fragments);
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(160 * 3);
  for (let i = 0; i < 160; i++) {
    const n = i * 3;
    particlesPositions[n] = Math.sin(i * 58.2) * 11;
    particlesPositions[n + 1] = Math.cos(i * 19.7) * 7;
    particlesPositions[n + 2] = -2 - (i % 10);
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  const particles = new THREE.Points(particlesGeometry, new THREE.PointsMaterial({ color: 0xc9ff5d, size: .022, transparent: true, opacity: .5, sizeAttenuation: true }));
  scene.add(particles);
  const light = new THREE.PointLight(0xc9ff5d, 20, 15);
  light.position.set(-1, 3, 5);
  scene.add(light, new THREE.AmbientLight(0xffffff, .8));

  let moving = initiallyMoving, visible = true, destroyed = false, frame = 0, time = 0, last = 0;
  let targetX = 0, targetY = 0, scroll = 0;
  const pointer = { x: 0, y: 0 };
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const mobile = window.innerWidth < 700;
    root.position.x = mobile ? 1.7 : 3.25;
    root.position.y = mobile ? -1.4 : .3;
    root.scale.setScalar(mobile ? 1.05 : 1);
    render();
  }
  function pointerMove(event) {
    targetX = event.clientX / window.innerWidth * 2 - 1;
    targetY = event.clientY / window.innerHeight * 2 - 1;
  }
  function scrollUpdate() {
    scroll = Math.min(window.scrollY / Math.max(host.clientHeight, 1), 1.5);
    if (!moving) render();
  }
  function render() {
    if (!destroyed) renderer.render(scene, camera);
  }
  function tick(now) {
    frame = 0;
    if (destroyed || !moving || !visible || document.hidden) return;
    const delta = Math.min((now - (last || now)) / 1000, .04);
    time += delta; last = now;
    pointer.x += (targetX - pointer.x) * .035;
    pointer.y += (targetY - pointer.y) * .035;
    root.rotation.y = pointer.x * .09 + scroll * .22;
    root.rotation.x = pointer.y * .035;
    knot.rotation.x = .6 + time * .12;
    knot.rotation.y = -.3 + time * .18;
    knot.position.y = 1.15 + Math.sin(time * .6) * .18;
    star.rotation.z = .2 + time * .18;
    star.rotation.y = -.35 + Math.sin(time * .4) * .4;
    star.position.y = -1.6 + Math.cos(time * .9) * .15;
    star2.rotation.z = -time * .24;
    outer.rotation.z = -.3 + time * .055;
    orbit.rotation.z = .7 - time * .07;
    wire.rotation.y = time * .1;
    wire.rotation.z = -time * .07;
    fragments.rotation.z = time * .015;
    particles.rotation.y = time * .009;
    camera.position.x = pointer.x * .13;
    camera.position.y = -pointer.y * .1 + scroll * .4;
    render();
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!frame && moving && visible && !document.hidden && !destroyed) {
      last = 0;
      frame = requestAnimationFrame(tick);
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) resume(); else { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: '100px' });
  observer.observe(host);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else resume(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('scroll', scrollUpdate, { passive: true });
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); cancelAnimationFrame(frame); frame = 0; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { resize(); resume(); });
  resize(); render(); resume();
  return {
    setMotion(enabled) { moving = enabled; if (enabled) resume(); else { cancelAnimationFrame(frame); frame = 0; render(); } },
    destroy() {
      destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect();
      window.removeEventListener('pointermove', pointerMove); window.removeEventListener('scroll', scrollUpdate);
      document.removeEventListener('visibilitychange', onVisibility);
      const geometries = new Set(), materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
      });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
