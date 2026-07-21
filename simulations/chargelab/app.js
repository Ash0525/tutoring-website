let simulation = null;
let canvas = null;
let ctx = null;

let lastTime = 0;
let physicsCrashed = false;

let isDraggingSelected = false;
let mouseX = 0;
let mouseY = 0;

let currentMode = "select";

const MAX_FRAME_DT = 1.0 / 20.0;
const MAX_SUBSTEP_DT = 1.0 / 240.0;

const METERS_PER_PIXEL = 0.004;
const MIN_PHYSICAL_RADIUS_METERS = 1.0e-6;
const MAX_PHYSICAL_RADIUS_METERS = 1.0e-4;
const MIN_DISPLAY_RADIUS_PIXELS = 6.0;
const MAX_DISPLAY_RADIUS_PIXELS = 18.0;

const DEFAULT_CHARGE_MICROCOULOMBS = 1.0;
const DEFAULT_MASS_KILOGRAMS = 0.1;
const DEFAULT_RADIUS_METERS = 1.0e-5;

function metersToPixels(meters) {
    return meters / METERS_PER_PIXEL;
}

function pixelsToMeters(pixels) {
    return pixels * METERS_PER_PIXEL;
}

function physicalRadiusToDisplayPixels(radiusMeters) {
    const clampedRadius = Math.max(
        MIN_PHYSICAL_RADIUS_METERS,
        Math.min(MAX_PHYSICAL_RADIUS_METERS, radiusMeters)
    );
    const rangeInDecades = Math.log10(MAX_PHYSICAL_RADIUS_METERS) -
        Math.log10(MIN_PHYSICAL_RADIUS_METERS);
    const positionInRange = (
        Math.log10(clampedRadius) - Math.log10(MIN_PHYSICAL_RADIUS_METERS)
    ) / rangeInDecades;

    return MIN_DISPLAY_RADIUS_PIXELS +
        positionInRange * (MAX_DISPLAY_RADIUS_PIXELS - MIN_DISPLAY_RADIUS_PIXELS);
}

function displayPixelsToPhysicalRadius(radiusPixels) {
    const positionInRange = (
        radiusPixels - MIN_DISPLAY_RADIUS_PIXELS
    ) / (MAX_DISPLAY_RADIUS_PIXELS - MIN_DISPLAY_RADIUS_PIXELS);
    const clampedPosition = Math.max(0, Math.min(1, positionInRange));
    const exponent = Math.log10(MIN_PHYSICAL_RADIUS_METERS) +
        clampedPosition * (
            Math.log10(MAX_PHYSICAL_RADIUS_METERS) -
            Math.log10(MIN_PHYSICAL_RADIUS_METERS)
        );

    return 10 ** exponent;
}

function isFiniteParticleValue(value) {
    return Number.isFinite(value);
}

