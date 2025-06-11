// lib/loaders/resource-loader.ts - Asset and component preloading system
import { appLoader } from './app-loader';

interface ResourceConfig {
  enableImagePreloading: boolean;
  enableComponentPreloading: boolean;
  enableFontPreloading: boolean;
  preloadCriticalAssets: boolean;
  lazyLoadThreshold: number;
}

interface PreloadedResource {
  url: string;
  type: 'image' | 'font' | 'script' | 'style' | 'component';
  status: 'loading' | 'loaded' | 'error';
  priority: number;
  timestamp: number;
}

export class ResourceLoader {
  private config: ResourceConfig;
  private preloadedResources = new Map<string, PreloadedResource>();
  private componentCache = new Map<string, any>();
  private observerInstances = new Map<string, IntersectionObserver>();

  constructor(config: Partial<ResourceConfig> = {}) {
    this.config = {
      enableImagePreloading: true,
      enableComponentPreloading: true,
      enableFontPreloading: true,
      preloadCriticalAssets: true,
      lazyLoadThreshold: 0.1,
      ...config
    };

    if (typeof window !== 'undefined') {
      this.initializePreloading();
    }
  }

  // Initialize preloading system
  private initializePreloading(): void {
    // Preload critical assets immediately
    if (this.config.preloadCriticalAssets) {
      this.preloadCriticalAssets();
    }

    // Set up intersection observers for lazy loading
    this.setupLazyLoading();

    // Preload fonts
    if (this.config.enableFontPreloading) {
      this.preloadFonts();
    }
  }

  // Preload critical assets that are needed immediately
  private async preloadCriticalAssets(): Promise<void> {
    const criticalAssets = [
      // Critical images
      { url: '/logo.png', type: 'image' as const, priority: 10 },
      { url: '/favicon.ico', type: 'image' as const, priority: 10 },
      
      // Critical scripts (if any external)
      { url: 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', type: 'script' as const, priority: 8 },
      
      // Critical styles
      { url: '/globals.css', type: 'style' as const, priority: 9 }
    ];

    const promises = criticalAssets.map(asset => this.preloadResource(asset));
    await Promise.allSettled(promises);
  }

  // Preload a single resource
  async preloadResource(resource: { url: string; type: 'image' | 'font' | 'script' | 'style'; priority: number }): Promise<void> {
    const { url, type, priority } = resource;
    
    if (this.preloadedResources.has(url)) {
      return; // Already preloaded or in progress
    }

    this.preloadedResources.set(url, {
      url,
      type,
      status: 'loading',
      priority,
      timestamp: Date.now()
    });

    try {
      switch (type) {
        case 'image':
          await this.preloadImage(url);
          break;
        case 'font':
          await this.preloadFont(url);
          break;
        case 'script':
          await this.preloadScript(url);
          break;
        case 'style':
          await this.preloadStyle(url);
          break;
      }

      this.preloadedResources.set(url, {
        ...this.preloadedResources.get(url)!,
        status: 'loaded'
      });

    } catch (error) {
      console.error(`[ResourceLoader] Failed to preload ${type}: ${url}`, error);
      this.preloadedResources.set(url, {
        ...this.preloadedResources.get(url)!,
        status: 'error'
      });
    }
  }

  // Preload image
  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  }

  // Preload font
  private async preloadFont(url: string): Promise<void> {
    if ('fonts' in document) {
      try {
        const font = new FontFace('preloaded-font', `url(${url})`);
        await font.load();
        document.fonts.add(font);
      } catch (error) {
        throw new Error(`Failed to load font: ${url}`);
      }
    } else if (typeof document !== 'undefined') {
      // Fallback for browsers without FontFace API
      const doc = document as Document;
      const link = doc.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = url;
      doc.head.appendChild(link);
    }
  }

