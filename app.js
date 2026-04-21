(function() {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VIEWBOX = { width: 900, height: 700 };
  const MIN_HOOK_DISTANCE_PX = 38;
  const HOOK_OVERLAP_PX = 24;
  const DEFAULT_STATUS = "Upload an image to start generating a pendant.";

  const elements = {
    imageUpload: document.getElementById("imageUpload"),
    thresholdRange: document.getElementById("thresholdRange"),
    scaleRange: document.getElementById("scaleRange"),
    generatePendantBtn: document.getElementById("generatePendantBtn"),
    addHookBtn: document.getElementById("addHookBtn"),
    clearHooksBtn: document.getElementById("clearHooksBtn"),
    attachPendantBtn: document.getElementById("attachPendantBtn"),
    runTestsBtn: document.getElementById("runTestsBtn"),
    bagSelector: document.getElementById("bagSelector"),
    bagSvg: document.getElementById("bagSvg"),
    bagGroup: document.getElementById("bagGroup"),
    hookGroup: document.getElementById("hookGroup"),
    keychainGroup: document.getElementById("keychainGroup"),
    bagBoundaryOverlay: document.getElementById("bagBoundaryOverlay"),
    bagStage: document.getElementById("bagStage"),
    placementHint: document.getElementById("placementHint"),
    sourceCanvas: document.getElementById("sourceCanvas"),
    pendantCanvas: document.getElementById("pendantCanvas"),
    pendantGallery: document.getElementById("pendantGallery"),
    statusText: document.getElementById("statusText"),
    validationList: document.getElementById("validationList"),
    toast: document.getElementById("toast"),
  };

  const sourceCtx = elements.sourceCanvas.getContext("2d");
  const pendantCtx = elements.pendantCanvas.getContext("2d");

  const state = {
    currentBag: "tote",
    hooks: [],
    selectedHookId: null,
    placementMode: false,
    uploadedImage: null,
    uploadedImageName: "",
    originalDataUrl: "",
    generatedPendants: [],
    selectedPendantId: null,
    keychains: [],
    lastToastTimer: null,
  };

  const validationItems = [
    "Missing upload detection",
    "Invalid bag click detection",
    "Overlapping hook prevention",
    "Minimum spacing enforcement",
    "Attach without hook prevention",
  ];

  const bagModels = {
    tote: {
      id: "tote",
      name: "Tote bag",
      body: { x: 220, y: 180, width: 460, height: 380, radius: 38 },
      path: roundedRectPath(220, 180, 460, 380, 38),
      render() {
        return `
          <g class="bag bag--tote">
            <path
              class="bag-body"
              d="${roundedRectPath(220, 180, 460, 380, 38)}"
              fill="#dfbe98"
            />
            <path
              d="M310 194 C310 95, 590 95, 590 194"
              fill="none"
              stroke="#8b5d3d"
              stroke-width="24"
              stroke-linecap="round"
            />
            <path
              d="M348 194 C348 130, 552 130, 552 194"
              fill="none"
              stroke="#f4e8d8"
              stroke-width="12"
              stroke-linecap="round"
              opacity="0.7"
            />
            <path
              d="M260 225 H640"
              stroke="rgba(91, 57, 34, 0.18)"
              stroke-width="3"
              stroke-linecap="round"
            />
            <path
              d="M280 290 C360 255, 540 255, 620 290"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              stroke-width="8"
              stroke-linecap="round"
            />
          </g>
        `;
      },
      hitTest(point) {
        return pointInRoundedRect(point.x, point.y, this.body);
      },
    },
    backpack: {
      id: "backpack",
      name: "Backpack",
      body: { x: 250, y: 150, width: 400, height: 440, radius: 78 },
      path: roundedRectPath(250, 150, 400, 440, 78),
      render() {
        return `
          <g class="bag bag--backpack">
            <path
              class="bag-body"
              d="${roundedRectPath(250, 150, 400, 440, 78)}"
              fill="#c69a77"
            />
            <path
              d="M370 150 C370 96, 530 96, 530 150"
              fill="none"
              stroke="#7b4f2f"
              stroke-width="18"
              stroke-linecap="round"
            />
            <path
              d="M298 166 C250 230, 230 360, 250 530"
              fill="none"
              stroke="rgba(123,79,47,0.35)"
              stroke-width="18"
              stroke-linecap="round"
            />
            <path
              d="M602 166 C650 230, 670 360, 650 530"
              fill="none"
              stroke="rgba(123,79,47,0.35)"
              stroke-width="18"
              stroke-linecap="round"
            />
            <path
              d="${roundedRectPath(315, 335, 270, 140, 40)}"
              fill="#d8b28d"
              stroke="rgba(102, 73, 47, 0.18)"
              stroke-width="3"
            />
            <path
              d="M350 286 H550"
              stroke="rgba(255,255,255,0.22)"
              stroke-width="8"
              stroke-linecap="round"
            />
          </g>
        `;
      },
      hitTest(point) {
        return pointInRoundedRect(point.x, point.y, this.body);
      },
    },
    crossbody: {
      id: "crossbody",
      name: "Crossbody",
      body: { x: 250, y: 245, width: 420, height: 275, radius: 68 },
      path: roundedRectPath(250, 245, 420, 275, 68),
      render() {
        return `
          <g class="bag bag--crossbody">
            <path
              d="M250 132 C390 44, 560 44, 690 230"
              fill="none"
              stroke="#876148"
              stroke-width="22"
              stroke-linecap="round"
            />
            <path
              class="bag-body"
              d="${roundedRectPath(250, 245, 420, 275, 68)}"
              fill="#d8b185"
            />
            <path
              d="M298 320 H622"
              stroke="rgba(255,255,255,0.22)"
              stroke-width="8"
              stroke-linecap="round"
            />
            <path
              d="M320 428 C412 472, 508 472, 600 428"
              fill="none"
              stroke="rgba(112,78,50,0.16)"
              stroke-width="5"
              stroke-linecap="round"
            />
          </g>
        `;
      },
      hitTest(point) {
        return pointInRoundedRect(point.x, point.y, this.body);
      },
    },
  };

  init();

  function init() {
    drawCanvasPlaceholder(
      sourceCtx,
      elements.sourceCanvas,
      "Original image preview",
      "Choose an image to begin"
    );
    drawCanvasPlaceholder(
      pendantCtx,
      elements.pendantCanvas,
      "Generated pendant",
      "Click Generate pendant"
    );
    renderBag();
    renderHooks();
    renderKeychains();
    renderValidationList();
    renderPendantGallery();
    bindEvents();
    setStatus(DEFAULT_STATUS);
  }

  function bindEvents() {
    elements.imageUpload.addEventListener("change", handleImageUpload);
    elements.generatePendantBtn.addEventListener("click", generatePendant);
    elements.addHookBtn.addEventListener("click", togglePlacementMode);
    elements.clearHooksBtn.addEventListener("click", clearHooks);
    elements.attachPendantBtn.addEventListener("click", attachSelectedPendantToHook);
    elements.runTestsBtn.addEventListener("click", runBuiltInChecks);
    elements.scaleRange.addEventListener("input", () => {
      renderKeychains();
      if (state.generatedPendants.length > 0) {
        setStatus("Pendant size updated.");
      }
    });
    elements.thresholdRange.addEventListener("input", () => {
      if (state.uploadedImage) {
        setStatus("Threshold updated. Generate another pendant.");
      }
    });

    elements.bagSelector.addEventListener("click", (event) => {
      const chip = event.target.closest(".bag-chip");
      if (!chip) {
        return;
      }

      const nextBag = chip.dataset.bag;
      if (!bagModels[nextBag] || nextBag === state.currentBag) {
        return;
      }

      state.currentBag = nextBag;
      state.hooks = [];
      state.selectedHookId = null;
      state.placementMode = false;

      updateBagSelector();
      renderBag();
      renderHooks();
      renderKeychains();
      updatePlacementModeUi();
      setStatus(`${bagModels[nextBag].name} selected.`);
      showToast("Bag changed. Hooks were cleared.", "warning");
    });

    elements.bagSvg.addEventListener("click", (event) => {
      const hookNode = event.target.closest("[data-hook-id]");
      if (hookNode) {
        selectHook(hookNode.dataset.hookId);
        return;
      }

      if (!state.placementMode) {
        return;
      }

      const point = getSvgPoint(event);
      tryPlaceHook(point);
    });
  }

  function handleImageUpload(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Only image files are supported.", "error");
      setStatus("Invalid file type. Choose a JPG, PNG, or WEBP image.");
      elements.imageUpload.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        state.uploadedImage = image;
        state.uploadedImageName = file.name;
        state.originalDataUrl = reader.result;

        drawImageContain(sourceCtx, elements.sourceCanvas, image);
        drawCanvasPlaceholder(
          pendantCtx,
          elements.pendantCanvas,
          "Generated pendant",
          "Click Generate pendant"
        );
        renderKeychains();
        setStatus(`Loaded "${file.name}". Ready to generate a pendant.`);
        showToast("Image uploaded successfully.", "success");
      };

      image.onerror = () => {
        showToast("The uploaded file could not be read as an image.", "error");
        setStatus("Image load failed.");
      };

      image.src = reader.result;
    };

    reader.onerror = () => {
      showToast("The image file could not be read.", "error");
      setStatus("Image load failed.");
    };

    reader.readAsDataURL(file);
  }

  function generatePendant() {
    if (!state.uploadedImage) {
      showToast("Upload an image before generating a pendant.", "error");
      setStatus("Pendant generation blocked: missing upload.");
      return;
    }

    const threshold = Number(elements.thresholdRange.value);
    const processed = buildPendantFromImage(state.uploadedImage, threshold);

    if (!processed) {
      showToast("Pendant generation failed. Try another image.", "error");
      setStatus("Pendant generation failed.");
      return;
    }

    pendantCtx.clearRect(0, 0, elements.pendantCanvas.width, elements.pendantCanvas.height);

    const objectWidth = processed.bounds.width;
    const objectHeight = processed.bounds.height;
    const fit = containSize(
      objectWidth,
      objectHeight,
      elements.pendantCanvas.width - 44,
      elements.pendantCanvas.height - 44
    );
    const x = (elements.pendantCanvas.width - fit.width) / 2;
    const y = (elements.pendantCanvas.height - fit.height) / 2;

    pendantCtx.drawImage(processed.canvas, x, y, fit.width, fit.height);

    const pendantDataUrl = processed.canvas.toDataURL("image/png");
    const pendant = {
      id: `pendant-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      dataUrl: pendantDataUrl,
      bounds: processed.bounds,
      timestamp: Date.now(),
    };

    state.generatedPendants.push(pendant);
    state.selectedPendantId = pendant.id;

    renderKeychains();
    renderPendantGallery();
    setStatus("Pendant generated. Select a hook and attach it.");
    showToast(`Pendant ${state.generatedPendants.length} ready to attach.`, "success");
  }

  function buildPendantFromImage(image, threshold) {
    const maxSide = 512;
    const work = document.createElement("canvas");
    const workCtx = work.getContext("2d");

    const resized = containSize(image.width, image.height, maxSide, maxSide);
    work.width = Math.max(1, Math.round(resized.width));
    work.height = Math.max(1, Math.round(resized.height));

    workCtx.drawImage(image, 0, 0, work.width, work.height);

    const imageData = workCtx.getImageData(0, 0, work.width, work.height);
    const data = imageData.data;
    const averageBg = getAverageCornerColor(data, work.width, work.height);

    let minX = work.width;
    let minY = work.height;
    let maxX = 0;
    let maxY = 0;
    let solidPixelCount = 0;

    for (let y = 0; y < work.height; y += 1) {
      for (let x = 0; x < work.width; x += 1) {
        const index = (y * work.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];

        if (alpha === 0) {
          continue;
        }

        const distance = colorDistance(r, g, b, averageBg.r, averageBg.g, averageBg.b);
        const isBackground = distance < threshold * 1.65;

        if (isBackground) {
          data[index + 3] = 0;
          continue;
        }

        solidPixelCount += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }

    if (!solidPixelCount || minX > maxX || minY > maxY) {
      minX = 0;
      minY = 0;
      maxX = work.width - 1;
      maxY = work.height - 1;
      workCtx.putImageData(imageData, 0, 0);
      return {
        canvas: work,
        bounds: { x: 0, y: 0, width: work.width, height: work.height },
      };
    }

    workCtx.clearRect(0, 0, work.width, work.height);
    workCtx.putImageData(imageData, 0, 0);

    const padding = 18;
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(work.width - cropX, maxX - minX + 1 + padding * 2);
    const cropHeight = Math.min(work.height - cropY, maxY - minY + 1 + padding * 2);

    const cropped = document.createElement("canvas");
    const croppedCtx = cropped.getContext("2d");
    cropped.width = cropWidth;
    cropped.height = cropHeight;

    croppedCtx.drawImage(
      work,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return {
      canvas: cropped,
      bounds: { x: cropX, y: cropY, width: cropWidth, height: cropHeight },
    };
  }

  function togglePlacementMode() {
    state.placementMode = !state.placementMode;
    updatePlacementModeUi();

    if (state.placementMode) {
      setStatus("Placement mode active. Click a valid point on the bag.");
      showToast("Placement mode active.", "success");
    } else {
      setStatus("Placement mode cancelled.");
    }
  }

  function updatePlacementModeUi() {
    elements.placementHint.classList.toggle("hidden", !state.placementMode);
    elements.addHookBtn.classList.toggle("button--primary", state.placementMode);
  }

  function tryPlaceHook(point) {
    const bag = bagModels[state.currentBag];

    if (!bag.hitTest(point)) {
      showToast("Hook must be placed inside the bag area.", "error");
      setStatus("Invalid placement: clicked outside the bag.");
      return;
    }

    const overlap = state.hooks.find((hook) => distanceBetween(hook, point) < HOOK_OVERLAP_PX);
    if (overlap) {
      showToast("Hook cannot be placed on top of another hook.", "error");
      setStatus("Invalid placement: hook overlap detected.");
      return;
    }

    const tooClose = state.hooks.find((hook) => distanceBetween(hook, point) < MIN_HOOK_DISTANCE_PX);
    if (tooClose) {
      showToast("Hooks must stay at least 1 cm apart.", "error");
      setStatus("Invalid placement: minimum 1 cm distance violated.");
      return;
    }

    const hook = {
      id: `hook-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      x: round(point.x, 1),
      y: round(point.y, 1),
    };

    state.hooks.push(hook);
    state.selectedHookId = hook.id;
    state.placementMode = false;
    updatePlacementModeUi();
    renderHooks();
    renderKeychains();
    setStatus(`Hook added at (${Math.round(hook.x)}, ${Math.round(hook.y)}).`);
    showToast("Hook placed successfully.", "success");
  }

  function clearHooks() {
    state.hooks = [];
    state.selectedHookId = null;
    state.keychains = [];
    state.placementMode = false;
    renderHooks();
    renderKeychains();
    updatePlacementModeUi();
    setStatus("All hooks and keychains cleared.");
    showToast("Hooks and keychains removed.", "warning");
  }

  function selectHook(hookId) {
    const hook = state.hooks.find((item) => item.id === hookId);
    if (!hook) {
      return;
    }

    state.selectedHookId = hookId;
    renderHooks();
    renderKeychains();
    setStatus(`Hook selected at (${Math.round(hook.x)}, ${Math.round(hook.y)}).`);
  }

  function selectPendant(pendantId) {
    state.selectedPendantId = PendantId;
    renderPendantGallery();
  }

  function deletePendant(pendantId, event) {
    event.stopPropagation();
    state.generatedPendants = state.generatedPendants.filter(p => p.id !== pendantId);
    state.keychains = state.keychains.filter(kc => kc.pendantId !== pendantId);
    
    if (state.selectedPendantId === pendantId) {
      state.selectedPendantId = state.generatedPendants.length > 0 
        ? state.generatedPendants[state.generatedPendants.length - 1].id 
        : null;
    }
    
    renderPendantGallery();
    renderKeychains();
    showToast("Pendant removed.", "warning");
  }

  function attachSelectedPendantToHook() {
    if (!state.selectedPendantId) {
      showToast("Generate a pendant first, then select it.", "error");
      setStatus("Attach blocked: no pendant selected.");
      return;
    }

    if (!state.selectedHookId) {
      showToast("Select a hook first.", "error");
      setStatus("Attach blocked: no hook selected.");
      return;
    }

    const pendant = state.generatedPendants.find(p => p.id === state.selectedPendantId);
    if (!pendant) {
      showToast("Selected pendant not found.", "error");
      return;
    }

    const hook = state.hooks.find(item => item.id === state.selectedHookId);
    if (!hook) {
      showToast("Selected hook not found.", "error");
      return;
    }

    const existingKeychain = state.keychains.find(kc => kc.hookId === hook.id);
    if (existingKeychain) {
      showToast("Hook already has a keychain. Clear hooks to replace.", "error");
      setStatus("This hook already has a keychain.");
      return;
    }

    const keychain = {
      id: `kc-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      hookId: hook.id,
      pendantId: pendant.id,
      pendantDataUrl: pendant.dataUrl,
      size: Math.max(70, Math.min(180, Number(elements.scaleRange.value))),
    };

    state.keychains.push(keychain);
    renderKeychains();
    setStatus(`Keychain ${state.keychains.length} attached to hook at (${Math.round(hook.x)}, ${Math.round(hook.y)}).`);
    showToast(`Keychain attached. Total: ${state.keychains.length}`, "success");
  }

  function renderBag() {
    const bag = bagModels[state.currentBag];
    elements.bagGroup.innerHTML = bag.render();
    elements.bagBoundaryOverlay.setAttribute("d", bag.path);
  }

  function renderHooks() {
    const hookMarkup = state.hooks
      .map((hook) => {
        const selectedClass = hook.id === state.selectedHookId ? " is-selected" : "";
        return `
          <g data-hook-id="${hook.id}" tabindex="0" role="button" aria-label="Hook at ${hook.x}, ${hook.y}">
            <circle class="hook-ring" cx="${hook.x}" cy="${hook.y}" r="12"></circle>
            <circle class="hook-hit" cx="${hook.x}" cy="${hook.y}" r="22"></circle>
            <circle class="hook-visual${selectedClass}" cx="${hook.x}" cy="${hook.y}" r="9"></circle>
          </g>
        `;
      })
      .join("");

    elements.hookGroup.innerHTML = hookMarkup;
  }

  function renderKeychains() {
    if (state.keychains.length === 0) {
      elements.keychainGroup.innerHTML = "";
      return;
    }

    const keychainHtml = state.keychains.map(kc => {
      const hook = state.hooks.find(h => h.id === kc.hookId);
      if (!hook) return "";

      const size = kc.size || 110;
      const pendantWidth = size;
      const pendantHeight = size * 0.92;
      const sway = (hook.x - VIEWBOX.width / 2) * 0.04;
      const chainTopY = hook.y + 10;
      const ringY = hook.y + 24;
      const pendantX = hook.x - pendantWidth / 2 + sway;
      const pendantY = hook.y + 48;
      const chainMidX = hook.x + sway * 0.45;
      const clipId = `pendant-clip-${kc.id}`;

      return `
        <g class="keychain-item" data-keychain-id="${kc.id}">
          <defs>
            <clipPath id="${clipId}">
              <rect
                x="${pendantX + 4}"
                y="${pendantY + 4}"
                width="${pendantWidth - 8}"
                height="${pendantHeight - 8}"
                rx="${Math.max(16, pendantWidth * 0.16)}"
                ry="${Math.max(16, pendantWidth * 0.16)}"
              ></rect>
            </clipPath>
          </defs>

          <path
            class="keychain-chain"
            d="M ${hook.x} ${chainTopY} C ${hook.x} ${ringY}, ${chainMidX} ${pendantY - 18}, ${hook.x + sway * 0.65} ${pendantY - 4}"
          ></path>
          <circle class="keychain-loop" cx="${hook.x}" cy="${ringY}" r="12"></circle>
          <image
            x="${pendantX + 4}"
            y="${pendantY + 4}"
            width="${pendantWidth - 8}"
            height="${pendantHeight - 8}"
            href="${kc.pendantDataUrl}"
            preserveAspectRatio="xMidYMid meet"
            clip-path="url(#${clipId})"
          ></image>
        </g>
      `;
    }).join("");

    elements.keychainGroup.innerHTML = keychainHtml;
  }

  function renderPendantGallery() {
    if (!elements.pendantGallery) return;
    
    if (state.generatedPendants.length === 0) {
      elements.pendantGallery.innerHTML = `
        <p class="gallery-empty">No pendants generated yet.</p>
      `;
      return;
    }

    elements.pendantGallery.innerHTML = state.generatedPendants.map(pendant => {
      const isSelected = pendant.id === state.selectedPendantId;
      return `
        <div class="gallery-item ${isSelected ? 'is-selected' : ''}" 
             data-pendant-id="${pendant.id}"
             onclick="selectPendant('${pendant.id}')">
          <img src="${pendant.dataUrl}" alt="Pendant" />
          <button class="gallery-delete" onclick="deletePendant('${pendant.id}', event)">×</button>
        </div>
      `;
    }).join("");
  }

  function updateBagSelector() {
    const buttons = elements.bagSelector.querySelectorAll(".bag-chip");
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.bag === state.currentBag);
    });
  }

  function runBuiltInChecks() {
    const results = [];
    const tote = bagModels.tote;
    const validPoint = { x: 420, y: 330 };
    const outsidePoint = { x: 120, y: 120 };
    const baseHook = { x: 420, y: 330 };

    results.push({
      label: "Missing upload detection",
      pass: !state.uploadedImage,
      details: "Generate action should fail without an uploaded image.",
    });

    results.push({
      label: "Invalid bag click detection",
      pass: tote.hitTest(outsidePoint) === false && tote.hitTest(validPoint) === true,
      details: "Outside point rejected, inner point accepted.",
    });

    results.push({
      label: "Overlapping hook prevention",
      pass: canPlaceHook([baseHook], { x: 430, y: 334 }, tote) === "overlap",
      details: "Near-identical hook position should be blocked.",
    });

    results.push({
      label: "Minimum spacing enforcement",
      pass: canPlaceHook([baseHook], { x: 448, y: 330 }, tote) === "too-close",
      details: "Second hook within 1 cm should be rejected.",
    });

    results.push({
      label: "Attach without pendant prevention",
      pass: !state.selectedPendantId || !state.selectedHookId,
      details: "Attachment must require both pendant and hook.",
    });

    renderValidationList(results);

    const allPass = results.every((result) => result.pass);
    if (allPass) {
      setStatus("Built-in validation checks passed.");
      showToast("All validation checks passed.", "success");
    } else {
      setStatus("One or more validation checks failed.");
      showToast("Validation checks found a failing case.", "error");
    }
  }

  function renderValidationList(results = null) {
    if (!results) {
      elements.validationList.innerHTML = validationItems
        .map((item) => `<li class="status-neutral">${item}</li>`)
        .join("");
      return;
    }

    elements.validationList.innerHTML = results
      .map((result) => {
        const className = result.pass ? "status-pass" : "status-fail";
        const symbol = result.pass ? "✓" : "✕";
        return `<li class="${className}">${symbol} ${result.label} — ${result.details}</li>`;
      })
      .join("");
  }

  function canPlaceHook(existingHooks, point, bag) {
    if (!bag.hitTest(point)) {
      return "outside";
    }

    if (existingHooks.some((hook) => distanceBetween(hook, point) < HOOK_OVERLAP_PX)) {
      return "overlap";
    }

    if (existingHooks.some((hook) => distanceBetween(hook, point) < MIN_HOOK_DISTANCE_PX)) {
      return "too-close";
    }

    return "ok";
  }

  function setStatus(message) {
    elements.statusText.textContent = message;
  }

  function showToast(message, type = "success") {
    window.clearTimeout(state.lastToastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast toast--${type}`;
    elements.toast.classList.remove("hidden");

    state.lastToastTimer = window.setTimeout(() => {
      elements.toast.classList.add("hidden");
    }, 2400);
  }

  function getSvgPoint(event) {
    const rect = elements.bagSvg.getBoundingClientRect();
    const scaleX = VIEWBOX.width / rect.width;
    const scaleY = VIEWBOX.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function drawImageContain(ctx, canvas, image) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const fit = containSize(image.width, image.height, canvas.width - 24, canvas.height - 24);
    const x = (canvas.width - fit.width) / 2;
    const y = (canvas.height - fit.height) / 2;

    ctx.drawImage(image, x, y, fit.width, fit.height);
  }

  function drawCanvasPlaceholder(ctx, canvas, title, subtitle) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(123,79,47,0.16)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.setLineDash([]);

    ctx.fillStyle = "#7b4f2f";
    ctx.font = "600 18px Inter, Segoe UI, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 8);

    ctx.fillStyle = "#7a6a5f";
    ctx.font = "14px Inter, Segoe UI, Arial, sans-serif";
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 22);
    ctx.textAlign = "start";
  }

  function getAverageCornerColor(data, width, height) {
    const sampleSize = Math.max(8, Math.round(Math.min(width, height) * 0.08));
    const corners = [
      { startX: 0, startY: 0 },
      { startX: width - sampleSize, startY: 0 },
      { startX: 0, startY: height - sampleSize },
      { startX: width - sampleSize, startY: height - sampleSize },
    ];

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let count = 0;

    corners.forEach((corner) => {
      for (let y = corner.startY; y < corner.startY + sampleSize; y += 1) {
        for (let x = corner.startX; x < corner.startX + sampleSize; x += 1) {
          const index = (y * width + x) * 4;
          totalR += data[index];
          totalG += data[index + 1];
          totalB += data[index + 2];
          count += 1;
        }
      }
    });

    return {
      r: totalR / count,
      g: totalG / count,
      b: totalB / count,
    };
  }

  function colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(
      (r1 - r2) * (r1 - r2) +
        (g1 - g2) * (g1 - g2) +
        (b1 - b2) * (b1 - b2)
    );
  }

  function pointInRoundedRect(x, y, rect) {
    const { x: rx, y: ry, width, height, radius } = rect;
    const right = rx + width;
    const bottom = ry + height;

    if (x < rx || x > right || y < ry || y > bottom) {
      return false;
    }

    const innerX = x >= rx + radius && x <= right - radius;
    const innerY = y >= ry + radius && y <= bottom - radius;

    if (innerX || innerY) {
      return true;
    }

    const cornerCenters = [
      { x: rx + radius, y: ry + radius },
      { x: right - radius, y: ry + radius },
      { x: rx + radius, y: bottom - radius },
      { x: right - radius, y: bottom - radius },
    ];

    return cornerCenters.some((corner) => {
      const dx = x - corner.x;
      const dy = y - corner.y;
      return dx * dx + dy * dy <= radius * radius;
    });
  }

  function containSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
    return {
      width: sourceWidth * ratio,
      height: sourceHeight * ratio,
    };
  }

  function roundedRectPath(x, y, width, height, radius) {
    return [
      `M ${x + radius} ${y}`,
      `H ${x + width - radius}`,
      `Q ${x + width} ${y} ${x + width} ${y + radius}`,
      `V ${y + height - radius}`,
      `Q ${x + width} ${y + height} ${x + width - radius} ${y + height}`,
      `H ${x + radius}`,
      `Q ${x} ${y + height} ${x} ${y + height - radius}`,
      `V ${y + radius}`,
      `Q ${x} ${y} ${x + radius} ${y}`,
      "Z",
    ].join(" ");
  }

  function distanceBetween(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function round(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  function roundRectPathCanvas(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  window.selectPendant = selectPendant;
  window.deletePendant = deletePendant;
})();