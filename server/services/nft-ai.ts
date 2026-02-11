import { generateImage } from "../replit_integrations/image/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const NFT_UPLOAD_DIR = isServerless
  ? path.join("/tmp", "uploads", "nft-art")
  : path.join(process.cwd(), "uploads", "nft-art");

try {
  if (!fs.existsSync(NFT_UPLOAD_DIR)) {
    fs.mkdirSync(NFT_UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[NFT-AI] Could not create upload directory:", (err as Error).message);
}

export type NftArtCategory = "merchant_dish" | "driver_avatar" | "customer_loyalty" | "marketplace_art";

interface GenerateNftArtParams {
  category: NftArtCategory;
  name: string;
  description?: string;
  dishName?: string;
  cuisine?: string;
  restaurantName?: string;
  milestoneType?: string;
  milestoneValue?: number;
  driverName?: string;
  style?: string;
}

interface NftArtResult {
  imageUrl: string;
  prompt: string;
  fileName: string;
}

function buildPrompt(params: GenerateNftArtParams): string {
  const baseStyle = params.style || "digital art, vibrant colors, detailed illustration";

  switch (params.category) {
    case "merchant_dish":
      return `Create a stunning NFT artwork of a signature dish called "${params.dishName || params.name}". ` +
        `${params.cuisine ? `The cuisine style is ${params.cuisine}. ` : ""}` +
        `${params.restaurantName ? `From the restaurant "${params.restaurantName}". ` : ""}` +
        `Style: Premium food photography meets ${baseStyle}. ` +
        `The dish should look extraordinary and appetizing, presented on an elegant plate with dramatic lighting. ` +
        `Include subtle golden sparkle effects around the dish to give it an NFT/collectible feel. ` +
        `Background should be dark and moody with a warm glow. Square format, high detail. ` +
        `Do NOT include any text, watermarks, or logos in the image.`;

    case "driver_avatar":
      return `Create a unique, stylized avatar NFT for a delivery driver${params.driverName ? ` named "${params.driverName}"` : ""}. ` +
        `Style: ${baseStyle}, character portrait. ` +
        `The avatar should feature a cool, confident delivery person with a futuristic motorcycle helmet or delivery gear. ` +
        `Include subtle crypto/blockchain visual elements like circuit patterns or hex shapes in the background. ` +
        `Color palette: neon greens, electric blues, and warm oranges on a dark background. ` +
        `The design should feel like a premium profile picture or gaming avatar. Square format. ` +
        `Do NOT include any text, watermarks, or logos in the image.`;

    case "customer_loyalty":
      return `Create a beautiful loyalty reward NFT artwork for a food delivery achievement: "${params.name}". ` +
        `${params.description ? `Achievement: ${params.description}. ` : ""}` +
        `${params.milestoneType === "customer" ? `Earned after ${params.milestoneValue} orders. ` : ""}` +
        `${params.milestoneType === "driver" ? `Earned after ${params.milestoneValue} deliveries. ` : ""}` +
        `Style: ${baseStyle}, collectible badge design. ` +
        `The artwork should look like a prestigious medal or emblem with metallic textures (gold, silver, platinum). ` +
        `Include subtle food-related motifs and blockchain hex patterns. ` +
        `Background should have a radial gradient glow effect. Square format, premium collectible feel. ` +
        `Do NOT include any text, watermarks, or logos in the image.`;

    case "marketplace_art":
      return `Create a unique, one-of-a-kind NFT artwork for the CryptoEats marketplace. ` +
        `Theme: "${params.name}". ${params.description ? `Description: ${params.description}. ` : ""}` +
        `Style: ${baseStyle}, premium digital collectible. ` +
        `Blend food culture with crypto/blockchain aesthetics. ` +
        `Think gourmet cuisine meets futuristic technology. ` +
        `Rich colors, dramatic lighting, intricate details. Square format. ` +
        `Do NOT include any text, watermarks, or logos in the image.`;

    default:
      return `Create a digital NFT artwork: "${params.name}". ${params.description || ""}. Style: ${baseStyle}. Square format. Do NOT include any text.`;
  }
}

function saveBase64Image(dataUrl: string, fileName: string): string {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data URL");

  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const fullFileName = `${fileName}.${ext}`;
  const filePath = path.join(NFT_UPLOAD_DIR, fullFileName);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/nft-art/${fullFileName}`;
}

export async function generateNftArt(params: GenerateNftArtParams): Promise<NftArtResult> {
  const prompt = buildPrompt(params);
  const imageDataUrl = await generateImage(prompt);

  const uniqueId = crypto.randomBytes(8).toString("hex");
  const safeName = params.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  const fileName = `${params.category}-${safeName}-${uniqueId}`;

  const imageUrl = saveBase64Image(imageDataUrl, fileName);

  return {
    imageUrl,
    prompt,
    fileName,
  };
}

export const NFT_STYLE_PRESETS: Record<string, string> = {
  "cyberpunk": "cyberpunk neon aesthetic, glowing edges, dark futuristic",
  "watercolor": "watercolor painting style, soft washes, artistic brush strokes",
  "pixel-art": "retro pixel art style, 16-bit game aesthetic, crisp pixels",
  "abstract": "abstract geometric art, bold shapes, modern art gallery feel",
  "pop-art": "pop art style, bold outlines, halftone dots, Andy Warhol inspired",
  "3d-render": "3D rendered, glossy materials, studio lighting, ultra realistic",
  "anime": "anime illustration style, detailed linework, vibrant anime colors",
  "minimalist": "minimalist clean design, simple shapes, elegant composition",
};

export function getStylePresets(): { id: string; name: string; description: string }[] {
  return Object.entries(NFT_STYLE_PRESETS).map(([id, description]) => ({
    id,
    name: id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description,
  }));
}
