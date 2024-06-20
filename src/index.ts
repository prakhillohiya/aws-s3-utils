import S3Object, { CreateBucketCommand, ListBucketsCommand, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteBucketCommand, DeleteObjectsCommand, DeleteObjectCommand, Bucket, PutObjectOutput, DeleteBucketCommandOutput, DeleteObjectCommandOutput, CreateBucketCommandOutput, ListObjectsV2CommandOutput, ListBucketsCommandOutput, GetObjectCommandOutput, PutObjectCommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, bucketName } from './config/aws';

interface ICustomFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer
}

/**
 * Create a new S3 bucket with the specified name.
 *
 * @param {string} bucketName - The name of the new S3 bucket to create.
 * @returns {Promise<CreateBucketCommandOutput>} A Promise that resolves to the location of the created bucket.
 * @throws {Error} Throws an error if there's a problem creating the bucket.
 */
export const createNewBucket = async (bucketName: string): Promise<CreateBucketCommandOutput> => {
  try {
    const command = new CreateBucketCommand({
      Bucket: bucketName,
    });
    return await s3.send(command);
  } catch (error: any) {
    throw new Error(`Failed to create new bucket : ${error.message}`);
  }
};

/**
 * Fetch a list of all S3 buckets.
 *
 * @returns {Promise<ListBucketsCommandOutput>} A Promise that resolves to an array of Bucket objects.
 * @throws {Error} Throws an error if there's a problem listing the buckets.
 */
export const fetchAllBuckets = async (): Promise<ListBucketsCommandOutput> => {
  try {
    const command = new ListBucketsCommand({});
    return await s3.send(command);
  } catch (error: any) {
    throw new Error(`Failed to fetch buckets : ${error.message}`);
  }
};


/**
 * Fetch a list of all objects in an S3 bucket.
 *
 * @returns {Promise<ListObjectsV2CommandOutput>} A Promise that resolves to an array of S3Object objects.
 * @throws {Error} Throws an error if there's a problem listing the objects.
 */
export const fetchAllBucketFiles = async (): Promise<ListObjectsV2CommandOutput> => {
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    return await s3.send(command);

  } catch (error: any) {
    throw new Error(`Failed to bucket files : ${error.message}`);
  }
};

/**
 * Fetch a list of all objects in an S3 bucket with a specific path prefix.
 *
 * @param {string} path - The path prefix for filtering objects.
 * @returns {Promise<ListObjectsV2CommandOutput>} A Promise that resolves to an array of S3Object objects.
 * @throws {Error} Throws an error if there's a problem listing the objects.
 */
export const fetchAllFilesOnPath = async (path: string): Promise<ListObjectsV2CommandOutput> => {
  try {
    const command = new ListObjectsV2Command({ Bucket: bucketName, Prefix: path });
    return await s3.send(command);
  } catch (error: any) {
    throw new Error(`Failed to files in the specified path : ${error.message}`);
  }
};

/**
 * Fetch the content of a file from an S3 bucket.
 *
 * @param {string} path - The path to the file you want to fetch from the S3 bucket.
 * @returns {Promise<GetObjectCommandOutput>} A Promise that resolves to the file content as a string if it exists,
 * or "File Does Not Exist" if the file is not found.
 * @throws {Error} Throws an error if there's a problem fetching the file.
 */
export const fetchFile = async (path: string): Promise<GetObjectCommandOutput> => {
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: path });
    return await s3.send(command);
  } catch (error: any) {
    throw new Error(`Failed to fetch file : ${error.message}`);
  }
};

/**
 * Upload a file to an S3 bucket.
 *
 * @param {string} path - The path for the S3 object.
 * @param {CustomFile} file - The file buffer to be uploaded.
 * @returns {Promise<PutObjectCommandOutput>} A Promise that resolves to the response from the S3 service.
 * @throws {Error} Throws an error if there's a problem uploading the file.
 */
export const uploadFile = async (path: string, file: ICustomFile): Promise<PutObjectCommandOutput> => {
  try {
    const { originalname, buffer } = file;
    return await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Body: buffer,
        Key: `${path}/${originalname}`,
      })
    );

  } catch (error: any) {
    throw new Error(`Failed to upload file : ${error.message}`);
  }
};

