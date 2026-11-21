/**
 * Libre Launcher & Ecosystem Client Script
 * Handles:
 * 1. Material You tab navigation with instant URL hash synchronization (#overview, #comparison, #ecosystem)
 * 2. GitHub Releases API auto-updating download buttons and runtime variants
 * 3. Animated comparison benchmark storage bars
 * 4. Dropdown toggle interaction and outside-click dismiss
 * 5. Tap-to-expand responsive screenshot lightbox preview
 */

(() => {
  'use strict';

  // Constants & Fallbacks
  const GITHUB_REPO_API = 'https://api.github.com/repos/PolskieWin/libre-launcher/releases/latest';
  const FALLBACK_RELEASE_URL = 'https://github.com/PolskieWin/libre-launcher/releases/latest';
  const FALLBACK_VERSION = 'v3.70';
  const FALLBACK_STRIPPED_SIZE = '31 MB';

  // DOM Elements
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const dropdownToggleBtn = document.getElementById('dropdown-toggle-btn');
  const variantMenu = document.getElementById('variant-menu');
  const primaryDownloadBtn = document.getElementById('primary-download-btn');
  const downloadBtnText = document.getElementById('download-btn-text');
  const variantFull = document.getElementById('variant-full');
  const variantFullSize = document.getElementById('variant-full-size');
  const variantNoruntime = document.getElementById('variant-noruntime');
  const variantNoruntimeSize = document.getElementById('variant-noruntime-size');
  const storageFills = document.querySelectorAll('.storage-fill');

  // Lightbox Elements
  const lightboxModal = document.getElementById('screenshot-lightbox');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const galleryCards = document.querySelectorAll('.gallery-card');

  /**
   * Format bytes into a human-readable MB string.
   * @param {number} bytes 
   * @returns {string} e.g. "20.9 MB"
   */
  function formatMegabytes(bytes) {
    if (!bytes || isNaN(bytes)) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  /**
   * Switch active navigation tab and update URL hash.
   * @param {string} targetTabId - 'overview', 'comparison', or 'ecosystem'
   * @param {boolean} updateHash - whether to modify window.location.hash
   */
  function switchTab(targetTabId, updateHash = true) {
    const validTabs = ['overview', 'comparison', 'ecosystem'];
    const activeTab = validTabs.includes(targetTabId) ? targetTabId : 'overview';

    // Update Tab Buttons
    tabButtons.forEach(btn => {
      const isCurrent = btn.dataset.tab === activeTab;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    // Update Tab Panels
    tabPanels.forEach(panel => {
      const isCurrent = panel.id === `panel-${activeTab}`;
      panel.classList.toggle('active', isCurrent);
    });

    // Animate benchmark bars if switching to comparison
    if (activeTab === 'comparison') {
      animateStorageBars();
    }

    // Sync URL hash without reloading page
    if (updateHash && window.location.hash !== `#${activeTab}`) {
      if (history.pushState) {
        history.pushState(null, '', `#${activeTab}`);
      } else {
        window.location.hash = `#${activeTab}`;
      }
    }
  }

  /**
   * Trigger storage footprint bar animation from 0% to target width.
   */
  function animateStorageBars() {
    storageFills.forEach(fill => {
      const targetWidth = fill.getAttribute('data-width') || '0%';
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => {
          fill.style.width = targetWidth;
        }, 50);
      });
    });
  }

  /**
   * Fetch latest release details from GitHub API.
   * Updates primary download URL, version text, and variant asset links.
   */
  async function fetchLatestRelease() {
    try {
      const response = await fetch(GITHUB_REPO_API, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const releaseData = await response.json();
      const tagName = releaseData.tag_name || FALLBACK_VERSION;
      const assets = Array.isArray(releaseData.assets) ? releaseData.assets : [];

      // Locate key assets
      const strippedAsset = assets.find(a => (a.name.includes('stripped') || a.name === 'LibreLauncher-stripped-release.apk') && a.name.endsWith('.apk'));
      const fullAsset = assets.find(a => (a.name.includes('full') || a.name.includes('release')) && !a.name.includes('stripped') && !a.name.includes('noruntime') && a.name.endsWith('.apk'));
      const noRuntimeAsset = assets.find(a => a.name.includes('noruntime') && a.name.endsWith('.apk'));

      // Update Primary Stripped Button
      if (strippedAsset && strippedAsset.browser_download_url) {
        primaryDownloadBtn.href = strippedAsset.browser_download_url;
        const sizeStr = strippedAsset.size ? formatMegabytes(strippedAsset.size) : FALLBACK_STRIPPED_SIZE;
        downloadBtnText.textContent = `Download ${tagName} • ${sizeStr} Stripped APK`;
      } else {
        primaryDownloadBtn.href = releaseData.html_url || FALLBACK_RELEASE_URL;
        downloadBtnText.textContent = `Download ${tagName} • ${FALLBACK_STRIPPED_SIZE} Stripped APK`;
      }

      // Update Full Release Variant
      if (fullAsset && fullAsset.browser_download_url && variantFull) {
        variantFull.href = fullAsset.browser_download_url;
        if (fullAsset.size && variantFullSize) {
          variantFullSize.textContent = `~${formatMegabytes(fullAsset.size)}`;
        }
      }

      // Update No-Runtime Variant
      if (noRuntimeAsset && noRuntimeAsset.browser_download_url && variantNoruntime) {
        variantNoruntime.href = noRuntimeAsset.browser_download_url;
        if (noRuntimeAsset.size && variantNoruntimeSize) {
          variantNoruntimeSize.textContent = `~${formatMegabytes(noRuntimeAsset.size)}`;
        }
      }

    } catch (err) {
      if (primaryDownloadBtn) {
        primaryDownloadBtn.href = FALLBACK_RELEASE_URL;
      }
      if (downloadBtnText) {
        downloadBtnText.textContent = `Download ${FALLBACK_VERSION} • ${FALLBACK_STRIPPED_SIZE} Stripped APK`;
      }
    }
  }

  /**
   * Open Screenshot Lightbox Modal
   * @param {string} fullUrl 
   * @param {string} title 
   * @param {string} desc 
   */
  function openLightbox(fullUrl, title, desc) {
    if (!lightboxModal || !lightboxImg) return;
    lightboxImg.src = fullUrl;
    lightboxImg.alt = title;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxDesc) lightboxDesc.textContent = desc;

    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close Screenshot Lightbox Modal
   */
  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /**
   * Set up all interactive event listeners.
   */
  function initEventListeners() {
    // Tab Button Clicks
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.dataset.tab;
        if (tab) {
          switchTab(tab, true);
        }
      });
    });

    // Hash change handling (Back/Forward browser buttons)
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        switchTab(hash, false);
      }
    });

    // Split-Pill Dropdown Toggle
    if (dropdownToggleBtn && variantMenu) {
      dropdownToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = variantMenu.classList.contains('show');
        if (isOpen) {
          closeVariantMenu();
        } else {
          openVariantMenu();
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!variantMenu.contains(e.target) && !dropdownToggleBtn.contains(e.target)) {
          closeVariantMenu();
        }
      });
    }

    // Gallery Lightbox Handlers
    galleryCards.forEach(card => {
      card.addEventListener('click', () => {
        const full = card.getAttribute('data-full');
        const title = card.getAttribute('data-title') || 'Libre Launcher';
        const desc = card.getAttribute('data-desc') || '';
        if (full) {
          openLightbox(full, title, desc);
        }
      });
    });

    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }

    if (lightboxBackdrop) {
      lightboxBackdrop.addEventListener('click', closeLightbox);
    }

    // Keyboard Shortcuts (Escape to dismiss dropdown & lightbox)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (lightboxModal && lightboxModal.classList.contains('active')) {
          closeLightbox();
        } else if (variantMenu && variantMenu.classList.contains('show')) {
          closeVariantMenu();
        }
      }
    });
  }

  function openVariantMenu() {
    if (!variantMenu || !dropdownToggleBtn) return;
    variantMenu.classList.add('show');
    dropdownToggleBtn.setAttribute('aria-expanded', 'true');
  }

  function closeVariantMenu() {
    if (!variantMenu || !dropdownToggleBtn) return;
    variantMenu.classList.remove('show');
    dropdownToggleBtn.setAttribute('aria-expanded', 'false');
  }

  /**
   * Initialize application on DOM ready.
   */
  function init() {
    initEventListeners();

    // Determine initial tab from URL hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['overview', 'comparison', 'ecosystem'].includes(initialHash)) {
      switchTab(initialHash, false);
    } else {
      switchTab('overview', false);
    }

    // Auto-fetch latest GitHub release
    fetchLatestRelease();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
