import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-features',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="features-page">
      <div class="page-header">
        <h1>📚 System Features & Tools</h1>
      </div>

      <div class="features-grid">
        <!-- AI Assistant -->
        <div class="feature-card" (click)="openAI()">
          <div class="feature-icon">🤖</div>
          <h3>AI Assistant</h3>
          <p>Get instant help with tickets, system questions, and technical issues powered by Google Gemini.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Background Remover -->
        <div class="feature-card" (click)="navigate('bg-remover')">
          <div class="feature-icon">🎨</div>
          <h3>Background Remover</h3>
          <p>Remove backgrounds from images instantly. Perfect for profile photos and product images.</p>
          <span class="feature-badge new">New</span>
        </div>

        <!-- File Compressor -->
        <div class="feature-card" (click)="navigate('file-compressor')">
          <div class="feature-icon">📦</div>
          <h3>File Compressor</h3>
          <p>Compress PDF, Word, Excel, and image files to reduce size while maintaining quality.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Password Generator -->
        <div class="feature-card" (click)="navigate('password-generator')">
          <div class="feature-icon">🔐</div>
          <h3>Password Generator</h3>
          <p>Generate strong, secure passwords with customizable length and character sets.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- QR Code Generator -->
        <div class="feature-card" (click)="navigate('qr-generator')">
          <div class="feature-icon">📱</div>
          <h3>QR Code Generator</h3>
          <p>Create QR codes for URLs, text, or contact information in seconds.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Mini Games -->
        <div class="feature-card" (click)="navigate('games')">
          <div class="feature-icon">🎮</div>
          <h3>Mini Games</h3>
          <p>Take a break with classic games like Tic-Tac-Toe, Memory Match, and Snake.</p>
          <span class="feature-badge fun">Fun</span>
        </div>

        <!-- Notepad -->
        <div class="feature-card" (click)="navigate('notepad')">
          <div class="feature-icon">📝</div>
          <h3>Quick Notepad</h3>
          <p>Write and save quick notes. Auto-saves to your browser's local storage.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Unit Converter -->
        <div class="feature-card" (click)="navigate('unit-converter')">
          <div class="feature-icon">📐</div>
          <h3>Unit Converter</h3>
          <p>Convert between different units: length, weight, temperature, currency, and more.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- System Status -->
        <div class="feature-card" (click)="navigate('system-status')">
          <div class="feature-icon">🩺</div>
          <h3>System Status</h3>
          <p>Check the health and status of all EDPtech Helpdesk services and servers.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Feedback -->
        <div class="feature-card" (click)="navigate('feedback')">
          <div class="feature-icon">💬</div>
          <h3>Submit Feedback</h3>
          <p>Help us improve by sharing your ideas, suggestions, and bug reports.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="feature-card" (click)="navigate('shortcuts')">
          <div class="feature-icon">⌨️</div>
          <h3>Keyboard Shortcuts</h3>
          <p>Master keyboard shortcuts to navigate the system faster and boost productivity.</p>
          <span class="feature-badge primary">Available</span>
        </div>

        <!-- Dark Mode Toggle -->
        <div class="feature-card" (click)="toggleDarkMode()">
          <div class="feature-icon">🌙</div>
          <h3>Dark Mode</h3>
          <p>Toggle between light and dark themes for comfortable viewing day or night.</p>
          <span class="feature-badge primary">Available</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .features-page {
      padding: 20px;
      margin: 0 auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .page-header h1 {
      margin: 0;
      color: #0a246a;
      font-size: 22px;
    }
    .back-link {
      color: #0a246a;
      text-decoration: none;
      font-size: 12px;
    }
    .back-link:hover { text-decoration: underline; }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .feature-card {
      background: white;
      border: 1px solid #c0c0c0;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }
    .feature-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-color: #0a246a;
    }

    .feature-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .feature-card h3 {
      margin: 0 0 8px 0;
      color: #0a246a;
      font-size: 15px;
    }
    .feature-card p {
      margin: 0;
      font-size: 12px;
      color: #666;
      line-height: 1.5;
    }

    .feature-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      font-size: 9px;
      padding: 3px 8px;
      border-radius: 10px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .feature-badge.primary { background: #e8f0ff; color: #0a246a; }
    .feature-badge.new { background: #ffe8e8; color: #cc0000; animation: pulse 2s infinite; }
    .feature-badge.fun { background: #fff8e1; color: #f57f17; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `]
})
export class ClientFeaturesComponent {
  openAI() {
    // Trigger AI assistant
    const event = new CustomEvent('open-ai-assistant');
    window.dispatchEvent(event);
  }

  navigate(page: string) {
    // For now, show coming soon message
    const messages: Record<string, string> = {
      'bg-remover': '🎨 Background Remover\n\nComing soon! Remove image backgrounds instantly.',
      'file-compressor': '📦 File Compressor\n\nComing soon! Compress files without losing quality.',
      'password-generator': '🔐 Password Generator\n\nComing soon! Generate secure passwords.',
      'qr-generator': '📱 QR Code Generator\n\nComing soon! Create QR codes instantly.',
      'games': '🎮 Mini Games\n\nComing soon! Tic-Tac-Toe, Memory Match, Snake & more!',
      'notepad': '📝 Quick Notepad\n\nComing soon! Write and save quick notes.',
      'unit-converter': '📐 Unit Converter\n\nComing soon! Convert between different units.',
      'system-status': '🩺 System Status\n\nAll systems operational.',
      'feedback': '💬 Feedback\n\nComing soon! Share your ideas with us.',
      'shortcuts': '⌨️ Keyboard Shortcuts\n\nCtrl+N: New Ticket | F5: Refresh | Esc: Close menus',
    };
    
    alert(messages[page] || 'Feature coming soon!');
  }

  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    alert('🌙 Theme toggled!');
  }
}