  // Preload script
  private async preloadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      script.src = url;
      script.async = true;
      document.head.appendChild(script);
    });
  }

  // Preload stylesheet
  private async preloadStyle(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load stylesheet: ${url}`));
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  // Preload fonts
  private async preloadFonts(): Promise<void> {
    const fonts = [
      '/fonts/inter-regular.woff2',
      '/fonts/inter-medium.woff2',
      '/fonts/inter-bold.woff2'
    ];

    const promises = fonts.map(url => 
      this.preloadResource({ url, type: 'font', priority: 7 })
    );

    await Promise.allSettled(promises);
  }

  // Setup lazy loading for images and components
  private setupLazyLoading(): void {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.src;
            const component = element.dataset.component;

            if (src && this.config.enableImagePreloading) {
              this.loadLazyImage(element as HTMLImageElement, src);
            }

            if (component && this.config.enableComponentPreloading) {
              this.loadLazyComponent(element, component);
            }

            observer.unobserve(element);
          }
        });
      },
      { threshold: this.config.lazyLoadThreshold }
    );

    this.observerInstances.set('lazy-loader', observer);
  }

  // Load lazy image
  private loadLazyImage(img: HTMLImageElement, src: string): void {
    img.src = src;
    img.classList.add('loaded');
    img.removeAttribute('data-src');
  }

  // Load lazy component
  private async loadLazyComponent(element: HTMLElement, componentName: string): Promise<void> {
    try {
      if (this.componentCache.has(componentName)) {
        return; // Already loaded
      }

      // Dynamic import based on component name
      let component;
      switch (componentName) {
        case 'TradingViewWidget':
          component = await import('@/components/trading/tradingview-widget');
          break;
        // case 'MarketChart':
        //   component = await import('@/components/market/market-chart');
        //   break;
        // case 'PortfolioChart':
        //   component = await import('@/components/portfolio/portfolio-chart');
        //   break;
        // case 'NewsWidget':
        //   component = await import('@/components/news/news-widget');
        //   break;
        // case 'AIAssistant':
        //   component = await import('@/components/ai-assistant');
        //   break;
        default:
          console.warn(`[ResourceLoader] Unknown or missing component: ${componentName}`);
          return;
      }

      this.componentCache.set(componentName, component);
      element.setAttribute('data-component-loaded', 'true');

    } catch (error) {
      console.error(`[ResourceLoader] Failed to load component ${componentName}:`, error);
    }
  }

  // Preload page-specific resources
  async preloadPageResources(pageName: string): Promise<void> {
    const pageResources = this.getPageResources(pageName);
    const promises = pageResources.map(resource => this.preloadResource(resource));
    await Promise.allSettled(promises);
  }

  // Get resources for specific pages
  private getPageResources(pageName: string): Array<{ url: string; type: 'image' | 'font' | 'script' | 'style'; priority: number }> {
    const resources: Record<string, Array<{ url: string; type: 'image' | 'font' | 'script' | 'style'; priority: number }>> = {
      home: [
        { url: '/images/hero-bg.jpg', type: 'image', priority: 9 },
        { url: '/images/features-crypto.png', type: 'image', priority: 7 },
        { url: '/images/features-ai.png', type: 'image', priority: 7 }
      ],
      crypto: [
        { url: 'https://s3.tradingview.com/tv.js', type: 'script', priority: 8 },
        { url: '/images/crypto-icons/btc.png', type: 'image', priority: 8 },
        { url: '/images/crypto-icons/eth.png', type: 'image', priority: 8 },
        { url: '/images/crypto-icons/sol.png', type: 'image', priority: 7 }
      ],
      portfolio: [
        { url: '/images/portfolio-chart-bg.png', type: 'image', priority: 7 },
        { url: 'https://unpkg.com/recharts@2.8.0/es6/index.js', type: 'script', priority: 6 }
      ],
      trade: [
        { url: 'https://s3.tradingview.com/tv.js', type: 'script', priority: 9 },
        { url: '/images/trading-interface-bg.png', type: 'image', priority: 6 }
      ],
      news: [
        { url: '/images/news-placeholder.jpg', type: 'image', priority: 6 }
      ],
      ai: [
        { url: '/images/ai-chat-bg.png', type: 'image', priority: 7 }
      ]
    };

    return resources[pageName] || [];
  }

  // Preload route-based resources
  async preloadRoute(route: string): Promise<void> {
    const routeParts = route.split('/').filter(Boolean);
    const mainRoute = routeParts[0] || 'home';
    
    await this.preloadPageResources(mainRoute);
    
    // Also preload common resources
    await this.preloadCommonResources();
  }

  // Preload common resources used across pages
  private async preloadCommonResources(): Promise<void> {
    const commonResources = [
      { url: '/images/logo-white.png', type: 'image' as const, priority: 8 },
      { url: '/images/avatar-placeholder.png', type: 'image' as const, priority: 6 },
      { url: '/images/loading-spinner.svg', type: 'image' as const, priority: 7 }
    ];

    const promises = commonResources.map(resource => this.preloadResource(resource));
    await Promise.allSettled(promises);
  }

  // Register lazy loadable elements
  observeLazyElements(selector: string = '[data-src], [data-component]'): void {
    if (typeof window === 'undefined') return;

    const observer = this.observerInstances.get('lazy-loader');
    if (!observer) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach(element => observer.observe(element));
  }

  // Preload critical components for faster navigation
  async preloadCriticalComponents(): Promise<void> {
    const criticalComponents = [
      'Navbar',
      // 'LoadingSpinner',
      // 'ErrorBoundary',
      // 'AuthForm'
    ];

    const promises = criticalComponents.map(async (componentName) => {
      try {
        let component;
        switch (componentName) {
          case 'Navbar':
            component = await import('@/components/navbar');
            break;
          // case 'LoadingSpinner':
          //   component = await import('@/components/ui/loading-spinner');
          //   break;
          // case 'ErrorBoundary':
          //   component = await import('@/lib/error-boundary');
          //   break;
          // case 'AuthForm':
          //   component = await import('@/components/auth/auth-form');
          //   break;
        }
        
        if (component) {
          this.componentCache.set(componentName, component);
        }
      } catch (error) {
        console.error(`[ResourceLoader] Failed to preload ${componentName}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Get preloaded component
  getPreloadedComponent(name: string): any {
    return this.componentCache.get(name);
  }

  // Check if resource is preloaded
  isResourceLoaded(url: string): boolean {
    const resource = this.preloadedResources.get(url);
    return resource?.status === 'loaded';
  }

  // Get loading statistics
  getStats(): {
    totalResources: number;
    loadedResources: number;
    failedResources: number;
    cachedComponents: number;
    loadingProgress: number;
  } {
    const total = this.preloadedResources.size;
    const loaded = Array.from(this.preloadedResources.values()).filter(r => r.status === 'loaded').length;
    const failed = Array.from(this.preloadedResources.values()).filter(r => r.status === 'error').length;
    
    return {
      totalResources: total,
      loadedResources: loaded,
      failedResources: failed,
      cachedComponents: this.componentCache.size,
      loadingProgress: total > 0 ? (loaded / total) * 100 : 100
    };
  }

  // Clear caches
  clearCache(): void {
    this.preloadedResources.clear();
    this.componentCache.clear();
  }

  // Optimize images for different screen sizes
  async preloadResponsiveImages(baseUrl: string, sizes: string[] = ['320w', '768w', '1024w', '1920w']): Promise<void> {
    const promises = sizes.map(size => {
      const url = `${baseUrl}?w=${size.replace('w', '')}`;
      return this.preloadResource({ url, type: 'image', priority: 6 });
    });

    await Promise.allSettled(promises);
  }

  // Cleanup observers when not needed
  cleanup(): void {
    this.observerInstances.forEach(observer => observer.disconnect());
    this.observerInstances.clear();
  }
}

// Export singleton instance
export const resourceLoader = new ResourceLoader({
  enableImagePreloading: true,
  enableComponentPreloading: true,
  enableFontPreloading: true,
  preloadCriticalAssets: true,
  lazyLoadThreshold: 0.1
});