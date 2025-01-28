import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let initialAlpha = 0, initialBeta = 0, initialGamma = 0;
let isCalibrated = false;

let smoothYaw = 0, smoothPitch = 0, smoothRoll = 0;
let accumulatedYaw = 0; // Akkumulierter Yaw-Wert
let lastYaw = 0; // Letzter gemessener Yaw-Wert

function applySmoothing(current, target, smoothingFactor = 0.1, maxDelta = Math.PI / 8) {
    if (Math.abs(target - current) > maxDelta) return current; // Ignoriere zu große Änderungen
    return current + (target - current) * smoothingFactor;
}

function robustDelta(currentYaw, lastYaw) {
    let delta = currentYaw - lastYaw;

    // Überprüfen auf 360°-Sprünge und korrigieren
    if (delta > Math.PI) {
        delta -= 2 * Math.PI;
    } else if (delta < -Math.PI) {
        delta += 2 * Math.PI;
    }

    return delta;
}

function accumulateYaw(currentYaw) {
    const delta = robustDelta(currentYaw, lastYaw);
    accumulatedYaw += delta; // Akkumuliere den Delta-Wert
    lastYaw = currentYaw; // Aktualisiere den letzten Yaw-Wert
    return accumulatedYaw; // Gib den kontinuierlichen Yaw-Wert zurück
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('test.jpg', () => {
        console.log('Texture loaded successfully!');
    });

    const geometry = new THREE.SphereGeometry(500, 128, 128);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    window.addEventListener('deviceorientation', (event) => {
        if (!isCalibrated) {
            initialAlpha = event.alpha || 0;
            initialBeta = event.beta || 0;
            initialGamma = event.gamma || 0;
            isCalibrated = true;
            lastYaw = THREE.MathUtils.degToRad(event.alpha || 0) - initialAlpha; // Initialisiere Yaw
        }

        const currentYaw = THREE.MathUtils.degToRad((event.alpha || 0) - initialAlpha);
        const continuousYaw = accumulateYaw(currentYaw);

        const rawPitch = THREE.MathUtils.degToRad((event.beta || 0) - initialBeta);
        const rawRoll = THREE.MathUtils.degToRad((event.gamma || 0) - initialGamma);

        const clampedPitch = Math.max(Math.min(rawPitch, Math.PI / 2 - 0.1), -Math.PI / 2 + 0.1);

        smoothYaw = applySmoothing(smoothYaw, continuousYaw);
        smoothPitch = applySmoothing(smoothPitch, clampedPitch);
        smoothRoll = applySmoothing(smoothRoll, rawRoll);

        camera.rotation.set(smoothPitch, smoothYaw, -smoothRoll);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('startButton').addEventListener('click', () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then((permissionState) => {
                if (permissionState === 'granted') {
                    init();
                    animate();
                    document.getElementById('startButton').style.display = 'none';
                } else {
                    alert('Permission denied for motion sensors.');
                }
            })
            .catch(console.error);
    } else {
        init();
        animate();
        document.getElementById('startButton').style.display = 'none';
    }
});
