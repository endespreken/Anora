/**
 * Compresses an image file using HTML Canvas.
 * @param {File} file The image file to compress
 * @param {number} maxWidth The maximum width or height of the compressed image
 * @param {number} quality The quality of the compressed image (0 to 1)
 * @returns {Promise<File>} The compressed image file
 */
export const compressImage = (file, maxWidth = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File is not an image'));
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onerror = (err) => {
      URL.revokeObjectURL(img.src);
      reject(err);
    };

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round(width * (maxWidth / height));
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob (WebP is better, fallback to JPEG)
      const mimeType = 'image/webp';
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas to Blob failed'));
          }
          // Preserve original filename but change extension if webp
          let newName = file.name;
          if (newName.lastIndexOf('.') !== -1) {
            newName = newName.substring(0, newName.lastIndexOf('.'));
          }
          newName += '.webp';
          
          const compressedFile = new File([blob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };
  });
};
