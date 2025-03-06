
import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { EyeDropperIcon } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPicker = ({ color, onChange, label }: ColorPickerProps) => {
  const [inputColor, setInputColor] = useState(color.startsWith('#') ? color : `#${color}`);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputColor(value);
    onChange(value);
  };

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgb = hexToRgb(inputColor);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>{inputColor}</span>
            <div 
              className="h-4 w-4 rounded-sm border" 
              style={{ backgroundColor: inputColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <Tabs defaultValue="picker">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="picker">Color Picker</TabsTrigger>
              <TabsTrigger value="values">Values</TabsTrigger>
            </TabsList>
            <TabsContent value="picker" className="space-y-2">
              <div className="flex justify-center py-2">
                <input
                  type="color"
                  value={inputColor}
                  onChange={handleColorPickerChange}
                  className="h-32 w-32 cursor-pointer"
                />
              </div>
            </TabsContent>
            <TabsContent value="values" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hex-color">Hex</Label>
                <Input
                  id="hex-color"
                  value={inputColor}
                  onChange={handleHexChange}
                  placeholder="#000000"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="red-value">R</Label>
                  <Input
                    id="red-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.r}
                    onChange={(e) => {
                      const r = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                      const newColor = `#${r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
                      setInputColor(newColor);
                      onChange(newColor);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="green-value">G</Label>
                  <Input
                    id="green-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.g}
                    onChange={(e) => {
                      const g = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                      const newColor = `#${rgb.r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
                      setInputColor(newColor);
                      onChange(newColor);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="blue-value">B</Label>
                  <Input
                    id="blue-value"
                    type="number"
                    min="0"
                    max="255"
                    value={rgb.b}
                    onChange={(e) => {
                      const b = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                      const newColor = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                      setInputColor(newColor);
                      onChange(newColor);
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { ColorPicker };
