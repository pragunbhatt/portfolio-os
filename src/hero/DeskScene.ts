import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createDust, createRainGlass, createSteam, GrainShader, stickyNote } from './atmosphere';
import { loadWallpaper, paintWallpaper, type Wallpaper } from '../wallpapers';
import { profile } from '../content';
import { paintLockText } from '../lockPaint';

const DESK_Y = 0.74;
const SCREEN_W = 0.62;
const SCREEN_H = SCREEN_W / 1.6;
const MONITOR_X = 0.1;
const MONITOR_Z = -0.2;
const SCREEN_CY = DESK_Y + 0.335;
const FOV = 30;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext('2d')!;
  const base = g.createLinearGradient(0, 0, 0, c.height);
  base.addColorStop(0, '#5e3a27');
  base.addColorStop(0.5, '#6f4632');
  base.addColorStop(1, '#583524');
  g.fillStyle = base;
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 520; i++) {
    const y = Math.random() * c.height;
    const amp = 4 + Math.random() * 14;
    const freq = 0.002 + Math.random() * 0.004;
    const phase = Math.random() * Math.PI * 2;
    const dark = Math.random() > 0.45;
    g.strokeStyle = dark ? `rgba(38,20,11,${0.05 + Math.random() * 0.16})` : `rgba(160,110,75,${0.04 + Math.random() * 0.1})`;
    g.lineWidth = 0.6 + Math.random() * 2.4;
    g.beginPath();
    for (let x = 0; x <= c.width; x += 16) {
      const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.25;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const rg = g.createRadialGradient(x, y, 0, x, y, 30 + Math.random() * 50);
    rg.addColorStop(0, 'rgba(40,20,10,0.35)');
    rg.addColorStop(1, 'rgba(40,20,10,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.ellipse(x, y, 90, 24, 0, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function feltTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#2a303d';
  g.fillRect(0, 0, 512, 512);
  const img = g.getImageData(0, 0, 512, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1.5);
  return tex;
}

function wallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1d2533';
  g.fillRect(0, 0, 1024, 512);
  const img = g.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export type DeskObject = 'lamp' | 'monitor' | 'keyboard' | 'mouse' | 'headphones' | 'mug' | 'plant' | 'window' | 'note' | 'notebook';
export type DeskEvent = { type: 'login' } | { type: 'rain' } | { type: 'key' } | { type: 'click' };

const NOTES = [
  ['git push', 'before bed'],
  ['CGPA 9.35', 'keep it up'],
  ['sem 3:', 'DSA grind'],
  ['drink', 'water'],
  ['ship the', 'portfolio'],
];

export class DeskScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 30);
  private screenCanvas = document.createElement('canvas');
  private screenTex: THREE.CanvasTexture;
  private screenGlow!: THREE.RectAreaLight;
  private raf = 0;
  private running = false;
  private progress = 0;
  private pointer = new THREE.Vector2();
  private pointerSmooth = new THREE.Vector2();
  private wallpaper: Wallpaper;
  private clockTimer = 0;
  private aspect = 1;
  private fov = FOV;
  private disposables: { dispose: () => void }[] = [];
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grain: ShaderPass;
  private clock = new THREE.Clock();
  private rain!: ReturnType<typeof createRainGlass>;
  private dust!: ReturnType<typeof createDust>;
  private steam!: ReturnType<typeof createSteam>;
  private windowLight!: THREE.RectAreaLight;
  private hemi!: THREE.HemisphereLight;
  private nextFlash = 14 + Math.random() * 14;
  private flashStart = -10;
  private reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private pixelRatio = 1;
  private caps!: THREE.InstancedMesh;
  private keyBase: { pos: THREE.Vector3; quat: THREE.Quaternion; scale: THREE.Vector3; color: THREE.Color }[] = [];
  private keyMap = new Map<string, number>();
  private pressed = new Map<number, number>();
  private tmpM = new THREE.Matrix4();
  private tmpC = new THREE.Color();
  private white = new THREE.Color('#ffffff');

  // Interactive desk objects.
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private targets: { id: DeskObject; root: THREE.Object3D }[] = [];
  private lampOn = true;
  private lampLevel = 1;
  private lampFlickerAt = -10;
  private lamp!: { spot: THREE.SpotLight; pool: THREE.PointLight; bulb: THREE.MeshBasicMaterial; cone: THREE.ShaderMaterial };
  private objs: Partial<Record<DeskObject, THREE.Object3D>> = {};
  private anim: Partial<Record<DeskObject, number>> = {};
  private note!: ReturnType<typeof stickyNote>;
  private noteIndex = 0;
  private rainOn = false;
  onDeskEvent: (e: DeskEvent) => void = () => {};
  onFirstFrame: () => void = () => {};
  private firstFrameDone = false;

  constructor(private canvas: HTMLCanvasElement, wallpaper: Wallpaper) {
    this.wallpaper = wallpaper;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.pixelRatio = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    RectAreaLightUniformsLib.init();

    this.scene.background = new THREE.Color('#0d1119');
    this.scene.fog = new THREE.Fog('#0d1119', 3.2, 7.5);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.scene.environmentIntensity = 0.22;
    pmrem.dispose();
    this.disposables.push(envTex);

    this.screenCanvas.width = 1920;
    this.screenCanvas.height = 1200;
    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenTex.anisotropy = 8;
    this.disposables.push(this.screenTex);

    this.build();
    for (const [id, root] of Object.entries(this.objs)) this.targets.push({ id: id as DeskObject, root: root! });

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.34, 0.6, 1.05);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grain = new ShaderPass(GrainShader);
    this.composer.addPass(this.grain);

    this.paintScreen();
    document.fonts?.ready.then(() => this.paintScreen());
    loadWallpaper(wallpaper).then(() => this.paintScreen());
    let minute = new Date().getMinutes();
    this.clockTimer = window.setInterval(() => {
      const m = new Date().getMinutes();
      if (m !== minute) {
        minute = m;
        this.paintScreen();
      }
    }, 1000);
    this.resize();
  }

  private track<T extends { dispose: () => void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }

  private mat(params: THREE.MeshStandardMaterialParameters) {
    return this.track(new THREE.MeshStandardMaterial(params));
  }

  private mesh(geo: THREE.BufferGeometry, mat: THREE.Material, cast = true, receive = true) {
    this.track(geo);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    return m;
  }

  private build() {
    const s = this.scene;

    // Room
    const wall = this.mesh(new THREE.PlaneGeometry(9, 4.5), this.mat({ map: this.track(wallTexture()), roughness: 0.95 }), false, true);
    wall.position.set(0, 1.6, -0.62);
    s.add(wall);
    const floor = this.mesh(new THREE.PlaneGeometry(9, 6), this.mat({ color: '#07090d', roughness: 1 }), false, true);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 1);
    s.add(floor);

    // Desk
    const wood = this.track(woodTexture());
    const deskMat = this.track(
      new THREE.MeshPhysicalMaterial({ map: wood, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.28 }),
    );
    const desk = this.mesh(new RoundedBoxGeometry(2.3, 0.045, 0.95, 3, 0.008), deskMat);
    desk.position.set(0, DESK_Y - 0.0225, -0.12);
    s.add(desk);
    const legMat = this.mat({ color: '#15171c', roughness: 0.5, metalness: 0.6 });
    for (const x of [-1.05, 1.05]) {
      const leg = this.mesh(new THREE.BoxGeometry(0.05, DESK_Y - 0.045, 0.75), legMat);
      leg.position.set(x, (DESK_Y - 0.045) / 2, -0.12);
      s.add(leg);
    }

    // Desk mat
    const mat = this.mesh(new RoundedBoxGeometry(0.92, 0.004, 0.36, 2, 0.002), this.mat({ map: this.track(feltTexture()), roughness: 1 }), false, true);
    mat.position.set(0.14, DESK_Y + 0.002, 0.16);
    s.add(mat);

    this.buildMonitor();
    this.buildKeyboard();
    this.buildMouse();
    this.buildHeadphones();
    this.buildLamp();
    this.buildPlant();
    this.buildMug();
    this.buildNotebook();
    this.buildWindow();
    this.buildStickyNote();
    this.steam = createSteam(new THREE.Vector3(-0.36, DESK_Y + 0.085, 0.1));
    this.disposables.push(this.steam);
    s.add(this.steam.group);

    // Lights
    this.hemi = new THREE.HemisphereLight('#9fb4d9', '#2a1c14', 0.35);
    s.add(this.hemi);
    const rim = new THREE.DirectionalLight('#9db6ff', 0.55);
    rim.position.set(1.8, 2.4, -0.2);
    s.add(rim);
    const fill = new THREE.DirectionalLight('#ffd9b0', 0.18);
    fill.position.set(-1, 1.6, 2.5);
    s.add(fill);
  }

  private buildMonitor() {
    const s = this.scene;
    const alu = this.mat({ color: '#c9ccd2', metalness: 1, roughness: 0.32 });
    const group = new THREE.Group();
    group.position.set(MONITOR_X, 0, MONITOR_Z);

    const bodyW = SCREEN_W + 0.036;
    const bodyH = SCREEN_H + 0.036;
    const body = this.mesh(new RoundedBoxGeometry(bodyW, bodyH, 0.024, 4, 0.01), alu);
    body.position.set(0, SCREEN_CY, 0);
    group.add(body);

    const glassMat = this.track(new THREE.MeshPhysicalMaterial({ color: '#050608', roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }));
    const bezel = this.mesh(new THREE.PlaneGeometry(bodyW - 0.006, bodyH - 0.006), glassMat, false, false);
    bezel.position.set(0, SCREEN_CY, 0.0122);
    group.add(bezel);

    const screenMat = this.track(new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false }));
    const screen = this.mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat, false, false);
    screen.position.set(0, SCREEN_CY, 0.0125);
    group.add(screen);

    // Faint reflection on the glass, only visible at grazing angles.
    const sheen = this.mesh(
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      this.track(new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.08, roughness: 0.05, metalness: 1, color: '#ffffff' })),
      false,
      false,
    );
    sheen.position.set(0, SCREEN_CY, 0.0128);
    group.add(sheen);

    // Stand: a leaning slab and a foot.
    const neck = this.mesh(new RoundedBoxGeometry(0.15, 0.3, 0.012, 3, 0.005), alu);
    neck.position.set(0, DESK_Y + 0.16, -0.06);
    neck.rotation.x = -0.22;
    group.add(neck);
    const foot = this.mesh(new RoundedBoxGeometry(0.17, 0.008, 0.2, 3, 0.004), alu);
    foot.position.set(0, DESK_Y + 0.004, -0.04);
    group.add(foot);

    s.add(group);
    this.objs.monitor = group;

    this.screenGlow = new THREE.RectAreaLight('#9fb4ff', 6, SCREEN_W, SCREEN_H);
    this.screenGlow.position.set(MONITOR_X, SCREEN_CY, MONITOR_Z + 0.02);
    this.screenGlow.lookAt(MONITOR_X, SCREEN_CY - 0.2, MONITOR_Z + 1);
    s.add(this.screenGlow);
  }

  private buildKeyboard() {
    const s = this.scene;
    const u = 0.0191;
    const rows: { w: number; kind?: 'mod' | 'accent' }[][] = [
      [{ w: 1, kind: 'accent' }, ...Array(12).fill({ w: 1, kind: 'mod' }), { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }],
      [...Array(13).fill({ w: 1 }), { w: 2, kind: 'mod' }, { w: 1, kind: 'mod' }],
      [{ w: 1.5, kind: 'mod' }, ...Array(12).fill({ w: 1 }), { w: 1.5, kind: 'mod' }, { w: 1, kind: 'mod' }],
      [{ w: 1.75, kind: 'mod' }, ...Array(11).fill({ w: 1 }), { w: 2.25, kind: 'accent' }, { w: 1, kind: 'mod' }],
      [{ w: 2.25, kind: 'mod' }, ...Array(10).fill({ w: 1 }), { w: 1.75, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }],
      [{ w: 1.25, kind: 'mod' }, { w: 1.25, kind: 'mod' }, { w: 1.25, kind: 'mod' }, { w: 6.25 }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }, { w: 1, kind: 'mod' }],
    ];
    const count = rows.reduce((n, r) => n + r.length, 0);
    const group = new THREE.Group();
    group.position.set(0.06, DESK_Y + 0.004, 0.14);
    group.rotation.x = 0.07;

    const caseW = 16 * u + 0.014;
    const caseD = 6 * u + 0.016;
    const caseMat = this.mat({ color: '#2b2f37', metalness: 0.75, roughness: 0.42 });
    const kcase = this.mesh(new RoundedBoxGeometry(caseW, 0.024, caseD, 4, 0.006), caseMat);
    kcase.position.y = 0.012;
    group.add(kcase);
    const plate = this.mesh(new THREE.BoxGeometry(16 * u + 0.002, 0.004, 6 * u + 0.002), this.mat({ color: '#111318', roughness: 0.7 }));
    plate.position.y = 0.0225;
    group.add(plate);

    const capGeo = this.track(new RoundedBoxGeometry(1, 1, 1, 2, 0.12));
    const capMat = this.mat({ color: '#ffffff', roughness: 0.55, metalness: 0 });
    const caps = new THREE.InstancedMesh(capGeo, capMat, count);
    caps.castShadow = true;
    caps.receiveShadow = true;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const colors = { alpha: new THREE.Color('#d6d2c8'), mod: new THREE.Color('#8e99a6'), accent: new THREE.Color('#ffae55') };
    let i = 0;
    const rowStart: number[] = [];
    rows.forEach((row, r) => {
      rowStart[r] = i;
      let x = -8 * u;
      const z = (r - 2.5) * u;
      const rowTilt = [0.12, 0.07, 0.03, 0, -0.03, -0.06][r];
      for (const key of row) {
        const w = key.w * u - 0.0026;
        const cx = x + (key.w * u) / 2;
        q.setFromEuler(new THREE.Euler(rowTilt, 0, 0));
        const pos = new THREE.Vector3(cx, 0.031 + (r === 0 ? 0.0012 : 0), z);
        const scl = new THREE.Vector3(w, 0.011, u - 0.0028);
        const color = key.kind === 'accent' ? colors.accent : key.kind === 'mod' ? colors.mod : colors.alpha;
        m.compose(pos, q, scl);
        caps.setMatrixAt(i, m);
        caps.setColorAt(i, color);
        this.keyBase[i] = { pos, quat: q.clone(), scale: scl, color: color.clone() };
        x += key.w * u;
        i++;
      }
    });
    group.add(caps);
    this.caps = caps;

    // Map characters to keycaps on this 75% layout.
    const put = (chars: string, row: number, offset: number) =>
      [...chars].forEach((ch, k) => this.keyMap.set(ch, rowStart[row] + offset + k));
    put('`1234567890-=', 1, 0);
    put('qwertyuiop[]', 2, 1);
    put("asdfghjkl;'", 3, 1);
    put('zxcvbnm,./', 4, 1);
    this.keyMap.set(' ', rowStart[5] + 3);
    this.keyMap.set('\n', rowStart[3] + 12);
    this.keyMap.set('shift', rowStart[4]);
    this.keyMap.set('backspace', rowStart[1] + 13);

    // Coiled-style cable heading toward the monitor.
    // The group is tilted, so lower the cable by z * tan(tilt) to keep it resting on the desk.
    const onDesk = (x: number, z: number, lift = 0.002) => new THREE.Vector3(x, lift + z * Math.tan(group.rotation.x), z);
    const curve = new THREE.CatmullRomCurve3([
      onDesk(-0.1, -caseD / 2, 0.01),
      onDesk(-0.16, -0.1),
      onDesk(-0.08, -0.22),
      onDesk(0.01, -0.3),
      onDesk(0.03, -0.36, 0.006),
    ]);
    const cable = this.mesh(new THREE.TubeGeometry(curve, 48, 0.0028, 8, false), this.mat({ color: '#ffae55', roughness: 0.6 }));
    group.add(cable);

    s.add(group);
    this.objs.keyboard = group;
  }

  private buildMouse() {
    const geo = new THREE.SphereGeometry(1, 40, 24);
    const mouse = this.mesh(geo, this.mat({ color: '#c9cace', roughness: 0.42 }));
    mouse.scale.set(0.031, 0.017, 0.056);
    mouse.position.set(0.43, DESK_Y + 0.006, 0.17);
    mouse.rotation.y = -0.12;
    this.scene.add(mouse);
    this.objs.mouse = mouse;
  }

  private buildHeadphones() {
    const s = this.scene;
    const g = new THREE.Group();
    g.position.set(0.66, DESK_Y, -0.12);
    g.rotation.y = -0.5;
    const metal = this.mat({ color: '#2a2c31', metalness: 0.9, roughness: 0.35 });
    const base = this.mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.012, 48), metal);
    base.position.y = 0.006;
    g.add(base);
    const rod = this.mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.27, 16), metal);
    rod.position.y = 0.147;
    g.add(rod);
    const hanger = this.mesh(new THREE.TorusGeometry(0.04, 0.007, 12, 32, Math.PI), metal);
    hanger.position.y = 0.282 - 0.04;
    g.add(hanger);

    const matte = this.mat({ color: '#1d1e22', roughness: 0.72 });
    const leather = this.mat({ color: '#2a2a2e', roughness: 0.85 });
    const silver = this.mat({ color: '#d4d7dc', metalness: 1, roughness: 0.25 });
    const R = 0.088;
    const topY = 0.3;
    const band = this.mesh(new THREE.TorusGeometry(R, 0.011, 16, 64, Math.PI), matte);
    band.position.y = topY - R;
    g.add(band);
    const pad = this.mesh(new THREE.TorusGeometry(R - 0.009, 0.009, 12, 48, Math.PI * 0.6), leather);
    pad.position.y = topY - R;
    pad.rotation.z = Math.PI * 0.2;
    g.add(pad);
    for (const side of [-1, 1]) {
      const slider = this.mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.05, 10), silver);
      slider.position.set(side * R, topY - R - 0.025, 0);
      g.add(slider);
      const cup = this.mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.034, 48), matte);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(side * (R + 0.004), topY - R - 0.085, 0);
      g.add(cup);
      const cap = this.mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 48), silver);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(side * (R + 0.023), topY - R - 0.085, 0);
      g.add(cap);
      const cushion = this.mesh(new THREE.TorusGeometry(0.036, 0.013, 16, 40), leather);
      cushion.rotation.y = Math.PI / 2;
      cushion.position.set(side * (R - 0.018), topY - R - 0.085, 0);
      g.add(cushion);
    }
    s.add(g);
    this.objs.headphones = g;
  }

  private buildLamp() {
    const s = this.scene;
    const g = new THREE.Group();
    g.position.set(0.98, DESK_Y, -0.38);
    const black = this.mat({ color: '#1a1b1f', metalness: 0.5, roughness: 0.4 });
    const brass = this.mat({ color: '#c89b5a', metalness: 1, roughness: 0.3 });
    const base = this.mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.022, 48), black);
    base.position.y = 0.011;
    g.add(base);

    const p0 = new THREE.Vector3(0, 0.022, 0);
    const p1 = new THREE.Vector3(-0.02, 0.4, -0.04);
    const p2 = new THREE.Vector3(-0.26, 0.56, 0.12);
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => {
      const len = a.distanceTo(b);
      const arm = this.mesh(new THREE.CylinderGeometry(0.007, 0.007, len, 12), black);
      arm.position.copy(a).lerp(b, 0.5);
      arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.add(arm);
    };
    seg(p0, p1);
    seg(p1, p2);
    const joint = this.mesh(new THREE.SphereGeometry(0.014, 16, 12), brass);
    joint.position.copy(p1);
    g.add(joint);

    const head = new THREE.Group();
    head.position.copy(p2);
    const shade = this.mesh(new THREE.CylinderGeometry(0.028, 0.068, 0.11, 40, 1, true), this.track(new THREE.MeshStandardMaterial({ color: '#1a1b1f', metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide })));
    head.add(shade);
    const bulbMat = this.track(new THREE.MeshBasicMaterial({ color: '#ffe2b0' }));
    const bulb = this.mesh(new THREE.SphereGeometry(0.024, 20, 16), bulbMat, false, false);
    bulb.position.y = -0.03;
    head.add(bulb);
    g.add(head);
    s.add(g);
    this.objs.lamp = g;
    // Aim the shade's open end (local -Y) at the pool of light on the desk.
    const aim = new THREE.Vector3(0.28, DESK_Y, 0.14);
    const headWorld = g.position.clone().add(p2);
    head.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim.clone().sub(headWorld).normalize());
    g.updateMatrixWorld(true);

    const lampWorld = new THREE.Vector3();
    bulb.getWorldPosition(lampWorld);
    const spot = new THREE.SpotLight('#ffb866', 6.2, 0, 0.78, 0.8, 1.6);
    spot.position.copy(lampWorld);
    spot.target.position.copy(aim);
    spot.castShadow = true;
    spot.shadow.mapSize.set(2048, 2048);
    spot.shadow.bias = -0.0004;
    spot.shadow.radius = 6;
    spot.shadow.camera.near = 0.05;
    spot.shadow.camera.far = 3;
    s.add(spot, spot.target);

    const pool = new THREE.PointLight('#ffb866', 0.6, 1.4, 2);
    pool.position.copy(lampWorld).add(new THREE.Vector3(0, -0.05, 0));
    s.add(pool);

    // A faint volume of light under the shade, and dust turning in it.
    const coneLen = lampWorld.distanceTo(aim);
    const coneGeo = new THREE.ConeGeometry(Math.tan(0.62) * coneLen, coneLen, 48, 1, true);
    coneGeo.translate(0, -coneLen / 2, 0);
    const cone = this.mesh(
      coneGeo,
      this.track(
        new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          uniforms: { uLen: { value: coneLen }, uLevel: { value: 1 } },
          vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
          fragmentShader: `uniform float uLen; uniform float uLevel; varying vec3 vP; varying vec3 vN; varying vec3 vV; void main(){ float along = clamp(-vP.y/uLen,0.0,1.0); float rim = pow(abs(dot(vN,vV)),1.6); float a = (1.0-along)*0.05*rim*uLevel; gl_FragColor = vec4(1.0,0.78,0.5,a); }`,
        }),
      ),
      false,
      false,
    );
    cone.position.copy(lampWorld);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim.clone().sub(lampWorld).normalize());
    s.add(cone);

    this.lamp = { spot, pool, bulb: bulbMat, cone: cone.material as THREE.ShaderMaterial };

    this.dust = createDust(lampWorld, aim, 0.78);
    this.disposables.push(this.dust);
    s.add(this.dust.points);
  }

  private buildWindow() {
    const s = this.scene;
    const W = 0.84;
    const H = 0.72;
    const cx = 0.96;
    const cy = DESK_Y + 0.2 + H / 2;
    const z = -0.6;

    this.rain = createRainGlass(W, H);
    this.disposables.push(this.rain);
    this.rain.mesh.position.set(cx, cy, z);
    s.add(this.rain.mesh);
    this.objs.window = this.rain.mesh;

    const frameMat = this.mat({ color: '#1b1d22', roughness: 0.55, metalness: 0.4 });
    const t = 0.034;
    const d = 0.05;
    const bar = (w: number, h: number, x: number, y: number, depth = d) => {
      const m = this.mesh(new RoundedBoxGeometry(w, h, depth, 2, 0.004), frameMat);
      m.position.set(x, y, z + depth / 2 - 0.005);
      s.add(m);
    };
    bar(W + t * 2, t, cx, cy + H / 2 + t / 2);
    bar(W + t * 2, t, cx, cy - H / 2 - t / 2);
    bar(t, H, cx - W / 2 - t / 2, cy);
    bar(t, H, cx + W / 2 + t / 2, cy);
    bar(0.022, H, cx, cy, 0.035);
    bar(W, 0.018, cx, cy + H * 0.08, 0.03);

    const sill = this.mesh(new RoundedBoxGeometry(W + 0.14, 0.022, 0.1, 2, 0.006), this.mat({ color: '#d9d4cb', roughness: 0.7 }));
    sill.position.set(cx, cy - H / 2 - t - 0.011, z + 0.04);
    s.add(sill);

    this.windowLight = new THREE.RectAreaLight('#7f9ccc', 1.6, W, H);
    this.windowLight.position.set(cx, cy, z + 0.02);
    this.windowLight.lookAt(cx - 0.4, cy - 0.4, z + 1.2);
    s.add(this.windowLight);
  }

  private buildStickyNote() {
    this.note = stickyNote(NOTES[0]);
    const tex = this.track(this.note.tex);
    const geo = new THREE.PlaneGeometry(0.075, 0.075, 8, 8);
    // Curl the free corner forward like paper that's been stuck for a while.
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 0.0375;
      const y = 0.0375 - pos.getY(i);
      pos.setZ(i, Math.pow(Math.max(0, x * y) / (0.075 * 0.075), 1.6) * 0.012);
    }
    geo.computeVertexNormals();
    const note = this.mesh(geo, this.mat({ map: tex, roughness: 0.92, side: THREE.DoubleSide }), true, true);
    const bodyW = SCREEN_W + 0.036;
    note.position.set(MONITOR_X + bodyW / 2 + 0.022, SCREEN_CY + SCREEN_H / 2 - 0.05, MONITOR_Z + 0.0135);
    note.rotation.z = -0.07;
    this.scene.add(note);
    this.objs.note = note;
  }

  private buildPlant() {
    // A low succulent, so the left of the desk stays clear below the headline.
    const g = new THREE.Group();
    g.position.set(-0.5, DESK_Y, -0.3);
    const pot = this.mesh(new THREE.CylinderGeometry(0.05, 0.042, 0.07, 40), this.mat({ color: '#e6e1d8', roughness: 0.6 }));
    pot.position.y = 0.035;
    g.add(pot);
    const soil = this.mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.005, 32), this.mat({ color: '#2b1d14', roughness: 1 }));
    soil.position.y = 0.068;
    g.add(soil);
    const leafMat = this.mat({ color: '#6f9a74', roughness: 0.5 });
    const leafGeo = this.track(new THREE.SphereGeometry(1, 16, 12));
    const rings = [
      { n: 9, r: 0.03, len: 0.03, tilt: 1.05 },
      { n: 7, r: 0.018, len: 0.026, tilt: 0.7 },
      { n: 5, r: 0.006, len: 0.02, tilt: 0.35 },
    ];
    rings.forEach((ring, k) => {
      for (let i = 0; i < ring.n; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.castShadow = true;
        const a = (i / ring.n) * Math.PI * 2 + k * 0.4;
        leaf.scale.set(0.014, ring.len, 0.009);
        leaf.position.set(Math.cos(a) * ring.r, 0.072 + ring.len * 0.6, Math.sin(a) * ring.r);
        leaf.rotation.order = 'YXZ';
        leaf.rotation.set(0, -a + Math.PI / 2, 0);
        leaf.rotateX(ring.tilt);
        g.add(leaf);
      }
    });
    this.scene.add(g);
    this.objs.plant = g;
  }

  private buildMug() {
    const g = new THREE.Group();
    g.position.set(-0.36, DESK_Y, 0.1);
    const ceramic = this.mat({ color: '#3d4d6b', roughness: 0.35 });
    const body = this.mesh(new THREE.CylinderGeometry(0.038, 0.035, 0.092, 48, 1, true), this.track(new THREE.MeshStandardMaterial({ color: '#3d4d6b', roughness: 0.35, side: THREE.DoubleSide })));
    body.position.y = 0.046;
    g.add(body);
    const bottom = this.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.004, 48), ceramic);
    bottom.position.y = 0.002;
    g.add(bottom);
    const coffee = this.mesh(new THREE.CircleGeometry(0.036, 40), this.mat({ color: '#2a170c', roughness: 0.15 }), false, true);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.078;
    g.add(coffee);
    const handle = this.mesh(new THREE.TorusGeometry(0.022, 0.006, 12, 24, Math.PI), ceramic);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.038, 0.048, 0);
    g.add(handle);
    this.scene.add(g);
    this.objs.mug = g;
  }

  private buildNotebook() {
    const g = new THREE.Group();
    g.position.set(-0.6, DESK_Y, 0.12);
    g.rotation.y = 0.25;
    const cover = this.mesh(new RoundedBoxGeometry(0.15, 0.014, 0.21, 2, 0.003), this.mat({ color: '#b8875a', roughness: 0.8 }));
    cover.position.y = 0.007;
    g.add(cover);
    const band = this.mesh(new THREE.BoxGeometry(0.004, 0.0152, 0.212), this.mat({ color: '#1a1b1f', roughness: 0.6 }));
    band.position.set(0.055, 0.0076, 0);
    g.add(band);
    const pen = this.mesh(new THREE.CylinderGeometry(0.0042, 0.0042, 0.14, 16), this.mat({ color: '#d9dde3', metalness: 1, roughness: 0.2 }));
    pen.rotation.set(Math.PI / 2, 0, 0.3);
    pen.position.set(0.11, 0.005, 0);
    g.add(pen);
    this.scene.add(g);
    this.objs.notebook = g;
  }

  setWallpaper(w: Wallpaper) {
    this.wallpaper = w;
    this.paintScreen();
    loadWallpaper(w).then(() => this.wallpaper === w && this.paintScreen());
  }

  private paintScreen() {
    const c = this.screenCanvas;
    const g = c.getContext('2d')!;
    const W = c.width;
    const H = c.height;
    const tmp = document.createElement('canvas');
    tmp.width = W / 4;
    tmp.height = H / 4;
    paintWallpaper(tmp.getContext('2d')!, this.wallpaper, tmp.width, tmp.height);
    g.save();
    g.filter = 'blur(18px)';
    g.drawImage(tmp, -40, -40, W + 80, H + 80);
    g.restore();
    g.fillStyle = 'rgba(0,0,0,0.14)';
    g.fillRect(0, 0, W, H);

    paintLockText(g, W, H);
    const rounded = '"Inter", system-ui, sans-serif';
    g.textAlign = 'center';

    const ay = H * 0.72;
    const ar = H * 0.055;
    const grad = g.createLinearGradient(W / 2 - ar, ay - ar, W / 2 + ar, ay + ar);
    grad.addColorStop(0, '#f7c46c');
    grad.addColorStop(1, '#d9763d');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(W / 2, ay, ar, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = `700 ${ar * 0.8}px ${rounded}`;
    g.textBaseline = 'middle';
    g.fillText(profile.initials, W / 2, ay + ar * 0.04);
    g.textBaseline = 'alphabetic';
    g.font = `600 ${H * 0.026}px -apple-system, system-ui, "Inter", sans-serif`;
    g.fillStyle = '#fff';
    g.fillText(profile.name, W / 2, ay + ar + H * 0.045);
    const pw = W * 0.12;
    const ph = H * 0.034;
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath();
    g.roundRect(W / 2 - pw / 2, ay + ar + H * 0.068, pw, ph, ph / 2);
    g.fill();
    g.font = `500 ${H * 0.016}px -apple-system, system-ui, "Inter", sans-serif`;
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillText('Scroll to log in', W / 2, ay + ar + H * 0.068 + ph * 0.66);

    this.screenTex.needsUpdate = true;
  }

  private lightning(t: number) {
    this.flashStart = t;
    this.nextFlash = t + 18 + Math.random() * 26;
    window.dispatchEvent(new CustomEvent('desk-lightning'));
  }

  private updateLamp(t: number) {
    const target = this.lampOn ? 1 : 0;
    this.lampLevel += (target - this.lampLevel) * 0.2;
    let level = this.lampLevel;
    // A warm LED stutters once before settling when it's switched on.
    const f = t - this.lampFlickerAt;
    if (this.lampOn && f < 0.28) level *= f < 0.06 ? 0.9 : f < 0.12 ? 0.15 : f < 0.18 ? 0.8 : Math.min(1, 0.4 + (f - 0.18) * 6);
    this.lamp.spot.intensity = 6.2 * level;
    this.lamp.pool.intensity = 0.6 * level;
    this.lamp.bulb.color.setRGB(0.23 + 0.77 * level, 0.17 + 0.72 * level, 0.12 + 0.57 * level);
    this.lamp.cone.uniforms.uLevel.value = level;
    this.dust.material.uniforms.uLevel.value = level;
  }

  // 0..1 envelope for a short reaction started by a click.
  private bump(id: DeskObject, t: number, dur = 0.9) {
    const start = this.anim[id];
    if (start === undefined) return 0;
    const k = (t - start) / dur;
    if (k >= 1 || k < 0) return 0;
    return Math.sin(k * Math.PI);
  }

  private updateObjects(t: number) {
    const mug = this.objs.mug;
    if (mug) mug.position.y = DESK_Y + this.bump('mug', t) * 0.035;
    const book = this.objs.notebook;
    if (book) {
      const b = this.bump('notebook', t, 0.55);
      book.position.y = DESK_Y + b * 0.02;
      book.rotation.z = b * 0.08;
    }
    const damped = (id: DeskObject, f: number, amp: number, decay: number) => {
      const start = this.anim[id];
      if (start === undefined) return 0;
      const k = t - start;
      return k < 2.5 ? Math.sin(k * f) * amp * Math.exp(-k * decay) : 0;
    };
    const plant = this.objs.plant;
    if (plant) {
      plant.rotation.z = damped('plant', 11, 0.08, 2.2);
      plant.rotation.x = damped('plant', 8, 0.04, 2.2);
    }
    const note = this.objs.note;
    if (note) note.rotation.y = damped('note', 14, 0.3, 4);
    const mouse = this.objs.mouse;
    if (mouse) mouse.position.x = 0.43 + this.bump('mouse', t, 0.35) * 0.012;
    const hp = this.objs.headphones;
    if (hp) hp.rotation.y = -0.5 + damped('headphones', 10, 0.07, 3);
  }

  setRainOn(on: boolean) {
    this.rainOn = on;
  }

  private pick(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.targets.map((x) => x.root),
      true,
    );
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        const found = this.targets.find((x) => x.root === o);
        if (found) return { id: found.id, hit: h };
        o = o.parent;
      }
    }
    return null;
  }

  interactive() {
    return this.progress < 0.2;
  }

  // The label for whatever is under the pointer, or null.
  hover(clientX: number, clientY: number): string | null {
    if (!this.interactive()) return null;
    const found = this.pick(clientX, clientY);
    return found ? this.label(found.id) : null;
  }

  label(id: DeskObject): string {
    switch (id) {
      case 'lamp':
        return this.lampOn ? 'Turn off the lamp' : 'Turn on the lamp';
      case 'monitor':
        return 'Log in';
      case 'keyboard':
        return 'Press a key';
      case 'mouse':
        return 'Click the mouse';
      case 'headphones':
        return this.rainOn ? 'Stop the rain sounds' : 'Listen to the rain';
      case 'mug':
        return 'Take a sip';
      case 'plant':
        return 'Brush the plant';
      case 'window':
        return 'Watch the storm';
      case 'note':
        return 'Read the next note';
      case 'notebook':
        return 'Nudge the notebook';
    }
  }

  click(clientX: number, clientY: number): boolean {
    if (!this.interactive()) return false;
    const found = this.pick(clientX, clientY);
    if (!found) return false;
    if (found.id === 'keyboard' && found.hit.instanceId !== undefined) {
      this.pressed.set(found.hit.instanceId, this.clock.getElapsedTime());
      this.onDeskEvent({ type: 'key' });
      return true;
    }
    this.activate(found.id);
    return true;
  }

  activate(id: DeskObject) {
    const t = this.clock.getElapsedTime();
    this.anim[id] = t;
    switch (id) {
      case 'lamp':
        this.lampOn = !this.lampOn;
        if (this.lampOn) this.lampFlickerAt = t;
        this.onDeskEvent({ type: 'click' });
        break;
      case 'monitor':
        this.onDeskEvent({ type: 'login' });
        break;
      case 'keyboard':
        [...'portfolio'].forEach((ch, i) =>
          window.setTimeout(() => {
            this.pressKey(ch);
            this.onDeskEvent({ type: 'key' });
          }, i * 70),
        );
        break;
      case 'mouse':
        this.onDeskEvent({ type: 'click' });
        break;
      case 'headphones':
        this.onDeskEvent({ type: 'rain' });
        break;
      case 'window':
        this.lightning(t);
        break;
      case 'note':
        this.noteIndex = (this.noteIndex + 1) % NOTES.length;
        this.note.setLines(NOTES[this.noteIndex]);
        break;
      default:
        break;
    }
  }

  pressKey(ch: string) {
    const lower = ch.toLowerCase();
    const idx = this.keyMap.get(lower) ?? this.keyMap.get(ch);
    const t = this.clock.getElapsedTime();
    if (idx !== undefined) this.pressed.set(idx, t);
    if (ch !== lower && /[a-z]/i.test(ch)) {
      const shift = this.keyMap.get('shift');
      if (shift !== undefined) this.pressed.set(shift, t - 0.03);
    }
  }

  private animateKeys(t: number) {
    if (!this.pressed.size) return;
    for (const [idx, start] of this.pressed) {
      const k = t - start;
      // Fast press, short hold, springy release.
      const depth = k < 0.03 ? k / 0.03 : k < 0.1 ? 1 : Math.max(0, 1 - (k - 0.1) / 0.09);
      const b = this.keyBase[idx];
      const pos = b.pos.clone();
      pos.y -= depth * 0.0036;
      this.tmpM.compose(pos, b.quat, b.scale);
      this.caps.setMatrixAt(idx, this.tmpM);
      this.tmpC.copy(b.color).lerp(this.white, depth * 0.22);
      this.caps.setColorAt(idx, this.tmpC);
      if (k > 0.2) this.pressed.delete(idx);
    }
    this.caps.instanceMatrix.needsUpdate = true;
    if (this.caps.instanceColor) this.caps.instanceColor.needsUpdate = true;
  }

  setProgress(p: number) {
    this.progress = p;
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.aspect = w / h;
    // Portrait screens get a wider lens so the whole desk fits under the headline.
    this.fov = this.aspect < 0.9 ? 46 : FOV;
    this.renderer.setSize(w, h, false);
    this.composer?.setPixelRatio(this.pixelRatio);
    this.composer?.setSize(w, h);
    
    this.camera.aspect = this.aspect;
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
    if (this.dust) {
      // Points are sized in world units: pixels per unit at distance 1.
      this.dust.material.uniforms.uPixelRatio.value = (this.pixelRatio * h * 0.5) / Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
    }
  }

  private startPose() {
    const a = this.aspect;
    if (a < 0.9) {
      // Portrait: step back and frame the monitor centrally, leaving room for the name above.
      const back = 2.3 + (0.9 - a) * 1.2;
      return { pos: new THREE.Vector3(0.1, 1.5, back), target: new THREE.Vector3(0.1, 1.24, -0.1) };
    }
    const back = a > 1.9 ? 1.72 : 1.72 + (1.9 - a) * 0.55;
    return { pos: new THREE.Vector3(-0.3, 1.34, back), target: new THREE.Vector3(-0.08, 0.95, -0.12) };
  }

  private endPose() {
    const halfTan = Math.tan(THREE.MathUtils.degToRad(this.fov / 2));
    const screenZ = MONITOR_Z + 0.0125;
    const dH = SCREEN_H / (2 * halfTan);
    const dW = SCREEN_W / (2 * halfTan * this.aspect);
    const d = Math.min(dH, dW) * 0.97;
    return {
      pos: new THREE.Vector3(MONITOR_X, SCREEN_CY, screenZ + d),
      target: new THREE.Vector3(MONITOR_X, SCREEN_CY, screenZ),
    };
  }

  private frame = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const p = easeInOut(Math.min(1, Math.max(0, this.progress)));
    const a = this.startPose();
    const b = this.endPose();
    const mid = a.pos.clone().lerp(b.pos, 0.45);
    mid.y += 0.06;
    const curve = new THREE.QuadraticBezierCurve3(a.pos, mid, b.pos);
    const pos = curve.getPoint(p);
    const target = a.target.clone().lerp(b.target, Math.min(1, p * 1.25));

    this.pointerSmooth.lerp(this.pointer, 0.05);
    const sway = (1 - p) * 0.05;
    pos.x += this.pointerSmooth.x * sway;
    pos.y += this.pointerSmooth.y * sway * 0.5;

    this.camera.position.copy(pos);
    this.camera.lookAt(target);
    this.screenGlow.intensity = 6 + p * 4;

    const t = this.clock.getElapsedTime();
    this.rain.material.uniforms.uTime.value = t;
    this.dust.material.uniforms.uTime.value = t;
    this.steam.update(t, 1 + this.bump('mug', t) * 2.2);
    this.animateKeys(t);
    this.grain.uniforms.uTime.value = t % 10;

    // Rare, soft lightning: a double flicker, then thunder if sound is on.
    if (!this.reduceMotion && t > this.nextFlash) this.lightning(t);
    this.updateLamp(t);
    this.updateObjects(t);
    const ft = t - this.flashStart;
    const flash = ft < 0.6 ? Math.max(0, Math.exp(-ft * 22) * 0.9, Math.exp(-Math.abs(ft - 0.18) * 30) * 0.6) : 0;
    this.rain.material.uniforms.uFlash.value = flash;
    this.windowLight.intensity = 1.6 + flash * 26;
    this.hemi.intensity = 0.35 + flash * 0.6;

    // Bloom eases off as the screen fills the view, so the lock screen stays crisp for the handoff.
    this.bloom.strength = 0.34 * (1 - p * 0.9);
    this.composer.render();
    if (!this.firstFrameDone) {
      this.firstFrameDone = true;
      this.onFirstFrame();
    }
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    window.clearInterval(this.clockTimer);
    this.disposables.forEach((d) => d.dispose());
    this.composer.dispose();
    this.renderer.dispose();
  }
}
