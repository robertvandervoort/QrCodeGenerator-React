import React, { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";

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
      <div className="flex flex-col gap-2">
        {/* Color picker visible directly without needing a popover */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={inputColor}
            onChange={handleColorPickerChange}
            className="h-10 w-20 cursor-pointer"
          />
          <Input
            value={inputColor}
            onChange={handleHexChange}
            placeholder="#000000"
            className="flex-1"
          />
        </div>

        {/* RGB values */}
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
      </div>
    </div>
  );
};

export { ColorPicker };