export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const resizeImage = (file: File, maxWidth: number = 800): Promise<string> => {
  return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if(!ctx) return resolve(e.target?.result as string);

              const scale = maxWidth / img.width;
              if (scale >= 1) return resolve(e.target?.result as string);

              canvas.width = maxWidth;
              canvas.height = img.height * scale;

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              resolve(canvas.toDataURL(file.type));
          };
          img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
  });
}
