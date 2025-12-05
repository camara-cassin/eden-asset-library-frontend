import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { AssetImage } from '../types/asset';

interface PendingImage {
  file: File;
  preview: string;
  caption: string;
  is_primary: boolean;
}

interface ImageUploadProps {
  images: AssetImage[];
  onImagesChange: (images: AssetImage[]) => void;
  pendingImages: PendingImage[];
  onPendingImagesChange: (images: PendingImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onImagesChange,
  pendingImages,
  onPendingImagesChange,
  maxImages = 4,
  disabled = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const totalImages = images.length + pendingImages.length;
  const canAddMore = totalImages < maxImages;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setError(null);

    const remainingSlots = maxImages - totalImages;
    if (files.length > remainingSlots) {
      setError(`You can only add ${remainingSlots} more image(s). Maximum is ${maxImages}.`);
      return;
    }

    const newPendingImages: PendingImage[] = [];
    const hasPrimary = images.some(img => img.is_primary) || pendingImages.some(img => img.is_primary);

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files (JPG, PNG, GIF, WebP)');
        return;
      }

      const preview = URL.createObjectURL(file);
      newPendingImages.push({
        file,
        preview,
        caption: '',
        is_primary: !hasPrimary && index === 0 && images.length === 0 && pendingImages.length === 0,
      });
    });

    onPendingImagesChange([...pendingImages, ...newPendingImages]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePendingImage = (index: number) => {
    const removed = pendingImages[index];
    URL.revokeObjectURL(removed.preview);
    
    const newPending = pendingImages.filter((_, i) => i !== index);
    
    // If we removed the primary, set the first remaining as primary
    if (removed.is_primary && (newPending.length > 0 || images.length > 0)) {
      if (newPending.length > 0) {
        newPending[0].is_primary = true;
      } else if (images.length > 0) {
        const newImages = [...images];
        newImages[0] = { ...newImages[0], is_primary: true };
        onImagesChange(newImages);
      }
    }
    
    onPendingImagesChange(newPending);
  };

  const removeExistingImage = (index: number) => {
    const removed = images[index];
    const newImages = images.filter((_, i) => i !== index);
    
    // If we removed the primary, set the first remaining as primary
    if (removed.is_primary && (newImages.length > 0 || pendingImages.length > 0)) {
      if (newImages.length > 0) {
        newImages[0] = { ...newImages[0], is_primary: true };
      } else if (pendingImages.length > 0) {
        const newPending = [...pendingImages];
        newPending[0].is_primary = true;
        onPendingImagesChange(newPending);
      }
    }
    
    onImagesChange(newImages);
  };

  const setPrimaryPending = (index: number) => {
    // Clear primary from existing images
    const newImages = images.map(img => ({ ...img, is_primary: false }));
    onImagesChange(newImages);
    
    // Set primary on pending images
    const newPending = pendingImages.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onPendingImagesChange(newPending);
  };

  const setPrimaryExisting = (index: number) => {
    // Clear primary from pending images
    const newPending = pendingImages.map(img => ({ ...img, is_primary: false }));
    onPendingImagesChange(newPending);
    
    // Set primary on existing images
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onImagesChange(newImages);
  };

  const updatePendingCaption = (index: number, caption: string) => {
    const newPending = [...pendingImages];
    newPending[index] = { ...newPending[index], caption };
    onPendingImagesChange(newPending);
  };

  const updateExistingCaption = (index: number, caption: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], caption };
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-[#1A1A1A]">
          Images ({totalImages}/{maxImages})
        </Label>
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-[#1B4FFF] text-[#1B4FFF]"
            disabled={disabled}
          >
            Add Images
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Image grid */}
      {(images.length > 0 || pendingImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Existing images */}
          {images.map((img, index) => (
            <div key={`existing-${index}`} className="relative border border-[#D8D8D8] rounded-lg overflow-hidden">
              <img
                src={img.url}
                alt={img.caption || `Image ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="p-2 space-y-2">
                <Input
                  value={img.caption || ''}
                  onChange={(e) => updateExistingCaption(index, e.target.value)}
                  placeholder="Caption (optional)"
                  className="text-xs h-7 border-[#D8D8D8]"
                  disabled={disabled}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`primary-existing-${index}`}
                      checked={img.is_primary || false}
                      onCheckedChange={() => setPrimaryExisting(index)}
                      disabled={disabled}
                    />
                    <label htmlFor={`primary-existing-${index}`} className="text-xs text-[#7A7A7A]">
                      Primary
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExistingImage(index)}
                    className="text-red-500 hover:text-red-700 h-6 px-2 text-xs"
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {img.is_primary && (
                <div className="absolute top-2 left-2 bg-[#1B4FFF] text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}

          {/* Pending images */}
          {pendingImages.map((img, index) => (
            <div key={`pending-${index}`} className="relative border border-[#D8D8D8] rounded-lg overflow-hidden">
              <img
                src={img.preview}
                alt={img.caption || `New image ${index + 1}`}
                className="w-full h-32 object-cover"
              />
              <div className="p-2 space-y-2">
                <Input
                  value={img.caption}
                  onChange={(e) => updatePendingCaption(index, e.target.value)}
                  placeholder="Caption (optional)"
                  className="text-xs h-7 border-[#D8D8D8]"
                  disabled={disabled}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`primary-pending-${index}`}
                      checked={img.is_primary}
                      onCheckedChange={() => setPrimaryPending(index)}
                      disabled={disabled}
                    />
                    <label htmlFor={`primary-pending-${index}`} className="text-xs text-[#7A7A7A]">
                      Primary
                    </label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePendingImage(index)}
                    className="text-red-500 hover:text-red-700 h-6 px-2 text-xs"
                    disabled={disabled}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {img.is_primary && (
                <div className="absolute top-2 left-2 bg-[#1B4FFF] text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                New
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && pendingImages.length === 0 && (
        <div 
          className="border-2 border-dashed border-[#D8D8D8] rounded-lg p-8 text-center cursor-pointer hover:border-[#1B4FFF] transition-colors"
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <p className="text-[#7A7A7A]">
            Click to upload images (up to {maxImages})
          </p>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Supported: JPG, PNG, GIF, WebP
          </p>
        </div>
      )}
    </div>
  );
}

export type { PendingImage };
