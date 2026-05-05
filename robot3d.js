import * as THREE from "https://unpkg.com/three@0.165.0/build/three.module.js";

const mount = document.querySelector("#robot3d");

if (mount) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 1.2, 7.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  mount.replaceChildren(renderer.domElement);

  const robot = new THREE.Group();
  scene.add(robot);

  const pointer = new THREE.Vector2(0, 0);
  const pointerTarget = new THREE.Vector2(0, 0);

  const matShell = new THREE.MeshStandardMaterial({
    color: 0xd9d3c9,
    roughness: 0.38,
    metalness: 0.25
  });
  const matWhite = new THREE.MeshStandardMaterial({
    color: 0xf2eee7,
    roughness: 0.32,
    metalness: 0.18
  });
  const matDark = new THREE.MeshStandardMaterial({
    color: 0x07080d,
    roughness: 0.22,
    metalness: 0.48
  });
  const matBlue = new THREE.MeshStandardMaterial({
    color: 0x247ad6,
    roughness: 0.28,
    metalness: 0.34
  });
  const matGlow = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2.6,
    roughness: 0.05,
    metalness: 0.1
  });
  const matCyan = new THREE.MeshStandardMaterial({
    color: 0x50dce9,
    emissive: 0x1ac7da,
    emissiveIntensity: 1.25,
    roughness: 0.2,
    metalness: 0.2
  });
  const matLime = new THREE.MeshStandardMaterial({
    color: 0xc4e817,
    emissive: 0x8ab000,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    metalness: 0.2
  });
  const matCoral = new THREE.MeshStandardMaterial({
    color: 0xf58f72,
    emissive: 0xcf5536,
    emissiveIntensity: 0.9,
    roughness: 0.24,
    metalness: 0.18
  });

  function roundedShape(width, height, radius) {
    const x = -width / 2;
    const y = -height / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }

  function roundedBox(width, height, depth, radius, material, bevel = 0.08) {
    const geometry = new THREE.ExtrudeGeometry(roundedShape(width, height, radius), {
      depth,
      bevelEnabled: true,
      bevelSegments: 8,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 16
    });
    geometry.center();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  const head = roundedBox(2.65, 1.75, 1.08, 0.34, matShell, 0.09);
  head.position.y = 1.82;
  head.rotation.y = -0.13;
  robot.add(head);

  const visor = new THREE.Mesh(
    new THREE.ShapeGeometry(roundedShape(2.08, 1.02, 0.22)),
    matDark
  );
  visor.position.set(0, 1.82, 0.57);
  visor.rotation.y = -0.13;
  robot.add(visor);

  const rimTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.08), matCyan);
  rimTop.position.set(-0.02, 2.38, 0.63);
  rimTop.rotation.z = -0.06;
  robot.add(rimTop);
  const rimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.84, 0.08), matLime);
  rimLeft.position.set(-1.14, 1.82, 0.63);
  robot.add(rimLeft);
  const rimRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.84, 0.08), matCoral);
  rimRight.position.set(1.14, 1.82, 0.63);
  robot.add(rimRight);
  const rimBottom = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.07, 0.08), matLime);
  rimBottom.position.set(0.05, 1.26, 0.63);
  robot.add(rimBottom);

  const eyeGeometry = new THREE.SphereGeometry(0.12, 32, 32);
  const leftEye = new THREE.Mesh(eyeGeometry, matGlow);
  const rightEye = new THREE.Mesh(eyeGeometry, matGlow);
  leftEye.position.set(-0.46, 1.86, 0.67);
  rightEye.position.set(0.46, 1.86, 0.67);
  robot.add(leftEye, rightEye);

  const topPanel = roundedBox(1.66, 0.26, 0.72, 0.11, matDark, 0.03);
  topPanel.position.set(0, 2.74, -0.05);
  topPanel.rotation.x = -0.16;
  robot.add(topPanel);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.28, 32), matShell);
  neck.position.y = 0.75;
  robot.add(neck);

  const torso = roundedBox(1.38, 1.6, 0.82, 0.28, matWhite, 0.07);
  torso.position.y = -0.14;
  torso.rotation.y = -0.05;
  robot.add(torso);

  const chest = roundedBox(0.66, 0.55, 0.06, 0.12, matShell, 0.02);
  chest.position.set(0, 0.1, 0.46);
  robot.add(chest);

  const cableLeft = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.46, 8, 16), matDark);
  cableLeft.position.set(-0.25, -0.36, 0.49);
  cableLeft.rotation.z = 0.08;
  const cableRight = cableLeft.clone();
  cableRight.position.x = 0.25;
  cableRight.rotation.z = -0.08;
  robot.add(cableLeft, cableRight);

  function makeArm(side) {
    const group = new THREE.Group();
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.27, 32, 32), matShell);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.82, 10, 24), side < 0 ? matBlue : matWhite);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 24), matShell);
    upper.position.y = -0.55;
    upper.rotation.z = side * -0.12;
    hand.position.y = -1.05;
    group.add(shoulder, upper, hand);
    group.position.set(side * 1.02, 0.33, 0.02);
    group.rotation.z = side * 0.3;
    robot.add(group);
    return group;
  }

  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  function makeLeg(side) {
    const group = new THREE.Group();
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 8, 16), matDark);
    const foot = roundedBox(0.54, 0.26, 0.7, 0.12, side < 0 ? matWhite : matBlue, 0.04);
    shin.position.y = -0.25;
    foot.position.y = -0.7;
    foot.position.z = 0.15;
    group.add(shin, foot);
    group.position.set(side * 0.38, -1.05, 0);
    robot.add(group);
    return group;
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.7, 0.16, 6),
    new THREE.MeshStandardMaterial({ color: 0x171719, roughness: 0.5, metalness: 0.35 })
  );
  platform.position.y = -2.08;
  platform.rotation.y = 0.5;
  robot.add(platform);

  const particles = new THREE.Group();
  for (let i = 0; i < 18; i += 1) {
    const mat = i % 3 === 0 ? matCyan : i % 3 === 1 ? matLime : matCoral;
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (i % 2) * 0.015, 12, 12), mat);
    particle.userData.angle = i * 0.63;
    particle.userData.radius = 1.7 + (i % 4) * 0.16;
    particle.userData.speed = 0.25 + (i % 5) * 0.05;
    particles.add(particle);
  }
  robot.add(particles);

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x50dce9, 1.4);
  fill.position.set(-4, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc4e817, 1.4);
  rim.position.set(2, 1, -4);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const resize = () => {
    const width = Math.max(280, mount.clientWidth);
    const height = Math.max(280, mount.clientHeight || width);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  mount.addEventListener("pointermove", (event) => {
    const rect = mount.getBoundingClientRect();
    pointerTarget.x = (event.clientX - rect.left) / rect.width - 0.5;
    pointerTarget.y = (event.clientY - rect.top) / rect.height - 0.5;
  });

  mount.addEventListener("pointerleave", () => {
    pointerTarget.set(0, 0);
  });

  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();
  const animate = () => {
    const elapsed = clock.getElapsedTime();
    pointer.lerp(pointerTarget, 0.08);

    robot.position.y = Math.sin(elapsed * 1.7) * 0.08;
    robot.rotation.y = -0.12 + pointer.x * 0.55 + Math.sin(elapsed * 0.6) * 0.08;
    robot.rotation.x = pointer.y * -0.12;
    head.rotation.y = -0.13 + pointer.x * 0.18;
    visor.rotation.y = -0.13 + pointer.x * 0.18;
    leftEye.position.x = -0.46 + pointer.x * 0.06;
    rightEye.position.x = 0.46 + pointer.x * 0.06;
    leftEye.position.y = 1.86 - pointer.y * 0.04;
    rightEye.position.y = 1.86 - pointer.y * 0.04;

    const blink = Math.sin(elapsed * 2.8) > 0.95 ? 0.18 : 1;
    leftEye.scale.y = blink;
    rightEye.scale.y = blink;

    leftArm.rotation.z = -0.32 + Math.sin(elapsed * 2.4) * 0.14;
    rightArm.rotation.z = 0.32 + Math.cos(elapsed * 2.1) * 0.12;
    leftLeg.position.y = -1.05 + Math.sin(elapsed * 3.2) * 0.025;
    rightLeg.position.y = -1.05 + Math.cos(elapsed * 3.2) * 0.025;
    platform.rotation.y += 0.003;

    particles.children.forEach((particle) => {
      const a = particle.userData.angle + elapsed * particle.userData.speed;
      const r = particle.userData.radius;
      particle.position.set(Math.cos(a) * r, 0.7 + Math.sin(a * 1.4) * 1.45, Math.sin(a) * 0.45);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  animate();
}
