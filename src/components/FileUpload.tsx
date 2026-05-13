import React, { useState, useRef } from 'react';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { Upload, X, Check, Image as ImageIcon, File as FileIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onUploadComplete: (url: string) => void;
  required?: boolean;
}

export function FileUpload({ label, onUploadComplete, required = false }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    setError(null);
    setIsUploading(true);
    setProgress(0);
    
    try {
      let finalFile = fileToUpload;
      
      // Compress if image
      if (fileToUpload.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        finalFile = await imageCompression(fileToUpload, options);
      } else if (fileToUpload.size > 5 * 1024 * 1024) {
        throw new Error('حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)');
      }
      
      setFile(finalFile);

      // Create storage reference
      const storageRef = ref(storage, `documents/${Date.now()}_${finalFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, finalFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(progress);
        }, 
        (error) => {
          console.error(error);
          setError('فشل رفع الملف. يرجى المحاولة مرة أخرى.');
          setIsUploading(false);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setUrl(downloadURL);
          setIsUploading(false);
          onUploadComplete(downloadURL);
        }
      );
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء معالجة الملف');
      setIsUploading(false);
    }
  };

  const resetUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUrl(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };

  return (
    <div className="mb-4 relative">
      {!isUploading && !url && (
         <label className="absolute inset-0 z-10 cursor-pointer">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
         </label>
      )}
      <div 
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors relative overflow-hidden
          ${url ? 'border-green-500 bg-green-50' : 
            error ? 'border-red-400 bg-red-50' : 
            isUploading ? 'border-accent-gold bg-accent-gold/5' : 
            'border-gray-300 hover:bg-gray-50'}
        `}
      >
        
        {isUploading && (
          <div className="absolute bottom-0 left-0 h-1 bg-accent-gold transition-all duration-300" style={{ width: `${progress}%` }}></div>
        )}

        {url ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <Check size={20} />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-800 line-clamp-1">{label}</p>
                <p className="text-xs text-green-600 font-medium z-10">تم الرفع بنجاح</p>
              </div>
            </div>
            <button onClick={resetUpload} className="p-2 text-gray-400 hover:text-red-500 transition-colors z-10 relative bg-white rounded-full">
              <X size={18} />
            </button>
          </div>
        ) : isUploading ? (
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-accent-gold/20 text-accent-gold rounded-full flex items-center justify-center shrink-0 animate-spin">
               <Loader2 size={20} />
             </div>
             <div className="text-right flex-1">
                <p className="text-sm font-bold text-gray-800 mb-1">{label}</p>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>جاري الرفع...</span>
                  <span>{progress}%</span>
                </div>
             </div>
          </div>
        ) : (
          <div className="py-2">
            <Upload className={`w-8 h-8 mx-auto mb-2 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <p className="text-sm font-bold text-gray-800">{label} {required && <span className="text-red-500">*</span>}</p>
            {error ? (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">اضغط للتصوير أو اختيار ملف</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
