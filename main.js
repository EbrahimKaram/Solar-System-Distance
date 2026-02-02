import * as THREE from "three";
import { OrbitControls } from "https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js";

const AU_IN_KM = 149_597_870.7;

const planets = [
  { name: "Mercury", au: 0.39, color: "#a7a7a7", size: 0.6 },
  { name: "Venus", au: 0.72, color: "#f5c16c", size: 0.9 },
  { name: "Earth", au: 1.0, color: "#61a5ff", size: 1.0 },
  { name: "Mars", au: 1.52, color: "#ff6b4a", size: 0.75 },
  { name: "Jupiter", au: 5.2, color: "#f7d1a4", size: 2.2 },
  { name: "Saturn", au: 9.58, color: "#f2e3b5", size: 2.0 },
  { name: "Uranus", au: 19.2, color: "#7ad7f0", size: 1.6 },
  { name: "Neptune", au: 30.05, color: "#4b74ff", size: 1.6 }
];

const planetASelect = document.getElementById("planetA");
const planetBSelect = document.getElementById("planetB");
const distanceAuEl = document.getElementById("distanceAu");
const distanceKmEl = document.getElementById("distanceKm");

planets.forEach((planet, index) => {
  const optionA = document.createElement("option");
  optionA.value = index;
  optionA.textContent = planet.name;
  planetASelect.appendChild(optionA);

  const optionB = document.createElement("option");
  optionB.value = index;
  optionB.textContent = planet.name;
  planetBSelect.appendChild(optionB);
});

planetASelect.value = 2;
planetBSelect.value = 3;

function updateDistance() {
  const a = planets[Number(planetASelect.value)];
  const b = planets[Number(planetBSelect.value)];
  const distanceAu = Math.abs(a.au - b.au);
  const distanceKm = distanceAu * AU_IN_KM;
  distanceAuEl.textContent = distanceAu.toFixed(2);
  distanceKmEl.textContent = distanceKm.toLocaleString(undefined, {
    maximumFractionDigits: 0
  });
}

planetASelect.addEventListener("change", updateDistance);
planetBSelect.addEventListener("change", updateDistance);
updateDistance();

const canvas = document.getElementById("space");
const tooltip = document.getElementById("tooltip");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 4000);
camera.position.set(0, 60, 90);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 12;
controls.maxDistance = 800;
controls.maxPolarAngle = Math.PI * 0.9;
controls.target.set(0, 0, 0);

const light = new THREE.PointLight("#ffffff", 2, 200);
light.position.set(0, 0, 0);
scene.add(light);

const ambient = new THREE.AmbientLight("#5a6bff", 0.4);
scene.add(ambient);

const starGeometry = new THREE.BufferGeometry();
const starCount = 3000;
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 2000;
  starPositions[i + 1] = (Math.random() - 0.5) * 2000;
  starPositions[i + 2] = (Math.random() - 0.5) * 2000;
}
starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({ color: "#ffffff", size: 0.6 });
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const sunGeometry = new THREE.SphereGeometry(2.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: "#ffd17a" });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const planetMeshes = planets.map((planet) => {
  const geometry = new THREE.SphereGeometry(planet.size, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.4,
    metalness: 0.2
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
});

const orbitMaterial = new THREE.LineBasicMaterial({ color: "#1f2d4f" });
planets.forEach((planet) => {
  const radius = planet.au * 12;
  const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(80);
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p.x, 0, p.y)));
  const orbit = new THREE.LineLoop(geometry, orbitMaterial);
  scene.add(orbit);
});

const distanceLineMaterial = new THREE.LineBasicMaterial({ color: "#7bd0ff", linewidth: 2 });
const distanceLineGeometry = new THREE.BufferGeometry();
const distanceLine = new THREE.Line(distanceLineGeometry, distanceLineMaterial);
scene.add(distanceLine);

function updateHighlights() {
  const indexA = Number(planetASelect.value);
  const indexB = Number(planetBSelect.value);

  planetMeshes.forEach((mesh, index) => {
    if (index === indexA || index === indexB) {
      mesh.material.emissive.setHex(0x444444);
      mesh.scale.setScalar(1.5);
    } else {
      mesh.material.emissive.setHex(0x000000);
      mesh.scale.setScalar(1.0);
    }
  });
}

planetASelect.addEventListener("change", updateHighlights);
planetBSelect.addEventListener("change", updateHighlights);
// Initial highlight
updateHighlights();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function updateTooltip(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planetMeshes);

  if (intersects.length) {
    const index = planetMeshes.indexOf(intersects[0].object);
    const planet = planets[index];
    tooltip.style.opacity = "1";
    tooltip.style.left = `${event.clientX - rect.left}px`;
    tooltip.style.top = `${event.clientY - rect.top}px`;
    tooltip.textContent = `${planet.name} • ${planet.au} AU`;
  } else {
    tooltip.style.opacity = "0";
  }
}

canvas.addEventListener("mousemove", updateTooltip);
canvas.addEventListener("mouseleave", () => (tooltip.style.opacity = "0"));

function resize() {
  const { clientWidth, clientHeight } = canvas.parentElement;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

let time = 0;
function animate() {
  time += 0.002;
  planets.forEach((planet, index) => {
    const radius = planet.au * 12;
    const speed = 0.2 / (planet.au + 0.2);
    planetMeshes[index].position.set(
      Math.cos(time * speed) * radius,
      0,
      Math.sin(time * speed) * radius
    );
  });

  const indexA = Number(planetASelect.value);
  const indexB = Number(planetBSelect.value);
  const posA = planetMeshes[indexA].position;
  const posB = planetMeshes[indexB].position;
  distanceLine.geometry.setFromPoints([posA, posB]);

  stars.rotation.y += 0.0003;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
