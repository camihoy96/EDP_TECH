export const environment = {
  production: true,
  
  apiUrl: 'http://192.168.5.108:6001',
  aiApiUrl: 'http://192.168.5.108:5000',
  streamUrl: 'http://192.168.5.108:5001',
  uploadsUrl: 'http://192.168.5.108:6001/uploads',
  
  networks: {
    megaspeed: {
      apiUrl: 'http://192.168.0.10:6001',
      aiApiUrl: 'http://192.168.0.10:5000',
      streamUrl: 'http://192.168.0.10:5001',
      uploadsUrl: 'http://192.168.0.10:6001/uploads'
    },
    pldt: {
      apiUrl: 'http://192.168.5.108:6001',
      aiApiUrl: 'http://192.168.5.108:5000',
      streamUrl: 'http://192.168.5.108:5001',
      uploadsUrl: 'http://192.168.5.108:6001/uploads'
    }
  }
};