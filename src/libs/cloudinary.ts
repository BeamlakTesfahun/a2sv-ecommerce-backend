import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadImageBufferToCloudinary(
  buf: Buffer,
  folder = "ecommerce/products"
): Promise<string> {
  const { secure_url } = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, uploaded) => (err ? reject(err) : resolve(uploaded))
    );
    stream.end(buf);
  });
  return secure_url as string;
}

export { cloudinary };
