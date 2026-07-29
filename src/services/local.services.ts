import fs from "fs";
import path from "path";

export class LocalUploadServices {
  static async uploadImageBuffer(file: Express.Multer.File): Promise<string> {
    const uploadDir = path.join(process.cwd(), "uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to local disk
    await fs.promises.writeFile(filePath, file.buffer);

    const port = process.env.PORT || 3000;
    return `http://localhost:${port}/uploads/${fileName}`;
  }
}
