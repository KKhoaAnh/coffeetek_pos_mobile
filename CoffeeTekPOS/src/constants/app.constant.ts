const HOST = 'http://172.20.10.8:3000';

// const HOST = 'https://unfabling-leandra-insectival.ngrok-free.dev';
export const AppConstants = {
  HOST: HOST,
  BASE_URL: `${HOST}/api`,
  IMAGE_PREFIX: `${HOST}/uploads/`,
};

export const getImageUrl = (imageName?: string) => {
  if (!imageName) return undefined;
  
  if (imageName.startsWith('http')) return imageName;
  const cleanPath = imageName.startsWith('/') ? imageName.substring(1) : imageName;

  return `${AppConstants.IMAGE_PREFIX}${cleanPath}`;
};

export const Colors = {
  primary: '#5D4037',
  secondary: '#8D6E63',
  background: '#F5F5F5',
  white: '#FFFFFF',
  red: '#D32F2F',
  green: '#388E3C',
  blue: '#3838f4e2',
  yellow: '#FFC107',
};