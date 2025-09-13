/**
 * Mobile responsiveness testing utilities
 */

export interface ResponsivenessTestResult {
  viewport: string;
  width: number;
  height: number;
  passed: boolean;
  issues: string[];
}

export class MobileResponsivenessTest {
  private static readonly BREAKPOINTS = {
    mobile: { width: 375, height: 667 }, // iPhone SE
    tablet: { width: 768, height: 1024 }, // iPad
    desktop: { width: 1920, height: 1080 } // Desktop
  };

  /**
   * Test responsiveness across different viewport sizes
   */
  static async testResponsiveness(): Promise<ResponsivenessTestResult[]> {
    const results: ResponsivenessTestResult[] = [];
    
    for (const [viewport, dimensions] of Object.entries(this.BREAKPOINTS)) {
      const result = await this.testViewport(viewport, dimensions.width, dimensions.height);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Test a specific viewport size
   */
  private static async testViewport(
    viewport: string, 
    width: number, 
    height: number
  ): Promise<ResponsivenessTestResult> {
    const issues: string[] = [];
    
    try {
      // Simulate viewport resize (note: this won't actually resize the browser)
      // In a real test environment, you'd use tools like Puppeteer or Playwright
      
      // Test 1: Check if navigation is accessible
      const nav = document.querySelector('nav');
      if (nav) {
        const navRect = nav.getBoundingClientRect();
        if (width < 768 && navRect.width > width) {
          issues.push('Navigation may overflow on mobile devices');
        }
      }
      
      // Test 2: Check for horizontal scrollbars
      const body = document.body;
      if (body.scrollWidth > width) {
        issues.push('Content may cause horizontal scrolling');
      }
      
      // Test 3: Check button sizes for touch targets
      const buttons = document.querySelectorAll('button, a');
      buttons.forEach((button, index) => {
        const rect = button.getBoundingClientRect();
        if (width < 768 && (rect.width < 44 || rect.height < 44)) {
          issues.push(`Button ${index + 1} may be too small for touch interaction`);
        }
      });
      
      // Test 4: Check text readability
      const textElements = document.querySelectorAll('p, span, div');
      textElements.forEach((element, index) => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseFloat(styles.fontSize);
        if (width < 768 && fontSize < 14) {
          issues.push(`Text element ${index + 1} may be too small to read on mobile`);
        }
      });
      
      // Test 5: Check for fixed positioning issues
      const fixedElements = document.querySelectorAll('[style*="position: fixed"], .fixed');
      if (fixedElements.length > 0 && width < 768) {
        issues.push('Fixed positioned elements may cause issues on mobile');
      }
      
      return {
        viewport,
        width,
        height,
        passed: issues.length === 0,
        issues
      };
      
    } catch (error) {
      issues.push(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        viewport,
        width,
        height,
        passed: false,
        issues
      };
    }
  }

  /**
   * Test current viewport responsiveness
   */
  static async testCurrentViewport(): Promise<ResponsivenessTestResult> {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    let viewport = 'desktop';
    if (width < 768) viewport = 'mobile';
    else if (width < 1024) viewport = 'tablet';
    
    return await this.testViewport(viewport, width, height);
  }

  /**
   * Get responsive design recommendations
   */
  static getResponsiveRecommendations(): string[] {
    const recommendations = [
      'Use CSS Grid or Flexbox for responsive layouts',
      'Implement mobile-first design approach',
      'Ensure touch targets are at least 44px × 44px',
      'Use relative units (rem, em, %) instead of fixed pixels',
      'Test on actual devices, not just browser dev tools',
      'Optimize images for different screen densities',
      'Consider performance on slower mobile networks',
      'Implement proper viewport meta tag',
      'Use CSS media queries for breakpoint-specific styles',
      'Ensure text remains readable without zooming'
    ];
    
    return recommendations;
  }
}

/**
 * Quick responsive design check
 */
export function quickResponsivenessCheck(): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  orientation: 'portrait' | 'landscape';
} {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    orientation: height > width ? 'portrait' : 'landscape'
  };
}