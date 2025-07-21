import React, { useState } from 'react';
import { mediaAPI } from '../services/api';

const MediaUpload = ({ eventId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState('photo');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = type === 'photo' 
        ? ['image/jpeg', 'image/png', 'image/jpg']
        : ['video/mp4', 'video/avi', 'video/mov'];
      
      if (!validTypes.includes(selectedFile.type)) {
        setError(`Please select a valid ${type} file`);
        return;
      }
      
      // Validate file size (max 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      await mediaAPI.uploadMedia(eventId, formData);
      
      // Reset form
      setFile(null);
      setType('photo');
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card">
      <h3>Upload Media</h3>
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label htmlFor="type">Media Type:</label>
          <select 
            id="type"
            value={type} 
            onChange={(e) => setType(e.target.value)}
            disabled={uploading}
          >
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file">Select File:</label>
          <input
            type="file"
            id="file"
            accept={type === 'photo' ? 'image/*' : 'video/*'}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        {file && (
          <div className="file-info">
            <p><strong>Selected:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn"
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload Media'}
        </button>
      </form>
    </div>
  );
};

export default MediaUpload;