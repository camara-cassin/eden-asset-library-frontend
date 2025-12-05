import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type DocType = 'technical_spec' | 'cad_files' | 'engineering_drawings' | 'manuals' | 'images' | 'general';

export interface UploadedFile {
  file: File;
  docType: DocType;
}

export interface UploadedDocument {
  url: string;
  filename: string;
  docType: string;
  size?: number;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_spec: 'Technical Specifications',
  cad_files: 'CAD Files',
  engineering_drawings: 'Engineering Drawings',
  manuals: 'Manuals & Instructions',
  images: 'Product Images',
  general: 'Other Documents',
};

interface DocumentUploadProps {
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  existingDocuments?: UploadedDocument[];
  disabled?: boolean;
  showExisting?: boolean;
}

export function DocumentUpload({
  uploadedFiles,
  onFilesChange,
  existingDocuments = [],
  disabled = false,
  showExisting = true,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentDocType, setCurrentDocType] = useState<DocType>('general');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      docType: currentDocType,
    }));

    onFilesChange([...uploadedFiles, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(uploadedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="docType" className="text-[#1A1A1A]">Document Type</Label>
          <Select 
            value={currentDocType} 
            onValueChange={(v) => setCurrentDocType(v as DocType)}
            disabled={disabled}
          >
            <SelectTrigger className="border-[#D8D8D8]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-[#1B4FFF] text-[#1B4FFF]"
            disabled={disabled}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.dwg,.dxf,.step,.stp,.iges,.igs,.stl,.obj,.jpg,.jpeg,.png,.gif,.webp"
          />
        </div>
      </div>

      {/* Pending uploads */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[#1A1A1A]">Files to Upload ({uploadedFiles.length})</Label>
          <div className="border border-[#D8D8D8] rounded-lg divide-y divide-[#D8D8D8]">
            {uploadedFiles.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    {DOC_TYPE_LABELS[item.docType]} - {formatFileSize(item.file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={disabled}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing documents */}
      {showExisting && existingDocuments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[#1A1A1A]">Uploaded Documents ({existingDocuments.length})</Label>
          <div className="border border-[#D8D8D8] rounded-lg divide-y divide-[#D8D8D8]">
            {existingDocuments.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {doc.filename}
                  </p>
                  <p className="text-xs text-[#7A7A7A]">
                    {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                    {doc.size && ` - ${formatFileSize(doc.size)}`}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1B4FFF] hover:underline"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {uploadedFiles.length === 0 && existingDocuments.length === 0 && (
        <div className="border-2 border-dashed border-[#D8D8D8] rounded-lg p-8 text-center">
          <p className="text-[#7A7A7A]">
            No files selected. Upload technical specs, CAD files, manuals, or images.
          </p>
          <p className="text-sm text-[#7A7A7A] mt-1">
            Supported: PDF, DOC, DWG, DXF, STEP, STL, JPG, PNG
          </p>
        </div>
      )}
    </div>
  );
}
