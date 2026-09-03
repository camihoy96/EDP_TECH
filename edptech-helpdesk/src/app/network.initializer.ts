import { environment } from '../environments/environment';

// ✅ Define the network config type
interface NetworkConfig {
  apiUrl: string;
  aiApiUrl: string;
  streamUrl: string;
  uploadsUrl: string;
}

/**
 * This function runs before the Angular app boots.
 * It detects the network and updates environment.apiUrl in-place.
 */
export function initializeNetwork(): () => Promise<void> {
  return async () => {
    console.log('🔍 Detecting network...');
    
    // Check if user already selected a network
    const savedNetwork = localStorage.getItem('selectedNetwork');
    
    // ✅ Type-safe check
    if (savedNetwork === 'megaspeed' || savedNetwork === 'pldt') {
      const config = environment.networks[savedNetwork];
      console.log(`✅ Using saved network: ${savedNetwork}`);
      updateEnvironment(config);
      return;
    }
    
    // Auto-detect by testing connectivity
    const detected = await autoDetectNetwork();
    
    if (detected) {
      updateEnvironment(detected);
    } else {
      console.warn('⚠️ No network detected, using default configuration');
    }
  };
}

function updateEnvironment(config: NetworkConfig): void {
  // ✅ MUTATES the environment object in-place
  environment.apiUrl = config.apiUrl;
  environment.aiApiUrl = config.aiApiUrl;
  environment.streamUrl = config.streamUrl;
  environment.uploadsUrl = config.uploadsUrl;
  
  console.log('🌐 Network configured:', {
    apiUrl: environment.apiUrl,
    aiApiUrl: environment.aiApiUrl,
    streamUrl: environment.streamUrl
  });
}

async function autoDetectNetwork(): Promise<NetworkConfig | null> {
  // Try PLDT first
  const pldtConnected = await testConnection(environment.networks.pldt.apiUrl);
  if (pldtConnected) {
    console.log('✅ Connected to PLDT network');
    localStorage.setItem('selectedNetwork', 'pldt');
    return environment.networks.pldt;
  }
  
  // Try MegaSpeed
  const megaConnected = await testConnection(environment.networks.megaspeed.apiUrl);
  if (megaConnected) {
    console.log('✅ Connected to MegaSpeed network');
    localStorage.setItem('selectedNetwork', 'megaspeed');
    return environment.networks.megaspeed;
  }
  
  console.warn('⚠️ Could not detect any network');
  return null;
}

function testConnection(baseUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, 3000);
    
    fetch(`${baseUrl}/health`, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
      clearTimeout(timeout);
      resolve(response.ok);
    })
    .catch(() => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}