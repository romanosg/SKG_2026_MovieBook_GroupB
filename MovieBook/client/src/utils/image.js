// Shrinks a picture so it fits inside maxSize x maxSize pixels and returns it as a small
// JPEG "data URL" (text). Profile photos are stored as text on the server, and the server
// refuses requests bigger than about 100 KB, so a phone photo can't be sent as it is.
export function resizeImage(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff"; // transparent PNG areas become white in a JPEG
      context.fillRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);

      // Lower the quality a little if the result is still too big
      let quality = 0.85;
      let dataUrl = canvas.toDataURL("image/jpeg", quality);
      while (dataUrl.length > 90000 && quality > 0.3) {
        quality -= 0.15;
        dataUrl = canvas.toDataURL("image/jpeg", quality);
      }
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };

    img.src = url;
  });
}
