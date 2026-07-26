export function readQrImageFile(file, maxBytes = 400_000) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("Choose a QR code image."));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("Upload a PNG or JPG image."));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("Image must be under 400 KB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
