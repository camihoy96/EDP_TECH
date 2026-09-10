import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  
  constructor() {
    this.detectNetworkFromLocation();
  }

  private detectNetworkFromLocation() {
    const hostname = window.location.hostname;
    console.log('Application accessed via:', hostname);
    
    // If accessing via MegaSpeed IP, use MegaSpeed backend
    if (hostname.startsWith('192.168.0.')) {
      console.log('✅ Client on MegaSpeed network');
      this.updateApiUrls(environment.networks.megaspeed);
    }
    // If accessing via PLDT IP, use PLDT backend
    else if (hostname.startsWith('192.168.5.')) {
      console.log('✅ Client on PLDT network');
      this.updateApiUrls(environment.networks.pldt);
    }
    // Local development
    else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('💻 Local development');
      this.updateApiUrls(environment.networks.pldt);
    }
  }

  private updateApiUrls(config: any) {
    environment.apiUrl = config.apiUrl;
    environment.aiApiUrl = config.aiApiUrl;
    environment.streamUrl = config.streamUrl;
    environment.uploadsUrl = config.uploadsUrl;
    
    console.log('Using API URLs:', {
      apiUrl: environment.apiUrl,
      aiApiUrl: environment.aiApiUrl,
      streamUrl: environment.streamUrl,
      uploadsUrl: environment.uploadsUrl
    });
  }
}