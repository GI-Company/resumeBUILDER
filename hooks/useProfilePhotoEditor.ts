import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useProfilePhotoEditor(profilePhoto: any, setProfilePhoto: any) {
  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [bgRemoveSensitivity, setBgRemoveSensitivity] = useState(40);
  const [bgRemoveColor, setBgRemoveColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(20);
  const isDrawingRef = useRef(false);
  const eraserCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (eraseModalOpen) {
      setTimeout(() => {
        const canvas = eraserCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
      }, 100);
    }
  }, [eraseModalOpen, profilePhoto.url, profilePhoto.rawUploadedUrl]);

  const getCoordinates = (e: any) => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: any) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: any) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const coords = getCoordinates(e);
    if (!coords) return;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = "destination-out";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.beginPath();
  };

  const resetEraserCanvas = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || "https://picsum.photos/seed/portrait/150/150";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(img, 0, 0);
    };
  };

  const saveErasedImage = () => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const resultUrl = canvas.toDataURL("image/png");
    setProfilePhoto((p: any) => ({
      ...p,
      url: resultUrl
    }));
    setEraseModalOpen(false);
    toast.success("Erase touch-up applied! 🎨");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      setProfilePhoto((p: any) => ({
        ...p,
        enabled: true,
        url: b64,
        rawUploadedUrl: b64,
      }));
      toast.success("Profile photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = (targetColorHex: string, sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = parseInt(targetColorHex.slice(1, 3), 16);
      const gTarget = parseInt(targetColorHex.slice(3, 5), 16);
      const bTarget = parseInt(targetColorHex.slice(5, 7), 16);
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background color removed! 🪄");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };

  const handleAutoRemoveBackground = (sensitivity: number) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = profilePhoto.rawUploadedUrl || profilePhoto.url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const rTarget = data[0];
      const gTarget = data[1];
      const bTarget = data[2];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        const a = data[i+3];
        if (a === 0) continue;
        const distance = Math.sqrt(
          Math.pow(r - rTarget, 2) +
          Math.pow(g - gTarget, 2) +
          Math.pow(b - bTarget, 2)
        );
        if (distance < sensitivity) {
          data[i+3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const resultUrl = canvas.toDataURL("image/png");
      setProfilePhoto((p: any) => ({
        ...p,
        url: resultUrl
      }));
      toast.success("Background auto-removed! ✨");
    };
    img.onerror = () => {
      toast.error("Could not load image.");
    };
  };

  return {
    eraseModalOpen, setEraseModalOpen,
    bgRemoveSensitivity, setBgRemoveSensitivity,
    bgRemoveColor, setBgRemoveColor,
    brushSize, setBrushSize,
    eraserCanvasRef,
    startDrawing, draw, stopDrawing,
    resetEraserCanvas, saveErasedImage,
    handlePhotoUpload,
    handleRemoveBackground,
    handleAutoRemoveBackground
  };
}
