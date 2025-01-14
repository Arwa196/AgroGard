let isWebcamMode = false;
let isPredictionActive = false;

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const cancelBtn = document.getElementById("cancel-btn");

  document.getElementById("progress-container").style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "Loading model...";
  cancelBtn.classList.remove("hidden");

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
  progressBar.style.width = "100%";
  progressText.textContent = "Model loaded!";

  // Setup webcam
  const flip = true;
  webcam = new tmImage.Webcam(300, 300, flip);
  await webcam.setup();
  await webcam.play();

  isWebcamMode = true;
  isPredictionActive = true;

  // Append webcam canvas
  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = ""; // Clear existing content
  webcamContainer.appendChild(webcam.canvas);

  document.getElementById("stop-btn").disabled = false;
  document.getElementById("start-btn").disabled = true;

  window.requestAnimationFrame(loop);
}

async function loop() {
  if (isWebcamMode && isPredictionActive) {
    webcam.update();
    await predictWebcam();
    animationFrameId = window.requestAnimationFrame(loop);
  }
}

async function predictWebcam() {
  const prediction = await model.predict(webcam.canvas);
  updateProgressResults(prediction, "Webcam Prediction:");
}

async function predictFromUpload() {
  const input = document.getElementById("imageUpload");
  const uploadedImage = document.getElementById("uploadedImage");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const cancelBtn = document.getElementById("cancel-btn");

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();

    document.getElementById("progress-container").style.display = "block";
    progressBar.style.width = "0%";
    progressText.textContent = "Loading image...";
    cancelBtn.classList.remove("hidden");

    isWebcamMode = false;
    isPredictionActive = true;

    reader.onload = (e) => {
      uploadedImage.src = e.target.result;
      uploadedImage.classList.remove("hidden");

      const img = new Image();
      img.src = e.target.result;
      img.onload = async () => {
        if (!isPredictionActive) return;

        progressBar.style.width = "60%";
        progressText.textContent = "Image loaded. Making predictions...";

        const prediction = await model.predict(img);

        if (!isPredictionActive) return;

        progressBar.style.width = "100%";
        progressText.textContent = "Prediction complete!";
        updateProgressResults(prediction, "Uploaded Image Prediction:");
      };
    };

    reader.readAsDataURL(file);
  }
}

function cancelPrediction() {
  isPredictionActive = false;

  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  const cancelBtn = document.getElementById("cancel-btn");

  if (isWebcamMode && webcam) {
    stopDetector();
  }

  progressText.textContent = "Prediction canceled.";
  progressBar.style.width = "0%";
  cancelBtn.classList.add("hidden");
}

function updateProgressResults(prediction, title) {
  const predictionResults = document.getElementById("prediction-results");
  predictionResults.innerHTML = `<h3>${title}</h3>`;

  prediction.forEach((pred) => {
    const result = document.createElement("div");
    result.innerHTML = `<strong>${pred.className}:</strong> ${(
      pred.probability * 100
    ).toFixed(2)}%`;
    predictionResults.appendChild(result);
  });
}

function stopDetector() {
  if (webcam) {
    webcam.stop();
  }
  isPredictionActive = false;

  document.getElementById("webcam-container").innerHTML = "";
  document.getElementById("stop-btn").disabled = true;
  document.getElementById("start-btn").disabled = false;
}
