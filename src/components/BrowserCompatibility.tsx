'use client';

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, ExternalLink, Smartphone, Globe } from 'lucide-react';
import { detectBrowser, getBrowserWarningMessage, shouldShowBrowserWarning, BrowserInfo } from '@/lib/utils/browserDetection';

// Telegram WebApp API types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        openLink?: (url: string) => void;
      };
    };
  }
}

interface BrowserCompatibilityProps {
  showWarning?: boolean;
  onDismiss?: () => void;
}

export function BrowserCompatibility({ showWarning = true, onDismiss }: BrowserCompatibilityProps) {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only run browser detection on client side
    if (typeof window !== 'undefined') {
      try {
        const detected = detectBrowser();
        setBrowserInfo(detected);
        
        // Show warning if it's an in-app browser with limited support
        if (showWarning && shouldShowBrowserWarning(detected)) {
          setIsVisible(true);
        }
      } catch (error) {
        console.warn('Browser detection failed:', error);
        // If detection fails, assume it's a problematic browser
        setIsVisible(true);
      }
    }
  }, [showWarning]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onDismiss?.();
    
    // Store dismissal in session storage to avoid showing again
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('browser-warning-dismissed', 'true');
      }
    } catch (error) {
      console.warn('Failed to store dismissal state:', error);
    }
  };

  const handleOpenInSafari = () => {
    // For Telegram and other in-app browsers, try to open in Safari
    if (browserInfo?.isTelegram) {
      // Telegram specific: try to open in external browser
      try {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(window.location.href);
        } else {
          // Fallback: show instructions
          alert('To open in Safari:\n1. Tap the menu button (⋮)\n2. Select "Open in Safari"\n3. Or copy the link and paste in Safari');
        }
      } catch (error) {
        console.warn('Failed to open in Safari:', error);
        alert('Please manually open this page in Safari for the best experience.');
      }
    } else {
      // Generic instruction for other in-app browsers
      alert('Please open this page in Safari or Chrome for the best experience.');
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied! Please paste it in Safari or Chrome.');
    } catch (error) {
      console.warn('Failed to copy link:', error);
      // Fallback: select the URL
      const urlInput = document.createElement('input');
      urlInput.value = window.location.href;
      document.body.appendChild(urlInput);
      urlInput.select();
      document.execCommand('copy');
      document.body.removeChild(urlInput);
      alert('Link copied! Please paste it in Safari or Chrome.');
    }
  };

  // Don't show if dismissed or not visible
  if (!isVisible || isDismissed) {
    return null;
  }

  // Check if already dismissed in this session
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('browser-warning-dismissed')) {
      return null;
    }
  } catch (error) {
    console.warn('Failed to check dismissal state:', error);
  }

  const warningMessage = browserInfo ? getBrowserWarningMessage(browserInfo) : 
    'Your current browser may not support all features. For the best experience, please use Safari or Chrome.';

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <Smartphone className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">
        Browser Compatibility Notice
      </AlertTitle>
      <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
        {warningMessage}
      </AlertDescription>
      
      <div className="mt-3 flex flex-wrap gap-2">
        {browserInfo?.isTelegram && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenInSafari}
            className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-900"
          >
            <Globe className="h-4 w-4 mr-2" />
            Open in Safari
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyLink}
          className="text-orange-700 border-orange-300 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-600 dark:hover:bg-orange-900"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Copy Link
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-orange-600 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900"
        >
          <X className="h-4 w-4 mr-2" />
          Dismiss
        </Button>
      </div>
      
      <div className="mt-3 text-xs text-orange-600 dark:text-orange-400">
        <strong>Why this matters:</strong> In-app browsers may have limited JavaScript support, 
        which can cause errors during quizzes. Opening in Safari or Chrome ensures the best experience.
      </div>
    </Alert>
  );
}

// Simplified version for quiz pages
export function QuizBrowserWarning() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const detected = detectBrowser();
        setBrowserInfo(detected);
        
        // Show warning for problematic in-app browsers
        if (shouldShowBrowserWarning(detected)) {
          setShowWarning(true);
        }
      } catch (error) {
        console.warn('Browser detection failed:', error);
        setShowWarning(true);
      }
    }
  }, []);

  if (!showWarning || !browserInfo) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <Smartphone className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200">
          ⚠️ Browser Compatibility Issue
        </AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-300 mt-2">
          Your current browser may cause errors during the quiz. 
          {browserInfo.isTelegram && ' Tap the Safari icon to open in Safari for the best experience.'}
        </AlertDescription>
        
        <div className="mt-3 flex gap-2">
          {browserInfo.isTelegram && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
                    window.Telegram.WebApp.openLink(window.location.href);
                  } else {
                    alert('Tap the Safari icon (🌐) in the top right to open in Safari');
                  }
                } catch (error) {
                  alert('Tap the Safari icon (🌐) in the top right to open in Safari');
                }
              }}
              className="text-red-700 border-red-300 hover:bg-red-100 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900"
            >
              Open in Safari
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowWarning(false)}
            className="text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
          >
            Continue Anyway
          </Button>
        </div>
      </Alert>
    </div>
  );
}
