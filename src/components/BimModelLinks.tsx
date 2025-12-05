import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, ExternalLink } from 'lucide-react';
import type { BimModel, BimFormat } from '../types/asset';

const BIM_FORMATS: BimFormat[] = ['IFC', 'RVT', 'OBJ', 'STL', 'glTF', 'USDZ', 'Other'];

interface BimModelLinksProps {
  models: BimModel[];
  onChange: (models: BimModel[]) => void;
  disabled?: boolean;
}

export function BimModelLinks({ models, onChange, disabled = false }: BimModelLinksProps) {
  const [newModel, setNewModel] = useState<BimModel>({ url: '', format: undefined, source_software: '' });

  const handleAddModel = () => {
    if (!newModel.url.trim()) return;
    
    onChange([...models, { 
      url: newModel.url.trim(),
      format: newModel.format,
      source_software: newModel.source_software?.trim() || undefined
    }]);
    setNewModel({ url: '', format: undefined, source_software: '' });
  };

  const handleRemoveModel = (index: number) => {
    const updated = models.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateModel = (index: number, field: keyof BimModel, value: string | undefined) => {
    const updated = [...models];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium text-[#1A1A1A]">3D & BIM File Links (Optional)</Label>
      <p className="text-xs text-[#7A7A7A]">
        Add links to 3D models or BIM files hosted externally. No file upload required.
      </p>

      {/* Existing models */}
      {models.length > 0 && (
        <div className="space-y-2">
          {models.map((model, index) => (
            <Card key={index} className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={model.url}
                        onChange={(e) => handleUpdateModel(index, 'url', e.target.value)}
                        placeholder="URL"
                        disabled={disabled}
                        className="flex-1 text-sm"
                      />
                      <a 
                        href={model.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#2E7D32] hover:text-[#1B5E20]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={model.format || ''}
                        onValueChange={(value) => handleUpdateModel(index, 'format', value || undefined)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="w-32 text-sm">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          {BIM_FORMATS.map((format) => (
                            <SelectItem key={format} value={format}>
                              {format}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={model.source_software || ''}
                        onChange={(e) => handleUpdateModel(index, 'source_software', e.target.value)}
                        placeholder="Source software (e.g., Revit, SketchUp)"
                        disabled={disabled}
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveModel(index)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new model form */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="space-y-2">
            <Input
              value={newModel.url}
              onChange={(e) => setNewModel({ ...newModel, url: e.target.value })}
              placeholder="Enter URL to 3D/BIM file"
              disabled={disabled}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Select
                value={newModel.format || ''}
                onValueChange={(value) => setNewModel({ ...newModel, format: (value as BimFormat) || undefined })}
                disabled={disabled}
              >
                <SelectTrigger className="w-32 text-sm">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  {BIM_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newModel.source_software || ''}
                onChange={(e) => setNewModel({ ...newModel, source_software: e.target.value })}
                placeholder="Source software (optional)"
                disabled={disabled}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddModel}
                disabled={disabled || !newModel.url.trim()}
                className="whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
