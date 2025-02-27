import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

// 🎬 Създаване на сцена
const scene = new THREE.Scene();

// 🎥 Камера
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 5);

// 🎨 Рендерер с прозрачност
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 💡 Добавяме HDR околно осветление (IBL)
new RGBELoader().load("textures/studio.hdr", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = null; // Запазва прозрачен фон
});

// 🔥 Осветление
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

//const pointLight = new THREE.PointLight(0xffffff, 1, 10);
//pointLight.position.set(2, 2, 2);
//scene.add(pointLight);

// 🎮 Контроли за въртене
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 📦 Зареждане на 3D модела
const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

loader.load("models/ring.glb", (gltf) => {
    const ring = gltf.scene;
    scene.add(ring);

    let metalMaterial = null;
    let stoneMaterial = null;

    // 🔍 Откриване на материали по име
    ring.traverse((child) => {
        if (child.isMesh) {
            if (child.material.name === "Metal") {
                metalMaterial = new THREE.MeshPhysicalMaterial({
                    map: textureLoader.load("textures/metal_gold.jpg"), // Начална текстура за злато
                    metalness: 1.0, // Пълен метал
                    roughness: 0.1, // Много гладък
                    envMapIntensity: 4.0, // Много силно отражение
                    clearcoat: 1.0, // Clearcoat слой
                    clearcoatRoughness: 0.1, // Много гладък clearcoat
                    ior: 2.5, // Индекс на пречупване
                    reflectivity: 0.95,// Висока отражателна способност
                    emissiveIntensity: 0.2
                });
                child.material = metalMaterial;
            } else if (child.material.name === "Stone") {
                stoneMaterial = new THREE.MeshBasicMaterial({
                    map: textureLoader.load("textures/white.jpg"), // Начална текстура за камък
                    roughness: 0.1, // Много гладък
                    metalness: 0.0, // Неметал
                    //transmission: 0.5, // Прозрачност
                    opacity: 0.95, // Лека прозрачност
                    transparent: true, // Прозрачен материал
                    ior: 1.5, // Индекс на пречупване
                    //emissive: new THREE.Color(0xFFFFFF), // Добавяне на emissive за по-ярък цвят
                    emissiveIntensity: 1, // Интензивност на emissive
                    envMapIntensity: 1.5,
                    clearcoatRoughness: 0.5,
                    clearcoat: 1.0,
                    //emissive: new THREE.Color("#990000")
                });
                child.material = stoneMaterial;
            }
        }
    });

    // 🎛️ Обработка на избор на метала
    const metalTextures = {
        Gold: "textures/metal_gold.jpg",
        Silver: "textures/metal_silver.jpg",
        RoseGold: "textures/metal_rosegold.jpg"
    };

    document.querySelectorAll('.metal-option button').forEach(button => {
        button.addEventListener('click', () => {
            const metalType = button.getAttribute('data-metal');
            const texturePath = metalTextures[metalType];
            if (metalMaterial) {
                textureLoader.load(texturePath, (texture) => {
                    metalMaterial.map = texture; // Прилагане на текстурата
                    metalMaterial.needsUpdate = true; // Актуализиране на материала
                });
            }
        });
    });

    // 🎛️ Обработка на избор на камъка
    const stoneTextures = {
        "white": "textures/white.jpg",
        "blue_light": "textures/blue_light.jpg",
        "blue": "textures/blue.jpg",
        "blue_dark": "textures/blue_dark.jpg",
        "grey": "textures/grey.jpg",
        "green": "textures/green.jpg",
        "red": "textures/red.jpg",
        "yellow": "textures/yellow.jpg"
    };

    const stoneOpacity = {
        "white": 0.95, // Бял халцедон
        "blue_light": 1.0, // Светло син халцедон
        "blue": 0.98, // Син халцедон
        "blue_dark": 0.93, // Тъмно син халцедон
        "grey": 0.98, // Сив халцедон
        "yellow": 1.0, // Жълт яспис
        "red": 1.0, // Червен яспис
        "green": 1.0  // Зелен яспис
    };
    
    document.querySelectorAll('.stone-option button').forEach(button => {
        button.addEventListener('click', () => {
            const stoneColor = button.getAttribute('data-stone');
            const texturePath = stoneTextures[stoneColor];
    
            if (stoneMaterial) {
                textureLoader.load(texturePath, (texture) => {
                    stoneMaterial.map = texture; // Зареждане на текстурата
                    stoneMaterial.color.set(0xffffff); // Запазване на оригиналния цвят на текстурата
                    
                    // Приложение на opacity според избрания камък
                    stoneMaterial.opacity = stoneOpacity[stoneColor] || 1.0; 
                    stoneMaterial.transparent = stoneMaterial.opacity < 1.0; // Ако opacity е 1, прозрачността се изключва
    
                    stoneMaterial.needsUpdate = true; // Актуализиране на материала
                });
            }
        });
    });
    
    

    animate();
});

// 🔄 Анимация
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 📏 Преоразмеряване
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});