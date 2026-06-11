import * as THREE from "three";

const PALETTES = {
  gold:     { bead: 0xe7c27a, accent: 0xfff1c2, metal: 0xd4a851 },
  rose:     { bead: 0xc97b6e, accent: 0xf2c6bd, metal: 0xb56a5e },
  obsidian: { bead: 0x1a1a1f, accent: 0x4a4a55, metal: 0xc9a96a },
};

function createScene(mount, variant) {
  const palette = PALETTES[variant] || PALETTES.gold;
  const w = mount.clientWidth || 400;
  const h = mount.clientHeight || 400;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 0.4, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xfff1c2, 2.4);
  key.position.set(3, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb070, 1.3);
  rim.position.set(-3, -1, -2); scene.add(rim);
  const fill = new THREE.PointLight(0xffd089, 1.5, 10);
  fill.position.set(0, 1, 2); scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  const beadCount = 28;
  const radius = 1.5;
  const beadGeo = new THREE.SphereGeometry(0.18, 32, 32);
  const accentGeo = new THREE.SphereGeometry(0.22, 32, 32);
  const beadMat = new THREE.MeshPhysicalMaterial({
    color: palette.bead, metalness: 0.9, roughness: 0.18,
    clearcoat: 1, clearcoatRoughness: 0.1,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: palette.accent, metalness: 0.4, roughness: 0.05,
    transmission: 0.55, thickness: 0.5, ior: 1.5,
  });
  const metalMat = new THREE.MeshPhysicalMaterial({
    color: palette.metal, metalness: 1, roughness: 0.15,
  });

  for (let i = 0; i < beadCount; i++) {
    const a = (i / beadCount) * Math.PI * 2;
    const isAccent = i % 7 === 0;
    const m = new THREE.Mesh(isAccent ? accentGeo : beadGeo, isAccent ? accentMat : beadMat);
    m.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    group.add(m);
  }

  const charm = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 16, 64), metalMat);
  charm.position.set(0, -radius - 0.18, 0);
  group.add(charm);

  group.rotation.x = 0.4;

  let targetY = 0, targetX = 0.4;
  const onMove = (e) => {
    const r = mount.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 2 - 1;
    const y = ((e.clientY - r.top) / r.height) * 2 - 1;
    targetY = x * 0.6;
    targetX = 0.4 + y * 0.3;
  };
  mount.addEventListener("mousemove", onMove);

  const start = performance.now();
  let raf;
  function tick() {
    const t = (performance.now() - start) / 1000;
    group.rotation.y += (targetY + t * 0.15 - group.rotation.y) * 0.05;
    group.rotation.x += (targetX - group.rotation.x) * 0.05;
    group.position.y = Math.sin(t * 0.8) * 0.06;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  const ro = new ResizeObserver(() => {
    const W = mount.clientWidth, H = mount.clientHeight;
    if (!W || !H) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });
  ro.observe(mount);
}

// Init all 3D scenes
document.querySelectorAll(".scene").forEach((el) => {
  createScene(el, el.dataset.variant || "gold");
});

// Order buttons -> scroll + preset style
document.querySelectorAll("[data-order]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const style = btn.dataset.order;
    const select = document.querySelector('select[name="style"]');
    if (select) select.value = style;
    document.getElementById("order").scrollIntoView({ behavior: "smooth" });
  });
});

// Form submit
const form = document.getElementById("orderForm");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  form.innerHTML = `
    <div class="thanks">
      <div class="mark gold">✦</div>
      <h3 class="gold">Thank you, ${escapeHtml(data.name || "friend")}.</h3>
      <p class="muted">Your request is with our atelier. We'll be in touch shortly.</p>
    </div>`;
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
