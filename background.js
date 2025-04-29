// Define default sites that are supported
const DEFAULT_SITES = [
  {
    pattern: "https://www.notion.so/*",
    name: "Notion",
    default: true
  },
  {
    pattern: "https://docs.google.com/*",
    name: "Google Docs",
    default: true
  },
  {
    pattern: "https://*.spiceworks.com/*",
    name: "Spiceworks",
    default: true
  },
  {
    pattern: "https://*.freshservice.com/*",
    name: "Freshservice",
    default: true
  },
  {
    pattern: "https://*.agiloft.com/*",
    name: "Agiloft",
    default: true
  },
  {
    pattern: "https://meet.google.com/*",
    name: "Google Meet",
    default: true
  },
  {
    pattern: "https://*.atlassian.net/*",
    name: "Atlassian (Jira/Confluence)",
    default: true
  },
  {
    pattern: "https://app.hubspot.com/*",
    name: "HubSpot",
    default: true
  },
  {
    pattern: "https://app.bonboard.com/*",
    name: "Bonboard",
    default: true
  },
  {
    pattern: "https://app.drata.com/*",
    name: "Drata",
    default: true
  },
  {
    pattern: "https://probe.jonesit.net/*",
    name: "Jones IT Probe",
    default: true
  },
  {
    pattern: "https://dashboard.tryrisotto.com/tickets/*",
    name: "Risotto",
    default: true
  }
];

// Add click handler for extension icon
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// Handle custom site injection
chrome.runtime.onInstalled.addListener((details) => {
  // Initialize storage with empty custom sites array if not present
  chrome.storage.sync.get(['customSites', 'defaultSites'], (result) => {
    // Initialize custom sites if not present
    if (!result.customSites) {
      chrome.storage.sync.set({ customSites: [] });
    }
    
    // Initialize default sites if not present or update them
    if (!result.defaultSites) {
      chrome.storage.sync.set({ 
        defaultSites: DEFAULT_SITES.map(site => ({
          ...site,
          enabled: true,
          added: new Date().toISOString()
        }))
      });
    }
  });
  
  // Open options page when extension is newly installed
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
  
  // Create context menu item (only on install/update to prevent duplicates)
  // First, remove existing items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'open_options',
      title: 'Harvest Helper Options',
      contexts: ['action']
    });
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.action === 'saveButtonPosition') {
    // Save the button position to storage
    chrome.storage.sync.set({
      'harvestButtonPosition': message.position
    });
    // Return success response
    sendResponse({ success: true });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'getButtonPosition') {
    // Get the button position from storage
    chrome.storage.sync.get('harvestButtonPosition', (result) => {
      sendResponse({ 
        success: true,
        position: result.harvestButtonPosition || null
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'toggleDefaultSite') {
    chrome.storage.sync.get('defaultSites', (result) => {
      const defaultSites = result.defaultSites || [];
      const updatedSites = defaultSites.map(site => {
        if (site.pattern === message.pattern) {
          return { ...site, enabled: message.enabled };
        }
        return site;
      });
      
      chrome.storage.sync.set({ defaultSites: updatedSites }, () => {
        // If site was disabled, send message to all tabs matching the pattern to remove Harvest Helper
        if (!message.enabled) {
          removeHarvestHelperFromMatchingTabs(message.pattern);
        } else {
          // If site was enabled, inject content script into matching tabs
          injectHarvestHelperIntoMatchingTabs(message.pattern);
        }
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle request to open options page from content script
  if (message.action === 'openOptionsPage') {
    try {
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('Error opening options page:', error);
      // Fallback for older Chrome versions
      chrome.tabs.create({ url: 'options.html' });
    }
    sendResponse({ success: true });
    return true;
  }
});

// Function to remove Harvest Helper from tabs matching a pattern
function removeHarvestHelperFromMatchingTabs(pattern) {
  // Query all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && matchesPattern(tab.url, pattern)) {
        console.log(`Removing Harvest Helper from tab: ${tab.url}`);
        // Send a message to the content script to remove itself
        chrome.tabs.sendMessage(tab.id, { action: 'removeHarvestHelper' })
          .catch(error => {
            // Suppress errors if content script not injected or not responding
            console.log(`No content script running in tab ${tab.id} or error:`, error);
          });
      }
    });
  });
}

// Function to inject Harvest Helper into tabs matching a pattern
function injectHarvestHelperIntoMatchingTabs(pattern) {
  // Query all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && matchesPattern(tab.url, pattern)) {
        console.log(`Injecting Harvest Helper into tab: ${tab.url}`);
        // Check if content script is already running by sending a test message
        chrome.tabs.sendMessage(tab.id, { action: 'isHarvestHelperActive' })
          .then(response => {
            if (response && response.active) {
              console.log(`Harvest Helper already active in tab ${tab.id}`);
            } else {
              // Inject the content script if it's not already running
              injectContentScript(tab.id);
            }
          })
          .catch(() => {
            // Content script not running, inject it
            injectContentScript(tab.id);
          });
      }
    });
  });
}

