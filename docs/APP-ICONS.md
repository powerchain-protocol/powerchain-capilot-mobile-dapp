# PowerChain Copilot App Icons

Product version remains **1.0.0**. The icon source is the verified PowerChain icon pack supplied for integration.

## Runtime mapping

| Surface | Integrated asset |
|---|---|
| Expo / default launcher | `assets/icons/app-icon-light-1024.png` |
| iOS light appearance | `assets/icons/app-icon-light-1024.png` |
| iOS dark appearance | `assets/icons/app-icon-dark-1024.png` |
| iOS tinted appearance | `assets/icons/app-icon-tinted-1024.png` |
| Android adaptive foreground | `assets/icons/adaptive-foreground.png` |
| Android adaptive background | `#FFFFFF` |
| Android 13+ monochrome | `assets/icons/monochrome.png` |
| Android notification | `assets/icons/notification-icon.png` |
| Expo web favicon | `assets/icons/favicon.png` |
| Dark-green splash mark | `assets/icons/splash-icon.png` |
| Light-theme header mark | `assets/brand/logo-green.png` |
| Carbon Dark header mark | `assets/brand/logo-white.png` |

## Web / PWA

The verified favicon, Apple touch icon, Windows tile assets and PWA icons are copied under `public/` and `frontend/public/`. `manifest.json` and `site.webmanifest` use the same verified icon artwork with PowerChain Copilot application metadata.

## Native reference resources

The source iOS modern icon set and Android launcher resources are preserved under:

```text
assets/icon-pack/ios/
assets/icon-pack/android/
assets/icon-pack/desktop/
assets/icon-pack/store/
```

Expo configuration is authoritative for generated native projects. These source directories provide traceability and a native fallback for existing bare/native projects.

## Branding rule

Do not redraw, recolor, stretch or crop the supplied icon artwork. App-store and launcher masking is delegated to the operating system and Expo/native icon pipeline.
