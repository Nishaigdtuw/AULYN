'use server'

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';





export async function getPresignedUrl(fileName: string, chapterId: string, classId: string) {
    if (!fileName) return { error: "Please provide a file name" };
    if (fileName.length < 5) return { error: "File name is too short" };

    const region = process.env.AWS_BUCKET_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET;
    const bucketName = process.env.AWS_BUCKET_NAME;

    if (!region || !accessKeyId || !secretAccessKey || !bucketName) {
        return { error: "AWS S3 credentials or bucket details are not configured" };
    }

    try {
        const s3 = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            }
        });

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${classId}/${chapterId}/${fileName}`,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 360 });
        return { signedUrl };
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to generate presigned URL";
        return { error: errorMessage };
    }
}