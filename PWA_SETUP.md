# PWA Setup Guide - Fixing Installability Issues

## ✅ What We've Added

Your onboarding app now has all the necessary components for PWA installability:

### 1. Web App Manifest (`/public/manifest.json`)
- ✅ App name and description
- ✅ Icons in multiple sizes (192x192, 512x512)
- ✅ Display mode set to "standalone"
- ✅ Theme colors and background colors
- ✅ Start URL and scope
- ✅ App shortcuts for quick access

### 2. Service Worker (`/public/sw.js`)
- ✅ Basic caching strategy
- ✅ Offline functionality
- ✅ Background sync support
- ✅ Push notification support

### 3. PWA Installer Component (`/components/pwa-installer.tsx`)
- ✅ Service worker registration
- ✅ Install prompt handling
- ✅ User-friendly install button

### 4. Updated Layout (`/app/layout.tsx`)
- ✅ Manifest link in metadata
- ✅ PWA-specific meta tags
- ✅ Apple Web App support
- ✅ Theme color configuration

## 🔧 Next Steps to Complete Setup

### 1. Generate Proper Icon Sizes

You need to create properly sized icons from your existing logo:

```bash
# Install sharp for image processing
npm install sharp --save-dev

# Run the icon generation script
node scripts/generate-icons.js
```

**Alternative (Manual):**
If you prefer to create icons manually:
- Create `icon-192.png` (192x192 pixels)
- Create `icon-512.png` (512x512 pixels)
- Save them in the `/public` directory

### 2. Test PWA Installability

1. **Open Chrome DevTools** (F12)
2. Go to **Application** tab
3. Click **Manifest** in the sidebar
4. Check for any errors or warnings
5. Use **Lighthouse** audit to test PWA score

### 3. Test Installation

1. **Desktop:** Look for install icon in address bar
2. **Mobile:** Use "Add to Home Screen" option
3. **Manual trigger:** The install button should appear automatically

## 🚀 Features Included

### Offline Support
- Basic caching for key pages
- Offline fallback functionality
- Service worker handles network requests

### Installation Prompts
- Automatic install button when criteria are met
- Custom install UI with Swedish text
- Handles installation events

### App Shortcuts
- Quick access to checklist page
- Customizable shortcuts in manifest

### Push Notifications (Ready)
- Service worker configured for push notifications
- Notification click handling included

## 🔍 Troubleshooting

### Common Issues:

1. **"Page has no manifest <link> URL"**
   - ✅ Fixed: Added manifest link to layout.tsx

2. **Icons not loading**
   - Run the icon generation script
   - Ensure icon files exist in `/public` directory

3. **Service worker not registering**
   - Check browser console for errors
   - Ensure HTTPS in production

4. **Install button not appearing**
   - PWA criteria must be met (HTTPS, manifest, service worker)
   - Some browsers have different requirements

### Testing Checklist:

- [ ] Manifest loads without errors
- [ ] Service worker registers successfully
- [ ] Icons display correctly in DevTools
- [ ] Install prompt appears (may take time)
- [ ] App works offline (basic functionality)

## 📱 Browser Support

- ✅ Chrome/Chromium (full support)
- ✅ Edge (full support)
- ✅ Firefox (partial support)
- ✅ Safari (basic support)

## 🎨 Customization

### Update App Colors
Edit `/public/manifest.json`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-color"
}
```

### Add More Shortcuts
Edit the `shortcuts` array in manifest.json

### Modify Caching Strategy
Edit `/public/sw.js` to customize what gets cached

## 🔒 Security Notes

- Service worker only works over HTTPS in production
- Manifest must be served from same origin
- Icons should be optimized for performance

## 📊 Performance Tips

- Use WebP format for icons when possible
- Implement proper caching headers
- Consider lazy loading for non-critical resources

Your app should now pass PWA installability requirements! 🎉