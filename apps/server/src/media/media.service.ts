import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/ogg',
  'audio/mp3',
  'audio/webm',
  'application/pdf',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB max

@Injectable()
export class MediaService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicDomain: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');

    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME') || 'nexchat-media';
    this.publicDomain = this.configService.get<string>('R2_PUBLIC_DOMAIN') || 'http://localhost:4000/media/files';

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  async generatePresignedUrl(filename: string, fileType: string, fileSize: number) {
    if (fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds the 100MB limit');
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      throw new BadRequestException(`File type '${fileType}' is not supported`);
    }

    const timestamp = Date.now();
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `uploads/${timestamp}-${cleanFilename}`;

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 }); // 15 mins
      const publicUrl = `${this.publicDomain}/${fileKey}`;

      return {
        uploadUrl,
        publicUrl,
        fileKey,
      };
    }

    // Fallback URL when R2 is not configured
    const publicUrl = `http://localhost:4000/api/v1/media/demo-file/${fileKey}`;
    return {
      uploadUrl: publicUrl,
      publicUrl,
      fileKey,
    };
  }
}
