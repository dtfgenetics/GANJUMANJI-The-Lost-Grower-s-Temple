import * as THREE from 'three';
import type { GameState } from '../simulation/state';
import { TEMPLE_ATRIUM } from '../simulation/world-data';

export class TempleWorldRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);

  private readonly player = new THREE.Group();
  private readonly sigilMeshes = new Map<string, THREE.Group>();
  private readonly hazardMeshes: THREE.Mesh[] = [];
  private readonly gateBarrier: THREE.Mesh;
  private elapsed = 0;

  constructor(private readonly mount: HTMLElement, private readonly onContextProblem: (message: string) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.id = 'game-canvas';
    this.renderer.domElement.setAttribute('aria-label', 'Ganjumanji 3D Temple Atrium');
    this.renderer.domElement.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.onContextProblem('3D context paused. The browser is restoring the Temple Atrium.');
    });
    this.renderer.domElement.addEventListener('webglcontextrestored', () => {
      this.onContextProblem('3D context restored. Continue exploring.');
    });
    mount.append(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x07120c);
    this.scene.fog = new THREE.FogExp2(0x07120c, 0.018);

    this.addLighting();
    this.addArchitecture();
    this.addPlayer();
    this.addSigils();
    this.addHazards();
    this.gateBarrier = this.addGate();

    this.camera.position.set(0, 7, 16);
    this.camera.lookAt(0, 1, 4);
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  update(state: GameState, dtSeconds: number) {
    this.elapsed += dtSeconds;
    this.player.position.set(state.player.x, 0.95, state.player.z);
    const yaw = Math.atan2(state.facing.x, state.facing.z);
    this.player.rotation.y = yaw;

    for (const sigil of TEMPLE_ATRIUM.sigils) {
      const mesh = this.sigilMeshes.get(sigil.id);
      if (!mesh) continue;
      mesh.visible = !state.collectedSigils.includes(sigil.id);
      mesh.rotation.y += dtSeconds * 1.1;
      mesh.position.y = 1.15 + Math.sin(this.elapsed * 2 + sigil.x) * 0.12;
    }

    this.hazardMeshes.forEach((mesh, index) => {
      mesh.scale.y = 0.75 + Math.sin(this.elapsed * 3 + index) * 0.15;
      mesh.rotation.y += dtSeconds * 0.45;
    });

    const gateOpen = state.collectedSigils.length === TEMPLE_ATRIUM.sigils.length;
    this.gateBarrier.visible = !gateOpen;

    const desiredCamera = new THREE.Vector3(
      state.player.x - state.facing.x * 7.8,
      6.4,
      state.player.z - state.facing.z * 7.8,
    );
    const smoothing = 1 - Math.exp(-dtSeconds * 5.5);
    this.camera.position.lerp(desiredCamera, smoothing);
    this.camera.lookAt(state.player.x, 1.1, state.player.z);

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.mount.replaceChildren();
  }

  private resize = () => {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private addLighting() {
    const hemi = new THREE.HemisphereLight(0xa4d9b2, 0x142015, 1.4);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xf4df9a, 2.2);
    sun.position.set(-8, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -22;
    sun.shadow.camera.right = 22;
    sun.shadow.camera.top = 22;
    sun.shadow.camera.bottom = -22;
    this.scene.add(sun);

    const gateGlow = new THREE.PointLight(0xdab45c, 12, 18, 2);
    gateGlow.position.set(0, 4, -17);
    this.scene.add(gateGlow);
  }

  private addArchitecture() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 36),
      new THREE.MeshStandardMaterial({ color: 0x183523, roughness: 0.92, metalness: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -4;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const path = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 31),
      new THREE.MeshStandardMaterial({ color: 0x4a4430, roughness: 1 }),
    );
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.012, -3.5);
    path.receiveShadow = true;
    this.scene.add(path);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x35583c, roughness: 0.88 });
    for (const obstacle of TEMPLE_ATRIUM.obstacles) {
      const height = obstacle.id.includes('pillar') ? 5.5 : obstacle.id === 'center-altar' ? 1.6 : 4.4;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(obstacle.halfWidth * 2, height, obstacle.halfDepth * 2),
        wallMaterial,
      );
      mesh.position.set(obstacle.x, height / 2, obstacle.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.55, 8),
      new THREE.MeshStandardMaterial({ color: 0x6a5c39, roughness: 0.75 }),
    );
    altar.position.set(0, 1.85, -5.5);
    altar.castShadow = true;
    this.scene.add(altar);

    const vines = new THREE.Group();
    const vineMaterial = new THREE.MeshStandardMaterial({ color: 0x2a7c46, roughness: 0.8 });
    for (let i = 0; i < 18; i += 1) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.8 + (i % 4) * 0.45, 6), vineMaterial);
      const side = i % 2 === 0 ? -1 : 1;
      stalk.position.set(side * (8.5 + (i % 4)), 0.9, 9 - i * 1.45);
      stalk.rotation.z = side * (0.1 + (i % 3) * 0.05);
      vines.add(stalk);
    }
    this.scene.add(vines);
  }

  private addPlayer() {
    const seedMaterial = new THREE.MeshStandardMaterial({ color: 0xc49355, roughness: 0.65 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 16), seedMaterial);
    body.scale.set(0.8, 1.15, 0.62);
    body.castShadow = true;
    body.position.y = 0.2;
    this.player.add(body);

    const sproutMaterial = new THREE.MeshStandardMaterial({ color: 0x69c86e, roughness: 0.72 });
    const sprout = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.7, 8), sproutMaterial);
    sprout.position.set(0, 0.95, 0);
    sprout.rotation.z = -0.18;
    this.player.add(sprout);

    const leafA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), sproutMaterial);
    leafA.scale.set(1.6, 0.35, 0.7);
    leafA.position.set(-0.2, 1.23, 0);
    leafA.rotation.z = 0.35;
    this.player.add(leafA);
    const leafB = leafA.clone();
    leafB.position.x = 0.2;
    leafB.rotation.z = -0.35;
    this.player.add(leafB);

    this.scene.add(this.player);
  }

  private addSigils() {
    for (const sigil of TEMPLE_ATRIUM.sigils) {
      const group = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.52, 0.13, 10, 22),
        new THREE.MeshStandardMaterial({ color: sigil.color, emissive: sigil.color, emissiveIntensity: 1.25, roughness: 0.35 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.castShadow = true;
      group.add(ring);
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.28),
        new THREE.MeshStandardMaterial({ color: 0xf5e8b5, emissive: sigil.color, emissiveIntensity: 0.8 }),
      );
      group.add(core);
      group.position.set(sigil.x, 1.15, sigil.z);
      this.scene.add(group);
      this.sigilMeshes.set(sigil.id, group);
    }
  }

  private addHazards() {
    for (const hazard of TEMPLE_ATRIUM.hazards) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(hazard.radius * 0.72, hazard.radius, 0.42, 16, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x8b3b25,
          emissive: 0x5d1e13,
          emissiveIntensity: 1.1,
          transparent: true,
          opacity: 0.82,
          side: THREE.DoubleSide,
        }),
      );
      mesh.position.set(hazard.x, 0.22, hazard.z);
      this.scene.add(mesh);
      this.hazardMeshes.push(mesh);
    }
  }

  private addGate() {
    const stone = new THREE.MeshStandardMaterial({ color: 0x5b6545, roughness: 0.82 });
    for (const x of [-2.5, 2.5]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(1.25, 6.4, 1.4), stone);
      post.position.set(x, 3.2, -18);
      post.castShadow = true;
      this.scene.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.3, 1.15, 1.5), stone);
    lintel.position.set(0, 6.05, -18);
    lintel.castShadow = true;
    this.scene.add(lintel);

    const barrier = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.9),
      new THREE.MeshBasicMaterial({ color: 0xd1a84d, transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
    );
    barrier.position.set(0, 2.65, -17.2);
    this.scene.add(barrier);
    return barrier;
  }
}
