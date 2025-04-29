document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Get form elements
  const siteUrlInput = document.getElementById('site-url');
  const allowSubdomainsCheckbox = document.getElementById('allow-subdomains');
  const allowAllPagesCheckbox = document.getElementById('allow-all-pages');
  const patternPreview = document.getElementById('pattern-preview');
  
  // Check if there's a hash in the URL and activate that tab
  const hash = window.location.hash.substring(1);
  if (hash) {
    const tabToActivate = document.querySelector(`.tab[data-tab="${hash}"]`);
    if (tabToActivate) {
      activateTab(tabToActivate);
    }
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      activateTab(this);
      
      // Update URL hash without scrolling
      const tabId = this.getAttribute('data-tab');
      history.replaceState(null, null, `#${tabId}`);
    });
  });
  
  function activateTab(clickedTab) {
    // Deactivate all tabs
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Activate clicked tab
    clickedTab.classList.add('active');
    const tabId = clickedTab.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  }
  
  // Add event listeners for real-time pattern preview
  siteUrlInput.addEventListener('input', updatePatternPreview);
  allowSubdomainsCheckbox.addEventListener('change', updatePatternPreview);
  allowAllPagesCheckbox.addEventListener('change', updatePatternPreview);
  
  // Initial pattern preview update
  updatePatternPreview();
  
  // Function to update the pattern preview
  function updatePatternPreview() {
    const siteUrl = siteUrlInput.value.trim();
    const allowSubdomains = allowSubdomainsCheckbox.checked;
    const allowAllPages = allowAllPagesCheckbox.checked;
    
    if (!siteUrl || !siteUrl.includes('.')) {
      patternPreview.textContent = 'https://*.example.com/*';
      return;
    }
    
    const pattern = generateSitePattern(siteUrl, allowSubdomains, allowAllPages);
    patternPreview.textContent = pattern || 'https://*.example.com/*';
  }
  
  // Load and display custom sites
  loadCustomSites();
  
  // Load and display default sites
  loadDefaultSites();
  
  // Add site form submission
  const addSiteForm = document.getElementById('add-site-form');
  addSiteForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const siteUrl = siteUrlInput.value.trim();
    const allowSubdomains = allowSubdomainsCheckbox.checked;
    const allowAllPages = allowAllPagesCheckbox.checked;
    
    // Basic validation
    if (!siteUrl) {
      alert('Please enter a URL.');
      return;
    }
    
    if (!siteUrl.includes('.')) {
      alert('Please enter a valid domain with an extension (e.g., quackforce.com).');
      return;
    }
    
    // Generate the pattern based on user selections
    const pattern = generateSitePattern(siteUrl, allowSubdomains, allowAllPages);
    
    if (pattern) {
      addCustomSite(pattern);
      addSiteForm.reset();
      
      // Reset checkboxes to checked state
      allowSubdomainsCheckbox.checked = true;
      allowAllPagesCheckbox.checked = true;
      
      // Update pattern preview
      updatePatternPreview();
    } else {
      alert('Could not generate a valid pattern. Please check your URL format and try again.');
    }
  });
  
  // Add example site button
  document.getElementById('add-example-site').addEventListener('click', function() {
    addCustomSite('https://*.example.com/*');
    loadCustomSites();
  });
});

// Generate site pattern from URL and checkbox selections
function generateSitePattern(url, allowSubdomains, allowAllPages) {
  try {
    // Clean the URL
    url = url.trim();
    
    // Basic validation - must have at least one dot to be a valid domain
    if (!url.includes('.')) {
      console.error('Invalid URL: No domain extension found');
      return null;
    }
    
    // Remove any protocol if it exists
    if (url.includes('://')) {
      url = url.split('://')[1];
    }
    
    // Remove any trailing slash
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    
    // Split into domain and path parts
    let domainPart = url;
    let pathPart = '';
    
    if (url.includes('/')) {
      const parts = url.split('/', 1);
      domainPart = parts[0];
      pathPart = '/' + url.substring(domainPart.length + 1);
    }
    
    // Parse the domain
    let domain = domainPart;
    
    // Apply subdomain wildcard if needed
    if (allowSubdomains) {
      const domainParts = domain.split('.');
      if (domainParts.length > 2 && domainParts[0] !== 'www') {
        // Replace existing subdomain with wildcard
        domainParts.shift();
        domain = '*.' + domainParts.join('.');
      } else if (domainParts.length > 2 && domainParts[0] === 'www') {
        // For www, just use the base domain with wildcard
        domainParts.shift();
        domain = '*.' + domainParts.join('.');
      } else {
        // Add wildcard subdomain
        domain = '*.' + domain;
      }
    }
    
    // Create the pattern
    let pattern = 'https://' + domain;
    
    // Add path wildcard if needed
    if (allowAllPages) {
      pattern += '/*';
    } else if (pathPart && pathPart !== '/') {
      // Use the specific path from the URL
      pattern += pathPart;
    }
    
    // Log the pattern creation for debugging
    console.log(`Generated pattern: ${pattern} from URL: ${url}`);
    
    return pattern;
  } catch (error) {
    console.error('Error generating site pattern:', error);
    return null;
  }
}

