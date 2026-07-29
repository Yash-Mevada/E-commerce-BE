import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

export class CloudinaryServices {
  static async uploadImageBuffer(fileBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "products" },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error("Upload failed, result undefined"));
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(fileBuffer);
    });
  }
}
