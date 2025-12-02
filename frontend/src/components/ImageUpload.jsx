import React, { useState } from 'react';
import { AiOutlineCloudUpload, AiOutlineDelete, AiOutlineLoading3Quarters } from 'react-icons/ai';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const ImageUpload = ({ images, setImages, maxImages = 5 }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileSelect = async (files) => {
    if (files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      enqueueSnackbar(`You can only upload up to ${maxImages} images`, { variant: 'warning' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const response = await axios.post('http://localhost:5556/vehicles/upload-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImages([...images, ...response.data.images]);
      enqueueSnackbar('Images uploaded successfully!', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error uploading images', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      enqueueSnackbar('Only image files are allowed', { variant: 'warning' });
    }
    
    handleFileSelect(imageFiles);
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="image-upload"
          disabled={uploading || images.length >= maxImages}
        />
        
        <label
          htmlFor="image-upload"
          className={`cursor-pointer ${uploading || images.length >= maxImages ? 'cursor-not-allowed' : ''}`}
        >
          <div className="flex flex-col items-center">
            {uploading ? (
              <AiOutlineLoading3Quarters className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            ) : (
              <AiOutlineCloudUpload className="h-12 w-12 text-gray-400 mb-4" />
            )}
            
            <div className="text-sm text-gray-600">
              {uploading ? (
                <span>Uploading images...</span>
              ) : images.length >= maxImages ? (
                <span>Maximum {maxImages} images allowed</span>
              ) : (
                <>
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </>
              )}
            </div>
            
            {!uploading && images.length < maxImages && (
              <div className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG up to 5MB each (max {maxImages} images)
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Vehicle image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <AiOutlineDelete className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <div className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded
      </div>
    </div>
  );
};

export default ImageUpload;