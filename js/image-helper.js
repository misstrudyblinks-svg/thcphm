// Firestore image helper
// Converts an image to a resized JPEG data URL before saving it to Firestore.
// This avoids Firebase Storage, while keeping documents safely below Firestore's
// 1 MiB document limit.

export async function imageFileToBase64(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.72,
    maxBytes = 700000
  } = options;

  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  const dataUrl = await readAsDataURL(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(
    1,
    maxWidth / image.naturalWidth,
    maxHeight / image.naturalHeight
  );

  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  let compressed = canvas.toDataURL("image/jpeg", quality);

  // If still too large, progressively reduce quality.
  let currentQuality = quality;
  while (dataUrlByteLength(compressed) > maxBytes && currentQuality > 0.35) {
    currentQuality -= 0.08;
    compressed = canvas.toDataURL("image/jpeg", currentQuality);
  }

  if (dataUrlByteLength(compressed) > maxBytes) {
    throw new Error("This image is still too large after compression. Please choose a smaller image.");
  }

  return compressed;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process the image."));
    image.src = src;
  });
}

function dataUrlByteLength(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}
