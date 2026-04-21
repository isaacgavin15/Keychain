export function buildPendantFromImage(image, threshold) {
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

function containSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: sourceWidth * ratio,
    height: sourceHeight * ratio,
  };
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    (r1 - r2) * (r1 - r2) +
      (g1 - g2) * (g1 - g2) +
      (b1 - b2) * (b1 - b2)
  );
}

export function getAverageCornerColor(data, width, height) {
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