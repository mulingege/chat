module.exports = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  maxImageSize: process.env.UPLOAD_IMAGE_LIMIT || '500mb',
  maxVideoSize: process.env.UPLOAD_VIDEO_LIMIT || '500mb',
  uploadLimit: process.env.UPLOAD_LIMIT || '500mb'
};
