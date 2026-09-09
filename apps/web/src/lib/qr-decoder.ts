let jsQRModule: any = null;

export async function decodeQrFromImageData(imageData: ImageData) {
  try {
    if (!jsQRModule) {
      const mod = await import("jsqr");
      jsQRModule = typeof mod === "function" ? mod : mod.default || (mod as any).jsQR;
      if (typeof jsQRModule !== "function" && jsQRModule?.default) {
        jsQRModule = jsQRModule.default;
      }
    }

    if (typeof jsQRModule === "function") {
      const result = jsQRModule(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      return result ? result.data : null;
    }
  } catch (error) {
    console.error("QR decoding error:", error);
  }
  return null;
}
