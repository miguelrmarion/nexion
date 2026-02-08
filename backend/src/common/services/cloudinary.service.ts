import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadApiResponse, v2 } from "cloudinary";

@Injectable()
export class CloudinaryService implements OnModuleInit {
    constructor(private configService: ConfigService) {}

    onModuleInit() {
        const cloudName = this.configService.get<string>(
            "CLOUDINARY_CLOUD_NAME",
        );
        const apiKey = this.configService.get<string>("CLOUDINARY_API_KEY");
        const apiSecret = this.configService.get<string>(
            "CLOUDINARY_API_SECRET",
        );

        if (!cloudName || !apiKey || !apiSecret)
            throw new Error(
                "Cloudinary configuration missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
            );

        v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
    }

    upload(file: Express.Multer.File): Promise<UploadApiResponse | undefined> {
        return new Promise((resolve, reject) => {
            v2.uploader
                .upload_stream({ resource_type: "auto" }, (error, result) => {
                    if (error) {
                        return reject(
                            new Error(
                                `Cloudinary upload failed: ${error.message}`,
                            ),
                        );
                    }
                    resolve(result);
                })
                .end(file.buffer);
        });
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        const result = await this.upload(file);
        if (!result?.secure_url)
            throw new Error("Failed to upload image to Cloudinary");

        return result.secure_url;
    }
}
