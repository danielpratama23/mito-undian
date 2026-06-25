/**
 * storageService.js — Cloudinary + AWS S3
 * Set STORAGE_TYPE=cloudinary atau STORAGE_TYPE=s3 di .env
 */

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'cloudinary'

async function uploadCloudinary(file, folderPath) {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `mito-undian/${folderPath}`,
        resource_type: 'image',
        quality: 'auto:good',
        fetch_format: 'auto',
        transformation: [{ width: 1600, crop: 'limit' }],
      },
      (err, result) => {
        if (err) {
          console.error('CLOUDINARY FULL ERROR:', err)
          return reject(err)
        }

        resolve(result.secure_url)
      }
    )
    stream.end(file.buffer)
  })
}

async function uploadS3(file, folderPath) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const { v4: uuidv4 } = require('uuid')
  const path = require('path')
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })
  const ext = path.extname(file.originalname) || '.jpg'
  const key = `mito-undian/${folderPath}/${uuidv4()}${ext}`
  await s3.send(new PutObjectCommand({
    Bucket:      process.env.AWS_BUCKET_NAME,
    Key:         key,
    Body:        file.buffer,
    ContentType: file.mimetype,
    ACL:         'public-read',
  }))
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`
}

async function uploadFile(file, folderPath = 'struk') {
  if (STORAGE_TYPE === 's3') return uploadS3(file, folderPath)
  return uploadCloudinary(file, folderPath)
}

module.exports = { uploadFile }
