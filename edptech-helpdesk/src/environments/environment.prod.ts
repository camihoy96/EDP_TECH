export const environment = {
  production: false,
  
  apiUrl: 'http://192.168.5.108:6001',
  aiApiUrl: 'http://192.168.5.108:5000',
  streamUrl: 'http://192.168.5.108:5001',
  uploadsUrl: 'http://192.168.5.108:6001/uploads',
  phpMyAdminUrl: 'http://192.168.5.108/phpmyadmin',   //  port 80
  
  networks: {
    megaspeed: {
      apiUrl: 'http://192.168.0.10:6001',
      aiApiUrl: 'http://192.168.0.10:5000',
      streamUrl: 'http://192.168.0.10:5001',
      uploadsUrl: 'http://192.168.0.10:6001/uploads',
      phpMyAdminUrl: 'http://192.168.0.10/phpmyadmin'   //  port 80
    },
    pldt: {
      apiUrl: 'http://192.168.5.108:6001',
      aiApiUrl: 'http://192.168.5.108:5000',
      streamUrl: 'http://192.168.5.108:5001',
      uploadsUrl: 'http://192.168.5.108:6001/uploads',
      phpMyAdminUrl: 'http://192.168.5.108/phpmyadmin'  //  port 80
    }
  }
};