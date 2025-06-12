import { appLoader } from './app-loader';
import { resourceLoader } from './resource-loader';
import { apiLoader } from './api-loader';

export class PageLoader {
  static async loadDashboard(userId: string) {
    console.log('[PageLoader] Loading dashboard for:', userId);
    // Simplified loading for build
    return Promise.resolve();
  }

  static async loadCryptoPage() {
    console.log('[PageLoader] Loading crypto page...');
    return Promise.resolve();
  }

  static async loadPortfolioPage(userId: string) {
    console.log('[PageLoader] Loading portfolio page for:', userId);
    return Promise.resolve();
  }

  static async loadNewsPage() {
    console.log('[PageLoader] Loading news page...');
    return Promise.resolve();
  }

  static async loadTradePage() {
    console.log('[PageLoader] Loading trade page...');
    return Promise.resolve();
  }

  static async loadAIPage() {
    console.log('[PageLoader] Loading AI page...');
    return Promise.resolve();
  }

  static async loadProfilePage(userId: string) {
    console.log('[PageLoader] Loading profile page for:', userId);
    return Promise.resolve();
  }
}