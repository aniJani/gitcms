// Mock Cloudflare R2 storage for prototype
// Returns placeholder URLs instead of actually uploading to R2

const PLACEHOLDER_IMAGES = [
  "https://placehold.co/1200x630/1a1a2e/e2e8f0?text=Cover+Image",
  "https://placehold.co/800x600/16213e/e2e8f0?text=Blog+Image",
  "https://placehold.co/600x400/0f3460/e2e8f0?text=Content+Image",
];

let imageCounter = 0;

export async function uploadImage(
  _file: File
): Promise<{ url: string; key: string }> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const url = PLACEHOLDER_IMAGES[imageCounter % PLACEHOLDER_IMAGES.length];
  imageCounter++;

  return {
    url,
    key: `mock-${Date.now()}-${imageCounter}`,
  };
}

export async function deleteImage(_key: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return true;
}
