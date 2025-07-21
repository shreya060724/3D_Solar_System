class SolarSystem {
  constructor() {
    // Setting up the basic 3D scene, camera, and renderer from Three.js.
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('three-canvas'),
      antialias: true,
      alpha: true
    });

    // Core properties to manage the simulation's state.
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.isLightMode = false;

    // A place to store our planet objects and their data.
    this.planets = {};
    this.planetData = {
      mercury: { name: 'Mercury', distance: 15, size: 2.5, speed: 4.7, color: 0x8c7853 },
      venus: { name: 'Venus', distance: 22, size: 3.2, speed: 3.5, color: 0xffc649 },
      earth: { name: 'Earth', distance: 30, size: 3.5, speed: 3.0, color: 0x6b93d6 },
      mars: { name: 'Mars', distance: 40, size: 2.8, speed: 2.4, color: 0xc1440e },
      jupiter: { name: 'Jupiter', distance: 60, size: 10.0, speed: 1.3, color: 0xd8ca9d },
      saturn: { name: 'Saturn', distance: 80, size: 8.5, speed: 0.9, color: 0xfad5a5 },
      uranus: { name: 'Uranus', distance: 100, size: 6.5, speed: 0.7, color: 0x4fd0e7 },
      neptune: { name: 'Neptune', distance: 120, size: 6.2, speed: 0.5, color: 0x4b70dd }
    };

    this.init();
  }

  // Kicks everything off!
  init() {
    this.setupRenderer();
    this.setupCamera();
    this.createScene();
    this.setupControls();
    this.setupEventListeners();
    this.animate();

    // Hides the loading spinner once everything is ready.
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 1500);
  }

  // Configures the renderer to fill the screen and look pretty.
  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000011, 1);
  }

  // Sets up the camera's initial position.
  setupCamera() {
    this.camera.position.set(0, 50, 150);
    this.camera.lookAt(0, 0, 0);
  }

  // Builds all the visible parts of our solar system.
  createScene() {
    this.createStars();
    this.createSun();
    this.createPlanets();
    this.setupLighting();
  }

  // Creates a beautiful starfield for the background.
  createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 2 });
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);
  }

  // Creates our sun, the heart of the solar system.
  createSun() {
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.6
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.userData = { name: 'Sun' }; // Simplified userData
    this.scene.add(this.sun);

    // Adding some nice glow effects to make the sun look fiery.
    const innerGlow = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4 }));
    this.sun.add(innerGlow);
    const outerGlow = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.2 }));
    this.sun.add(outerGlow);
  }

  // Creates all the planets and their orbits.
  createPlanets() {
    Object.keys(this.planetData).forEach(key => {
      const data = this.planetData[key];
      const planetGeometry = new THREE.SphereGeometry(data.size, 32, 32);
      const planetMaterial = new THREE.MeshPhongMaterial({ color: data.color, shininess: 30 });
      const planet = new THREE.Mesh(planetGeometry, planetMaterial);
      planet.castShadow = true;
      planet.receiveShadow = true;
      planet.position.set(data.distance, 0, 0);

      // Storing data we'll need for animation right on the planet object.
      planet.userData = {
        name: data.name,
        originalDistance: data.distance,
        angle: Math.random() * Math.PI * 2, // Random starting position
        speed: data.speed,
      };

      // Drawing the nice grey line for the orbit.
      const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = -Math.PI / 2;
      this.scene.add(orbit);

      // Saturn gets its iconic rings!
      if (data.name === 'Saturn') {
        this.createSaturnRings(planet, data.size);
      }

      this.scene.add(planet);
      this.planets[key] = planet;
    });
  }

  // A special function just for Saturn's rings.
  createSaturnRings(saturn, planetSize) {
    const ringGeometry = new THREE.RingGeometry(planetSize * 1.5, planetSize * 2.5, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = -Math.PI / 2;
    saturn.add(rings);
  }

  // Sets up the lights to make everything visible and cast shadows.
  setupLighting() {
    this.scene.add(new THREE.AmbientLight(0x404040, 0.3)); // Soft, general light
    const sunLight = new THREE.PointLight(0xffffff, 2, 500); // The main light from the sun
    sunLight.castShadow = true;
    this.scene.add(sunLight);
    this.scene.add(new THREE.DirectionalLight(0xffffff, 0.5)); // An extra light for better visibility
  }

  // Connects the UI elements to our simulation.
  setupControls() {
    const controlsContainer = document.getElementById('planet-controls');
    const controlsBtn = document.getElementById('controls-btn');
    const controlPanel = document.getElementById('control-panel');
    const pauseBtn = document.getElementById('pause-btn');
    const themeBtn = document.getElementById('theme-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Create a speed slider for each planet.
    Object.keys(this.planetData).forEach(key => {
      const data = this.planetData[key];
      const controlDiv = document.createElement('div');
      controlDiv.className = 'planet-control';
      controlDiv.innerHTML = `
            <span class="planet-label">${data.name}</span>
            <input type="range" class="speed-slider" min="0" max="10" value="${data.speed}" step="0.1" data-planet="${key}">
            <span class="speed-value">${data.speed.toFixed(1)}x</span>
        `;
      controlsContainer.appendChild(controlDiv);
      const slider = controlDiv.querySelector('.speed-slider');
      const valueSpan = controlDiv.querySelector('.speed-value');
      slider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        this.planets[key].userData.speed = speed;
        valueSpan.textContent = `${speed.toFixed(1)}x`;
      });
    });

    // --- Main Control Button Listeners ---
    let controlsVisible = false;
    controlsBtn.addEventListener('click', () => {
      controlsVisible = !controlsVisible;
      controlPanel.classList.toggle('show', controlsVisible);
      controlsBtn.style.transform = controlsVisible ? 'rotate(45deg)' : 'rotate(0deg)';
    });

    document.addEventListener('click', (e) => {
      if (!controlPanel.contains(e.target) && !controlsBtn.contains(e.target) && controlsVisible) {
        controlsVisible = false;
        controlPanel.classList.remove('show');
        controlsBtn.style.transform = 'rotate(0deg)';
      }
    });

    pauseBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      pauseBtn.innerHTML = this.isPaused ? '▶️' : '⏸️';
    });

    themeBtn.addEventListener('click', () => {
      this.isLightMode = !this.isLightMode;
      document.body.classList.toggle('light-mode', this.isLightMode);
      themeBtn.innerHTML = this.isLightMode ? '☀️' : '🌙';
      this.renderer.setClearColor(this.isLightMode ? 0x222244 : 0x000011, 1);
    });

    resetBtn.addEventListener('click', () => this.resetPlanets());
  }

  // Puts all the planets and sliders back to their original state.
  resetPlanets() {
    Object.keys(this.planets).forEach(key => {
      const planet = this.planets[key];
      const originalSpeed = this.planetData[key].speed;
      planet.userData.speed = originalSpeed;
      planet.userData.angle = Math.random() * Math.PI * 2; // Re-randomize angle

      // Also reset the UI slider.
      const slider = document.querySelector(`input[data-planet="${key}"]`);
      const valueSpan = slider.parentElement.querySelector('.speed-value');
      slider.value = originalSpeed;
      valueSpan.textContent = `${originalSpeed.toFixed(1)}x`;
    });
    // And reset the camera view.
    this.camera.position.set(0, 50, 150);
    this.camera.lookAt(0, 0, 0);
  }

  // Handles all mouse and touch inputs for camera control.
  setupEventListeners() {
    const canvas = this.renderer.domElement;
    let mouseDown = false, mouseX = 0, mouseY = 0;
    let lastTouchX = 0, lastTouchY = 0, touchDistance = 0;

    // --- Mouse Controls (Drag to rotate, Scroll to zoom) ---
    const onMouseDown = (e) => { mouseDown = true; mouseX = e.clientX; mouseY = e.clientY; };
    const onMouseUp = () => { mouseDown = false; };
    const onMouseMove = (e) => {
      if (!mouseDown) return;
      const deltaX = e.clientX - mouseX;
      const deltaY = e.clientY - mouseY;
      const spherical = new THREE.Spherical().setFromVector3(this.camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * -0.01));
      this.camera.position.setFromSpherical(spherical);
      this.camera.lookAt(0, 0, 0);
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onWheel = (e) => {
      this.camera.position.multiplyScalar(1 + (e.deltaY > 0 ? 1 : -1) * 0.05);
      this.camera.position.clampLength(20, 500);
    };

    // --- Touch Controls (One finger to rotate, Pinch to zoom) ---
    const onTouchStart = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        const spherical = new THREE.Spherical().setFromVector3(this.camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - deltaY * -0.01));
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (touchDistance > 0) {
          this.camera.position.multiplyScalar(touchDistance / distance);
          this.camera.position.clampLength(20, 500);
        }
        touchDistance = distance;
      }
    };

    // Attaching all the event listeners.
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp); // Stop dragging if mouse leaves canvas
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('wheel', onWheel);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });

    // Adjusts the scene when the browser window is resized.
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // The main loop that runs every frame to update and render the scene.
  animate() {
    requestAnimationFrame(() => this.animate());
    const deltaTime = this.clock.getDelta();

    // We only update animations if the simulation isn't paused.
    if (!this.isPaused) {
      this.sun.rotation.y += deltaTime * 0.5;
      Object.values(this.planets).forEach(planet => {
        const userData = planet.userData;
        userData.angle += deltaTime * userData.speed * 0.1;
        planet.position.x = Math.cos(userData.angle) * userData.originalDistance;
        planet.position.z = Math.sin(userData.angle) * userData.originalDistance;
        planet.rotation.y += deltaTime * 2; // Planet's own rotation
      });
      if (this.stars) {
        this.stars.rotation.y += deltaTime * 0.05; // Gently rotate the stars
      }
    }

    // Finally, render the scene from the camera's perspective.
    this.renderer.render(this.scene, this.camera);
  }
}

// Create our Solar System once the page has loaded.
window.addEventListener('load', () => {
  new SolarSystem();
});