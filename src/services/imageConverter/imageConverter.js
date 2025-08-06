const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const https = require("https");

// outputAi_signal
const outputAiSignal = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "public",
  "aiSignal"
);

// trending reset
function resetOutPutAiSignal() {
  try {
    if (fs.existsSync(outputAiSignal)) {
      fs.rmSync(outputAiSignal, { recursive: true, force: true });
    }
    fs.mkdirSync(outputAiSignal, { recursive: true });
  } catch (error) {
    console.log("🚀 ~ resetDirectoryTrending ~ error:", error?.message);
  }
}

async function downloadAndConvert(url, tokenAddress) {
  try {
    const outputPath = path.join(outputAiSignal, `${tokenAddress}.webp`);

    await https
      .get(url, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await sharp(buffer)
              .resize(64, 64)
              .webp({ quality: 80 })
              .toFile(outputPath);
            // console.log(`✅ Saved: ${tokenAddress}.webp`);
          } catch (err) {
            // console.error(`❌ Sharp Error for ${tokenAddress}:`, err.message);
          }
        });
      })
      .on("error", (err) => {
        // console.error(`❌ HTTPS Error for ${tokenAddress}:`, err.message);
      });
  } catch (error) {
    console.log("🚀 ~ downloadAndConvert ~ error:", error?.message);
  }
}

// memescope images processing
async function processImagesAiSignal(tokens) {
  try {
    if (!tokens || tokens?.length == 0) {
      return 0;
    }
    // always reset first
    resetOutPutAiSignal();
    for (const token of tokens) {
      await downloadAndConvert(token?.img, token?.address);
    }

    console.log("🎉 Done processing all si signal page token images");
  } catch (error) {
    console.log("🚀 ~ processImages ~ error:", error?.message);
  }
}

module.exports = {
  processImagesAiSignal,
};