// Load custom sites from storage and display them
function loadCustomSites() {
  chrome.storage.sync.get('customSites', function(result) {
    const customSites = result.customSites || [];
    const sitesList = document.getElementById('sites-list');
    
    if (customSites.length === 0) {
      sitesList.innerHTML = `
        <div class="empty-state">
          <p>You haven't added any custom sites yet.</p>
          <button class="button secondary" id="add-example-site">Add Example Site</button>
        </div>
      `;
      document.getElementById('add-example-site').addEventListener('click', function() {
        addCustomSite('https://*.example.com/*');
        loadCustomSites();
      });
    } else {
      sitesList.innerHTML = '';
      
      customSites.forEach((site, index) => {
        const siteItem = document.createElement('div');
        siteItem.className = 'site-item';
        
        const formattedDate = new Date(site.added).toLocaleDateString();
        
        siteItem.innerHTML = `
          <div class="site-url">${site.pattern}</div>
          <div class="site-date">Added: ${formattedDate}</div>
          <div class="site-actions">
            <button class="btn-icon delete-site" data-index="${index}" title="Delete site">Delete</button>
          </div>
        `;
        sitesList.appendChild(siteItem);
      });
      
      // Add event listeners to delete buttons
      document.querySelectorAll('.delete-site').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          removeCustomSite(index);
        });
      });
    }
  });
}

// Load default sites from storage and display them
function loadDefaultSites() {
  chrome.storage.sync.get('defaultSites', function(result) {
    const defaultSites = result.defaultSites || [];
    const defaultSitesList = document.getElementById('default-sites-list');
    
    if (defaultSites.length === 0) {
      defaultSitesList.innerHTML = `
        <div class="empty-state">
          <p>No default sites available. Please reinstall the extension.</p>
        </div>
      `;
    } else {
      defaultSitesList.innerHTML = '';
      
      defaultSites.forEach((site, index) => {
        const siteItem = document.createElement('div');
        siteItem.className = 'default-site-item';
        
        siteItem.innerHTML = `
          <div class="default-site-toggle">
            <label class="toggle-switch">
              <input type="checkbox" class="site-toggle" data-pattern="${site.pattern}" ${site.enabled !== false ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          <div class="default-site-info">
            <div class="default-site-name">${site.name}</div>
            <div class="default-site-pattern">${site.pattern}</div>
          </div>
        `;
        defaultSitesList.appendChild(siteItem);
      });
      
      // Add event listeners to toggle switches
      document.querySelectorAll('.site-toggle').forEach(toggle => {
        toggle.addEventListener('change', function() {
          const pattern = this.getAttribute('data-pattern');
          const enabled = this.checked;
          toggleDefaultSite(pattern, enabled);
        });
      });
    }
  });
}

// Toggle a default site's enabled status
function toggleDefaultSite(pattern, enabled) {
  chrome.runtime.sendMessage({
    action: 'toggleDefaultSite',
    pattern: pattern,
    enabled: enabled
  }, function(response) {
    if (response && response.success) {
      console.log(`Successfully ${enabled ? 'enabled' : 'disabled'} site: ${pattern}`);
    } else {
      console.error('Failed to update site status');
      // Revert the toggle if it failed
      loadDefaultSites();
    }
  });
}

// Add a new custom site
function addCustomSite(pattern) {
  chrome.storage.sync.get('customSites', function(result) {
    const customSites = result.customSites || [];
    
    // Check if pattern already exists
    if (customSites.some(site => site.pattern === pattern)) {
      alert('This site pattern already exists!');
      return;
    }
    
    customSites.push({
      pattern: pattern,
      added: new Date().toISOString()
    });
    
    chrome.storage.sync.set({ customSites: customSites }, function() {
      loadCustomSites();
    });
  });
}

// Remove a custom site
function removeCustomSite(index) {
  chrome.storage.sync.get('customSites', function(result) {
    const customSites = result.customSites || [];
    
    if (index >= 0 && index < customSites.length) {
      const siteToRemove = customSites[index];
      
      if (confirm(`Are you sure you want to remove ${siteToRemove.pattern}?`)) {
        customSites.splice(index, 1);
        
        chrome.storage.sync.set({ customSites: customSites }, function() {
          loadCustomSites();
        });
      }
    }
  });
} 