// Helper function to inject content script
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).then(() => {
    console.log(`Content script successfully injected into tab ${tabId}`);
  }).catch(error => {
    console.error(`Content script injection failed for tab ${tabId}:`, error);
  });
}

// Main function to check if a site should have Harvest Helper on it
async function shouldInjectHarvestHelper(url) {
  try {
    // Get both custom sites and enabled default sites from storage
    const result = await chrome.storage.sync.get(['customSites', 'defaultSites']);
    const customSites = result.customSites || [];
    const defaultSites = (result.defaultSites || []).filter(site => site.enabled !== false);
    
    // Combine both types of sites for matching
    const allSites = [...customSites, ...defaultSites];
    
    // Check if URL matches any site pattern
    return allSites.some(site => matchesPattern(url, site.pattern));
  } catch (error) {
    console.error('Error checking if Harvest Helper should be injected:', error);
    return false;
  }
}

// Listen for tab updates to inject content script into custom sites
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`Tab updated: ${tab.url}`);
    
    // Skip non-http URLs
    if (!tab.url.startsWith('http')) {
      return;
    }
    
    // Check if we should inject the script
    shouldInjectHarvestHelper(tab.url)
      .then(shouldInject => {
        if (shouldInject) {
          console.log(`Should inject Harvest Helper into ${tab.url}`);
          
          // Check if already running
          chrome.tabs.sendMessage(tabId, { action: 'isHarvestHelperActive' })
            .then(response => {
              if (response && response.active) {
                console.log(`Harvest Helper already active in tab ${tabId}`);
              } else {
                injectContentScript(tabId);
              }
            })
            .catch(() => {
              // Not running, inject it
              injectContentScript(tabId);
            });
        } else {
          console.log(`Should NOT inject Harvest Helper into ${tab.url}`);
        }
      })
      .catch(error => {
        console.error(`Error checking if should inject: ${error}`);
      });
  }
});

// Process custom sites for matching and injection
function processCustomSites(tabId, url, sites) {
  // Check if the current URL matches any site pattern
  const matchedSite = sites.find(site => matchesPattern(url, site.pattern));
  
  if (matchedSite) {
    console.log(`Match found for ${url}. Injecting content script...`);
    // Inject the content script if it matches
    injectContentScript(tabId);
  } else {
    console.log(`No matching pattern found for ${url}`);
  }
}

// Helper function to match URL against a pattern
// Supports asterisk wildcard notation like the manifest matches patterns
function matchesPattern(url, pattern) {
  try {
    console.log(`Matching URL: ${url} against pattern: ${pattern}`);
    
    // Standardize the pattern - make sure it starts with http:// or https://
    if (!pattern.startsWith('http://') && !pattern.startsWith('https://')) {
      pattern = 'https://' + pattern;
    }
    
    // First, replace specific parts of URL patterns to keep the wildcard intent
    pattern = pattern
      // Replace domain wildcards (*.example.com)
      .replace(/\*\./g, '__DOMAIN_WILDCARD__')
      // Replace path wildcards (example.com/*)
      .replace(/\/\*/g, '__PATH_WILDCARD__');
    
    // Now escape all special regex characters
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Restore the wildcards with their regex equivalents
    pattern = pattern
      .replace(/__DOMAIN_WILDCARD__/g, '(?:[^/]+\\.)?')
      .replace(/__PATH_WILDCARD__/g, '(?:/.*)?');
    
    // Create the regex with proper start/end markers
    const regex = new RegExp('^' + pattern + '$');
    const matches = regex.test(url);
    
    console.log(`Pattern converted to regex: ${regex}`);
    console.log(`Match result: ${matches}`);
    
    return matches;
  } catch (error) {
    console.error('Invalid pattern:', pattern, error);
    return false;
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'open_options') {
    chrome.runtime.openOptionsPage();
  }
}); 