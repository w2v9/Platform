export function getDeviceInfo(): {
    type: string;
    browser: string;
    os: string;
    userAgent: string;
} {
    if (typeof window === 'undefined') {
        return {
            type: 'server',
            browser: 'none',
            os: 'none',
            userAgent: 'none'
        };
    }

    const userAgent = window.navigator.userAgent;

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /(iPad|tablet|Tablet)/i.test(userAgent);
    const type = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop');

    // Detect browser
    let browser = 'unknown';
    if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') > -1) {
        browser = 'Samsung Browser';
    } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
        browser = 'Opera';
    } else if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg') > -1) {
        browser = 'Edge';
    } else if (userAgent.indexOf('Chrome') > -1) {
        browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari';
    } else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) {
        browser = 'Internet Explorer';
    }

    // Detect OS
    let os = 'unknown';
    if (userAgent.indexOf('Windows') > -1) {
        os = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        os = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
        os = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        os = 'Android';
    } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
        os = 'iOS';
    }

    return { type, browser, os, userAgent };
}