/**
 * Delete an S3 bucket with the specified name.
 *
 * @param {string} bucketName - The name of the S3 bucket to delete.
 * @returns {Promise<DeleteBucketCommandOutput>} A Promise that resolves when the bucket is deleted.
 * @throws {Error} Throws an error if there's a problem deleting the bucket.
 */
export const deleteBucket = async (bucketName: string): Promise<DeleteBucketCommandOutput> => {
  try {
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });
    return await s3.send(command);
  } catch (error: any) {
    throw new Error(`Failed to delete Bucket : ${error.message}`);
  }
};

/**
 * Delete all files in a given S3 bucket.
 *
 * @returns {Promise<DeleteBucketCommandOutput>} A Promise that resolves when the files are deleted or rejects with an error.
 * @throws {Error} Throws an error if there's a problem during the deletion.
 */
export const deleteAllBucketFiles = async (): Promise<DeleteBucketCommandOutput> => {
  try {
    const { Contents } = await fetchAllBucketFiles();

    if (!Contents) {
      throw new Error("Bucket Empty")
    }

    const keys = Contents.map((c) => c.Key);


    const deleteObjectsCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: keys.map((key) => ({ Key: key })) },
    });

    return await s3.send(deleteObjectsCommand);
  } catch (error: any) {
    throw new Error(`Failed to delete all files : ${error.message}`);
  }
};

/**
 * Delete all files in a specific path within an S3 bucket.
 *
 * @param {string} path - The path within the bucket to delete files from.
 * @returns {Promise<DeleteBucketCommandOutput>} A Promise that resolves when the files are deleted or rejects with an error.
 * @throws {Error} Throws an error if there's a problem during the deletion.
 */
export const deleteAllFilesOnPath = async (path: string): Promise<DeleteBucketCommandOutput> => {
  try {
    const { Contents } = await fetchAllFilesOnPath(path);

    if (!Contents) {
      throw new Error("No Files Available")
    }

    const keys = Contents.map((c) => c.Key);

    const deleteObjectsCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: { Objects: keys.map((key) => ({ Key: key })) },
    });

    return await s3.send(deleteObjectsCommand);
  } catch (error: any) {
    throw new Error(`Failed to delete all files in the specified path: ${error.message}`);
  }
};


/**
 * Delete a file from an S3 bucket.
 *
 * @param {string} path - The path to the file you want to delete from the S3 bucket.
 * @returns {Promise<DeleteObjectCommandOutput>} A Promise that resolves when the file is deleted, or rejects with an error.
 * @throws {Error} Throws an error if there's a problem deleting the file.
 */
export const deleteFile = async (path: string): Promise<DeleteObjectCommandOutput> => {
  try {
    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: path,
    });
    return await s3.send(deleteObjectCommand);
  } catch (error: any) {
    throw new Error(`Failed to delete the file: ${error.message}`);
  }
};

/**
 * Generate a signed URL for uploading a file to an S3 bucket.
 *
 * @param {string} path - The path for the S3 object.
 * @returns {Promise<string>} A Promise that resolves to the signed URL for uploading the file, or rejects with an error.
 * @throws {Error} Throws an error if there's a problem generating the upload URL.
 */
export const generateUploadFileUrl = async (path: string): Promise<string> => {
  try {
    const command = new PutObjectCommand({ Bucket: bucketName, Key: path });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch (error: any) {
    throw new Error(`Failed to generate the upload URL: ${error.message}`);
  }
};

/**
 * Generate a signed URL for downloading a file from an S3 bucket.
 *
 * @param {string} path - The path for the S3 object.
 * @returns {Promise<string>} A Promise that resolves to the signed URL for downloading the file, or rejects with an error.
 * @throws {Error} Throws an error if there's a problem generating the download URL.
 */
export const generateDownloadFileUrl = async (path: string): Promise<string> => {
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: path });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  } catch (error: any) {
    throw new Error(`Failed to generate the download URL: ${error.message}`);
  }
};
