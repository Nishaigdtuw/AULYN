'use server'

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';





export async function getPresignedUrl(fileName: string, chapterId: string, classId: string){ {
    if(fileName === null || fileName === undefined) return { error: "Please provide a file name" };
    if(fileName.length < 5) return { error: "File name is too short" };
   
    const s3 = new S3Client({ 
        region: process.env.AWS_BUCKET_REGION!,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET!,
        }
     });
    

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `${classId}/${chapterId}/${fileName}`,
      });

      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 360 });
      return { signedUrl };

}
};