function stepSimulationSafely(frameDt) {
    let remaining = Math.max(0, Math.min(frameDt, MAX_FRAME_DT));

    while (remaining > 0) {
        const stepDt = Math.min(remaining, MAX_SUBSTEP_DT);
        simulation.update(stepDt);
        remaining -= stepDt;
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawForceVectors();

    const particleCount = simulation.getParticleCount();

    for (let i = 0; i < particleCount; i++) {
        const x = simulation.getParticleX(i);
        const y = simulation.getParticleY(i);
        const radius = simulation.getParticleRadius(i);
        const charge = simulation.getParticleCharge(i);

        if (!isFiniteParticleValue(x) ||
            !isFiniteParticleValue(y) ||
            !isFiniteParticleValue(radius) ||
            radius <= 0) {
            console.warn("Skipping particle with invalid numeric state", {
                index: i,
                x,
                y,
                radius,
                charge
            });
            continue;
        }

        if (charge > 0) {
            ctx.fillStyle = "red";
        }
        else if (charge < 0) {
            ctx.fillStyle = "blue";
        }
        else {
            ctx.fillStyle = "white";
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        if (simulation.hasSelected() && i === simulation.getSelectedIndex()) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
}

function animationLoop(currentTime) {
    const dt = (currentTime - lastTime) / 1000.0;
    lastTime = currentTime;

    if (simulation !== null && !physicsCrashed) {
        try {
            if (Number.isFinite(dt) && dt >= 0) {
                if (isDraggingSelected && simulation.hasSelected()) {
                    simulation.moveSelected(mouseX, mouseY);
                    simulation.setSelectedVelocity(0.0, 0.0);
                }

                stepSimulationSafely(dt);

                if (isDraggingSelected && simulation.hasSelected()) {
                    simulation.moveSelected(mouseX, mouseY);
                    simulation.setSelectedVelocity(0.0, 0.0);
                }
            }

            drawParticles();

            // Update the panel
            updateSelectedPanel();
            updateSelectedEditorInputs();

            // Update user input

        } catch (error) {
            physicsCrashed = true;
            console.error("Simulation failed somehow ya noob", error);
        }
    }
    requestAnimationFrame(animationLoop);
}

// Mouse helper functions

function getMousePosition(event) {

    // Identify where the canvas is and how big it is
    const rect = canvas.getBoundingClientRect();

    // Visual resize for CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Small state pieces that remember what the mouse is doing
    mouseX = (event.clientX - rect.left) * scaleX;
    mouseY = (event.clientY - rect.top) * scaleY;
}

function setupMouseControls() {
    canvas.addEventListener("mousedown", (event) => {
        getMousePosition(event);

        // Add mode selections
        if (currentMode === "positive") {
            simulation.addParticleAtFull(
                mouseX,
                mouseY,
                DEFAULT_CHARGE_MICROCOULOMBS,
                DEFAULT_MASS_KILOGRAMS,
                physicalRadiusToDisplayPixels(DEFAULT_RADIUS_METERS)
            );
            simulation.setME0();
            return;
        }

        if (currentMode === "negative") {
            simulation.addParticleAtFull(
                mouseX,
                mouseY,
                -DEFAULT_CHARGE_MICROCOULOMBS,
                DEFAULT_MASS_KILOGRAMS,
                physicalRadiusToDisplayPixels(DEFAULT_RADIUS_METERS)
            );
            simulation.setME0();
            return;
        }
        // Boolean in selected if the mouse is at particle
        const selected = simulation.selectParticleAt(mouseX, mouseY);

        // If selected is true, then dragging is true
        if (selected) {
            isDraggingSelected = true;
        }
        else {
            simulation.clearSelected();
            isDraggingSelected = false;
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        getMousePosition(event);

        if (isDraggingSelected && simulation.hasSelected()) {
            simulation.moveSelected(mouseX, mouseY);
            simulation.setSelectedVelocity(0.0, 0.0);
        }
    });

    // When the user releases the mouse button
    canvas.addEventListener("mouseup", () => {
        isDraggingSelected = false;
    });

    // When the mouse leaves the canvas area
    canvas.addEventListener("mouseleave", () => {
        isDraggingSelected = false;
    });
}

// Vector Drawing
function drawArrow(startX, startY, endX, endY, color) {
    const dx = endX - startX;
    const dy = endY - startY;
    const arrowLength = Math.hypot(dx, dy);

    if (!Number.isFinite(arrowLength) || arrowLength <= 0) {
        return;
    }

    const headLength = Math.max(6, Math.min(18, arrowLength * 0.25));
    const angle = Math.atan2(endY - startY, endX - startX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    
    // Draw the arrow heads
    ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
    );

    ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
    );

    ctx.closePath();
    ctx.fill();
}

function getForceArrowLength(forceMagnitude) {
    if (!Number.isFinite(forceMagnitude) || forceMagnitude <= 0) {
        return 0;
    }

    const forceNewtons = forceMagnitude * METERS_PER_PIXEL;
    const minArrowLength = 8;
    const maxArrowLength = 120;
    const minForceExponent = -6;
    const maxForceExponent = 4;
    const forceExponent = Math.log10(forceNewtons);
    const scalePosition = (
        forceExponent - minForceExponent
    ) / (maxForceExponent - minForceExponent);
    const scaledLength = minArrowLength +
        scalePosition * (maxArrowLength - minArrowLength);

    return Math.max(minArrowLength, Math.min(maxArrowLength, scaledLength));
}

// Draw force vectors
// Takes the drawArrow function and applies the C++ physics to it

function drawForceVectors() {
    if (!simulation.hasSelected()) {
        return;
    }

    // Get the index of the selected particle
    const selectedIndex = simulation.getSelectedIndex();

    const startX = simulation.getParticleX(selectedIndex);
    const startY = simulation.getParticleY(selectedIndex);

    // Get the particle count
    const particleCount = simulation.getParticleCount();

    let forceData = [];

    for (let i = 0; i < particleCount; i++) {
        if (i === selectedIndex) {
            continue;
        }

        const force = simulation.getForceBetweenParticles(selectedIndex, i);

        const fx = force.getX();
        const fy = force.getY();
        const magnitude = force.magnitude();

        force.delete();

        forceData.push({ fx, fy, magnitude });
    }

    for (const force of forceData) {
        if (!Number.isFinite(force.magnitude) || force.magnitude <= 0) {
            continue;
        }

        // Normalize force vector
        const unitX = force.fx / force.magnitude;
        const unitY = force.fy / force.magnitude;

        const arrowLength = getForceArrowLength(force.magnitude);

        const endX = startX + unitX * arrowLength;
        const endY = startY + unitY * arrowLength;

        drawArrow(startX, startY, endX, endY, "yellow");
    }
}

// Add functionality to the buttons. Pause and clear buttons are in here together
function setupButtons() {

    // Simulation Control
    const pauseButton = document.getElementById("pauseButton");
    const clearButton = document.getElementById("clearButton");
    const resetDemoButton = document.getElementById("resetDemoButton");

    // Interaction Control
    const selectModeButton = document.getElementById("selectedModeButton");
    const positiveModeButton = document.getElementById("positiveModeButton");
    const negativeModeButton = document.getElementById("negativeModeButton");
    const fixedButton = document.getElementById("fixedButton");

    const applySelectedButton = document.getElementById("applySelectedButton");

    // Reset Demo Button functionality
    resetDemoButton.addEventListener("click", () => {
        resetDemo();
    })
    
    // Pause button functionality
    pauseButton.addEventListener("click", () => {
        // pause method from simulation
        simulation.togglePaused();

        // if isPaused is true or false
        if (simulation.isPaused()) {
            pauseButton.textContent = "Play";
        }
        else {
            pauseButton.textContent = "Pause";
        }
    });

    // Clear button functionality
    clearButton.addEventListener("click", () => {
        simulation.clearParticles();
        simulation.clearSelected();
    });

    // Select Mode button functionality
    selectModeButton.addEventListener("click", () => {
        currentMode = "select";
        console.log("Mode: select");
        updateModeButtons();
    });

    // Positive Mode button functionality
    positiveModeButton.addEventListener("click", () => {
        currentMode = "positive";
        console.log("Mode: positive");
        updateModeButtons();
    });

    // Negative Mode button functionality
    negativeModeButton.addEventListener("click", () => {
        currentMode = "negative";
        console.log("Mode: negative");
        updateModeButtons();
    });

    // Fixed button
    fixedButton.addEventListener("click", () => {
        if (!simulation.hasSelected()) {
            return;
        }

        const currentlyFixed = simulation.getSelectedFixed();
        simulation.setSelectedFixed(!currentlyFixed);

        if (simulation.getSelectedFixed()) {
            fixedButton.textContent = "Unfix Selected";
        }
        else {
            fixedButton.textContent = "Fix Selected";
        }
    });

    // Apply selected button takes user inputted values and applies them
    applySelectedButton.addEventListener("click", () => {
        if (!simulation.hasSelected()) {
            return;
        }

        // Get the values of each element
        const inputs = Array.from(document.querySelectorAll(".selected-editor input"));
        const invalidInput = inputs.find((input) => !input.checkValidity());

        if (invalidInput) {
            invalidInput.reportValidity();
            return;
        }

        const xMeters = parseFloat(document.getElementById("xInput").value);
        const yMeters = parseFloat(document.getElementById("yInput").value);
        const chargeMicrocoulombs = parseFloat(document.getElementById("chargeInput").value);
        const massKilograms = parseFloat(document.getElementById("massInput").value);
        const radiusMeters = parseFloat(document.getElementById("radiusInput").value);
        const vxMetersPerSecond = parseFloat(document.getElementById("vxInput").value);
        const vyMetersPerSecond = parseFloat(document.getElementById("vyInput").value);

        // If any are not a number, return
        if (
            Number.isNaN(xMeters) ||
            Number.isNaN(yMeters) ||
            Number.isNaN(chargeMicrocoulombs) ||
            Number.isNaN(massKilograms) ||
            Number.isNaN(radiusMeters) ||
            Number.isNaN(vxMetersPerSecond) ||
            Number.isNaN(vyMetersPerSecond)
        ) {
            return;
        }

        // Change the particle's values
        simulation.moveSelected(metersToPixels(xMeters), metersToPixels(yMeters));
        simulation.setSelectedCharge(chargeMicrocoulombs);
        simulation.setSelectedMass(massKilograms);
        simulation.setSelectedRadius(physicalRadiusToDisplayPixels(radiusMeters));
        simulation.setSelectedVelocity(
            metersToPixels(vxMetersPerSecond),
            metersToPixels(vyMetersPerSecond)
        );

        simulation.setME0();
    });

    updateModeButtons();
}

// Update the buttons to show selection
function updateModeButtons() {
    const selectModeButton = document.getElementById("selectedModeButton");
    const positiveModeButton = document.getElementById("positiveModeButton");
    const negativeModeButton = document.getElementById("negativeModeButton");

    selectModeButton.classList.remove("active-mode");
    positiveModeButton.classList.remove("active-mode");
    negativeModeButton.classList.remove("active-mode");

    if (currentMode === "select") {
        selectModeButton.classList.add("active-mode");
    }
    else if (currentMode === "positive") {
        positiveModeButton.classList.add("active-mode");
    }
    else if (currentMode === "negative") {
        negativeModeButton.classList.add("active-mode");
    }
}

function updateSelectedPanel() {
    const status = document.getElementById("selectedStatus");
    const charge = document.getElementById("selectedCharge");
    const mass = document.getElementById("selectedMass");
    const radius = document.getElementById("selectedRadius");
    const position = document.getElementById("selectedPosition");
    const velocity = document.getElementById("selectedVelocity");
    const fixed = document.getElementById("selectedFixed");

    if (!simulation.hasSelected()) {
        status.textContent = "No particle seleced";
        charge.textContent = "--";
        mass.textContent = "--";
        radius.textContent = "--";
        position.textContent = "--";
        velocity.textContent = "--";
        fixed.textContent = "--";
        return;
    }

    selectedStatus.textContent = "Particle Selected";

    const x = pixelsToMeters(simulation.getSelectedX()).toFixed(2);
    const y = pixelsToMeters(simulation.getSelectedY()).toFixed(2);
    
    const vx = pixelsToMeters(simulation.getSelectedVx()).toFixed(2);
    const vy = pixelsToMeters(simulation.getSelectedVy()).toFixed(2);

    charge.textContent = simulation.getSelectedCharge().toFixed(2);
    mass.textContent = simulation.getSelectedMass().toFixed(2);
    radius.textContent = displayPixelsToPhysicalRadius(
        simulation.getSelectedRadius()
    ).toExponential(2);

    position.textContent = `(${x}, ${y})`;
    velocity.textContent = `(${vx}, ${vy})`;

    selectedFixed.textContent = simulation.getSelectedFixed() ? "Yes" : "No";
}

// Update the particle with distinct user input
function updateSelectedEditorInputs() {
    const editor = document.querySelector(".selected-editor");

    if (editor.contains(document.activeElement)) {
        return;
    }

    const xInput = document.getElementById("xInput");
    const yInput = document.getElementById("yInput");
    const chargeInput = document.getElementById("chargeInput");
    const massInput = document.getElementById("massInput");
    const radiusInput = document.getElementById("radiusInput");
    const vxInput = document.getElementById("vxInput");
    const vyInput = document.getElementById("vyInput");

    if (!simulation.hasSelected()) {
        xInput.value = "";
        yInput.value = "";
        chargeInput.value = "";
        massInput.value = "";
        radiusInput.value = "";
        vxInput.value = "";
        vyInput.value = "";
        return;
    }

    xInput.value = pixelsToMeters(simulation.getSelectedX()).toFixed(2);
    yInput.value = pixelsToMeters(simulation.getSelectedY()).toFixed(2);
    chargeInput.value = simulation.getSelectedCharge().toFixed(2);
    massInput.value = simulation.getSelectedMass().toFixed(2);
    radiusInput.value = displayPixelsToPhysicalRadius(
        simulation.getSelectedRadius()
    ).toExponential(2);
    vxInput.value = pixelsToMeters(simulation.getSelectedVx()).toFixed(2);
    vyInput.value = pixelsToMeters(simulation.getSelectedVy()).toFixed(2);
}

// Reset Demo
function resetDemo() {
    physicsCrashed = false;

    simulation.clearParticles();
    simulation.clearSelected();

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const halfMeterInPixels = metersToPixels(0.5);
    const displayRadius = physicalRadiusToDisplayPixels(DEFAULT_RADIUS_METERS);

    simulation.addParticleAtFull(
        centerX - halfMeterInPixels,
        centerY,
        DEFAULT_CHARGE_MICROCOULOMBS,
        DEFAULT_MASS_KILOGRAMS,
        displayRadius
    );
    simulation.addParticleAtFull(
        centerX + halfMeterInPixels,
        centerY,
        -DEFAULT_CHARGE_MICROCOULOMBS,
        DEFAULT_MASS_KILOGRAMS,
        displayRadius
    );

    currentMode = "select";
    updateModeButtons();

    simulation.setME0();
}

function setupSidePanel() {
    const sidePanel = document.getElementById("sidePanel");
    const panelToggleButton = document.getElementById("panelToggleButton");
    const panelContent = document.getElementById("panelContent");

    panelToggleButton.addEventListener("click", () => {
        const isCollapsed = sidePanel.classList.toggle("collapsed");

        panelToggleButton.textContent = isCollapsed ? "Open Panel" : "Hide Panel";
        panelToggleButton.setAttribute("aria-expanded", String(!isCollapsed));
        panelContent.hidden = isCollapsed;
    });
}

setupSidePanel();

var Module = {
    onRuntimeInitialized: function () {
        console.log("ChargeLab WASM loaded!");

        canvas = document.getElementById("simCanvas");
        ctx = canvas.getContext("2d");

        simulation = new Module.Simulation(canvas.width, canvas.height);

        // Mouse controls
        setupMouseControls();

        // Clear and pause controls
        setupButtons();

        resetDemo();

        console.log("Particle count:", simulation.getParticleCount());

        lastTime = performance.now();
        requestAnimationFrame(animationLoop);
    }
};
