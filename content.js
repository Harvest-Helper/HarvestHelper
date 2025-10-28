// Guard against multiple script injections
if (window.harvestHelperInitialized) {
  console.log('Harvest Helper already initialized on this page');
} else {
  window.harvestHelperInitialized = true;
  
  var isVisible = false;
  var overlayWidth = '40px';
  var overlayHeight = '40px';
  var overlayVisibleWidth = '40px';
  var currentIframe = null;
  var isHovered = false;
  var timeoutId;
  let isDragging = false;
  let offset = { x: 0, y: 0 };
  let dragBorder = document.createElement('div');
  let quadrant = 'right'; // Tracks which quadrant the overlay is in

  var overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '60px'; // Adjust as needed
  overlay.style.right = '0';
  overlay.style.width = overlayWidth;
  overlay.style.height = overlayHeight;
  overlay.style.boxSizing = 'border-box';
  overlay.style.backgroundColor = 'transparent';
  overlay.style.border = 'none';
  overlay.style.borderRadius = '8px';
  overlay.style.zIndex = '9999';
  overlay.style.cursor = 'pointer';
  overlay.style.transition = 'right 0.8s ease';
  overlay.style.overflow = 'hidden';

  var button = document.createElement('button');
  button.style.padding = '8px';
  button.style.cursor = 'pointer';
  button.style.border = '1px solid rgba(242, 108, 37, 1)';
  button.style.background = '#fa5d00';
  button.style.outline = 'none';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.width = overlayWidth;
  button.style.height = overlayHeight;
  button.style.boxSizing = 'border-box';
  button.style.justifyContent = 'center';
  button.style.borderRadius = '8px';
  button.style.transition = 'all 0.3s ease';

  // Clear existing button content first
  while (button.firstChild) {
      button.removeChild(button.firstChild);
  }

  // Create new image element
  var image = document.createElement('img');
  image.src = chrome.runtime.getURL('icon.png');
  image.style.width = '24px';
  image.style.height = '24px';
  image.style.margin = '0';
  image.style.display = 'block';
  image.style.opacity = '1';

  // Prevent image dragging
  image.addEventListener('mousedown', (e) => {
      e.preventDefault();
  });

  // Only append the image to the button
  button.appendChild(image);

  overlay.appendChild(button);
  document.body.appendChild(overlay);

  var maxY = window.innerHeight * 0.36; // Lower boundary
  var minY = 10; // Upper boundary

  function showOverlay() {
    isVisible = true;
    overlay.style.right = '0';
  }

  function hideOverlay() {
    if (!isHovered) {
      timeoutId = setTimeout(function() {
        isVisible = false;
        overlay.style.right = `-${parseInt(overlayWidth) - parseInt(overlayVisibleWidth)}px`;
        
        // Adjust opacity for collapsed state
        setTimeout(function() {
          image.style.opacity = '1';
          button.style.opacity = '0.5';
        }, 1000);
      }, 1000);
    }
  }

  overlay.addEventListener('mouseenter', function() {
    isHovered = true;
    showOverlay();
    clearTimeout(timeoutId);
  });

  overlay.addEventListener('mouseleave', function() {
    isHovered = false;
    hideOverlay();
  });

  // Add these styles near the top of your file
  const iframeStyles = `
      .harvest-iframe-container {
          position: fixed;
          bottom: 10px;
          right: 10px;
          width: 400px;
          height: 420px;    /* Slightly increased for better content fit */
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 99999;
          overflow: hidden;
          display: flex;
          flex-direction: column;
      }

      .harvest-iframe-header {
          background: #fa5d00;
          padding: 8px 12px;    /* Reduced padding */
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .harvest-iframe-title {
          font-size: 14px;      /* Slightly smaller font */
          font-weight: 500;
          transition: opacity 0.2s;
      }

      .harvest-iframe-title:hover {
          opacity: 0.8;
      }

      .harvest-iframe-close {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background 0.2s;
      }

      .harvest-iframe-close:hover {
          background: rgba(255,255,255,0.3);
      }

      .harvest-iframe {
          border: none;
          width: 100%;
          flex-grow: 1;
          background: white;
      }
  `;

  // Add the styles to the document
  const iframeStyleSheet = document.createElement("style");
  iframeStyleSheet.textContent = iframeStyles;
  document.head.appendChild(iframeStyleSheet);

  function getUniquePageId(url) {
      // Create a unique ID based on the URL path
      return encodeURIComponent(url.pathname + url.search);
  }

  function updateIframeContent() {
      if (currentIframe && currentIframe.parentElement) {
          const pageTitle = document.title.replace(/\(.*?\)/g, "").trim();
          const pageUrl = new URL(window.location.href);
          const uniqueId = getUniquePageId(pageUrl);
          
          // Update the Harvest platform URL with new page information
          currentIframe.src = `https://platform.harvestapp.com/platform/timer?app_name=Quack Force&permalink=${encodeURIComponent(pageUrl)}&external_item_id=${uniqueId}&external_item_name=${encodeURIComponent(pageTitle)}&closable=false&chromeless=false`;
      }
  }

  // Helper function to check if iframe can be loaded (CSP check)
  async function canLoadIframe() {
      return new Promise((resolve) => {
          const testIframe = document.createElement('iframe');
          testIframe.style.display = 'none';
          testIframe.style.width = '1px';
          testIframe.style.height = '1px';
          testIframe.style.position = 'fixed';
          testIframe.style.left = '-9999px';
          testIframe.style.top = '-9999px';
          
          let resolved = false;
          const timeout = setTimeout(() => {
              if (!resolved) {
                  resolved = true;
                  testIframe.remove();
                  resolve(true); // Assume it works if no error
              }
          }, 500);
          
          testIframe.onerror = () => {
              if (!resolved) {
                  resolved = true;
                  clearTimeout(timeout);
                  testIframe.remove();
                  resolve(false);
              }
          };
          
          testIframe.onload = () => {
              if (!resolved) {
                  resolved = true;
                  clearTimeout(timeout);
                  // Check if iframe actually loaded content or was blocked
                  try {
                      // If we can access iframe.contentDocument, it loaded
                      if (testIframe.contentDocument || testIframe.contentWindow) {
                          testIframe.remove();
                          resolve(true);
                      } else {
                          testIframe.remove();
                          resolve(false);
                      }
                  } catch (e) {
                      // Cross-origin or CSP block
                      testIframe.remove();
                      resolve(false);
                  }
              }
          };
          
          testIframe.src = 'https://platform.harvestapp.com/platform/timer';
          document.body.appendChild(testIframe);
      });
  }

  // Update the iframe creation in your click handler
  button.addEventListener('click', async () => {
      // Only handle click if we're not dragging and it was a short press
      const end = new Date().getTime();
      const duration = end - clickStart.time;
      const totalMovement = Math.abs(event.clientX - clickStart.x) + Math.abs(event.clientY - clickStart.y);
      
      if (!isDragging && duration < 200 && totalMovement < 5) {
          if (currentIframe && currentIframe.parentElement) {
              document.body.removeChild(currentIframe.parentElement);
              currentIframe = null;
          } else {
              const pageTitle = document.title.replace(/\(.*?\)/g, "").trim();
              const pageUrl = new URL(window.location.href);
              const uniqueId = getUniquePageId(pageUrl);
              const timerUrl = `https://platform.harvestapp.com/platform/timer?app_name=Quack Force&permalink=${encodeURIComponent(pageUrl)}&external_item_id=${uniqueId}&external_item_name=${encodeURIComponent(pageTitle)}&closable=false&chromeless=false`;
              
              // Check if iframe can be loaded
              const canLoad = await canLoadIframe();
              
              if (!canLoad) {
                  // If iframe can't be loaded (CSP block), open in new window
                  window.open(timerUrl, 'HarvestTimer', 'width=400,height=600,resizable=yes,scrollbars=yes');
                  return;
              }
              
              // Create container
              const container = document.createElement('div');
              container.className = 'harvest-iframe-container';

              // Create header
              const header = document.createElement('div');
              header.className = 'harvest-iframe-header';

              // Add title with link
              const title = document.createElement('a');
              title.className = 'harvest-iframe-title';
              title.textContent = 'Harvest Helper';
              title.href = '#';
              title.title = 'Open Extension Options';
              title.style.textDecoration = 'none';
              title.style.color = 'white';
              title.style.cursor = 'pointer';
              
              // Link to extension options page instead of website
              title.addEventListener('click', (e) => {
                  e.preventDefault();
                  if (typeof chrome !== 'undefined' && chrome.runtime) {
                      try {
                          // First try the standard way
                          if (typeof chrome.runtime.openOptionsPage === 'function') {
                              chrome.runtime.openOptionsPage();
                          } else {
                              // Fallback to manually opening the options page URL
                              chrome.runtime.sendMessage({ action: 'openOptionsPage' });
                          }
                      } catch (error) {
                          console.log('Error opening options page:', error);
                          // Final fallback - open the default QuackForce website
                          window.open('https://quackforce.com/', '_blank');
                      }
                  } else {
                      // If Chrome API is not available, open the QuackForce website
                      window.open('https://quackforce.com/', '_blank');
                  }
              });
              
              header.appendChild(title);

              // Add close button
              const closeButton = document.createElement('button');
              closeButton.className = 'harvest-iframe-close';
              closeButton.innerHTML = '✕';
              closeButton.title = 'Close Timer';
              closeButton.onclick = () => {
                  document.body.removeChild(container);
                  currentIframe = null;
              };
              header.appendChild(closeButton);

              // Create iframe
              const iframe = document.createElement('iframe');
              iframe.src = timerUrl;
              iframe.className = 'harvest-iframe';

              // Assemble container
              container.appendChild(header);
              container.appendChild(iframe);
              document.body.appendChild(container);
              currentIframe = iframe;
          }
      }
  });

  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#fa5d00';
    button.style.borderColor = '#fa5d00';
    button.style.opacity = '1';
    overlay.style.opacity = '1';
  });

  button.addEventListener('mouseleave', () => {
    if (!isHovered) {
      button.style.backgroundColor = '#fa5d00';
      button.style.borderColor = '#fa5d00';
      button.style.opacity = '0.5';
      setTimeout(() => {
        button.style.backgroundColor = '#fa5d00';
        button.style.borderColor = '#fa5d00';
        button.style.opacity = '1';
      }, 1000);
    }
  });

  let clickStart = 0;
  let isPopupOpen = false;

  button.addEventListener('mousedown', (event) => {
      if (event.button === 0) {
          clickStart = {
              time: new Date().getTime(),
              x: event.clientX,
              y: event.clientY
          };
          isDragging = true;

          const boundingRect = overlay.getBoundingClientRect();
          offset.x = event.clientX - boundingRect.left;
          offset.y = event.clientY - boundingRect.top;
          
          document.addEventListener('mousemove', moveOverlay);
          document.addEventListener('mouseup', stopDragging);
      }
  });

  function moveOverlay(event) {
      if (isDragging) {
          // Show border only when movement detected
          const totalMovement = Math.abs(event.clientX - clickStart.x) + Math.abs(event.clientY - clickStart.y);
          if (totalMovement > 5) {
              dragBorder.style.border = '4px solid #fa5d00';
              dragBorder.style.display = 'block';
          }
          
          // Close iframe while dragging to improve performance
          if (currentIframe && currentIframe.parentElement) {
              document.body.removeChild(currentIframe.parentElement);
              currentIframe = null;
          }
          
          const windowWidth = window.innerWidth;
          const windowHeight = window.innerHeight;
          
          // Add drag sensitivity factor
          const sensitivity = 1.0;
          
          // Calculate new position with sensitivity
          let x = event.clientX - offset.x * sensitivity;
          let y = event.clientY - offset.y * sensitivity;
          
          // Add padding to keep button fully visible
          const padding = 10;
          
          // Add movement threshold to prevent accidental small movements
          const threshold = 3;
          if (Math.abs(event.movementX) > threshold || Math.abs(event.movementY) > threshold) {
              x = Math.max(padding, Math.min(x, windowWidth - overlay.offsetWidth - padding));
              y = Math.max(padding, Math.min(y, windowHeight - overlay.offsetHeight - padding));
              
              overlay.style.left = `${x}px`;
              overlay.style.top = `${y}px`;
              overlay.style.right = 'auto';
          }
      }
  }

  // Function to save button position using message passing
  function saveButtonPosition(top, side) {
      // Send message to background script to save position
      if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
              action: 'saveButtonPosition',
              position: {
                  top: top,
                  side: side,
                  lastUpdated: new Date().getTime()
              }
          });
      }
  }

  // Function to load button position using message passing
  function loadButtonPosition() {
      // Check if chrome runtime is available (not all contexts have it)
      if (typeof chrome !== 'undefined' && chrome.runtime) {
          // Request position data from background script
          chrome.runtime.sendMessage({ action: 'getButtonPosition' }, function(response) {
              if (response && response.position) {
                  const pos = response.position;
                  
                  // Apply saved position
                  overlay.style.transition = 'none'; // Prevent animation on initial load
                  if (pos.side === 'left') {
                      overlay.style.left = '0';
                      overlay.style.right = 'auto';
                  } else {
                      overlay.style.right = '0';
                      overlay.style.left = 'auto';
                  }
                  overlay.style.top = pos.top;
                  
                  // Re-enable transitions after positioning
                  setTimeout(() => {
                      overlay.style.transition = 'all 0.3s ease';
                  }, 100);
              }
          });
      }
  }

  function snapToNearestEdge(x, y) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Define the bottom-right zone (last 60% of height)
      const bottomRightThreshold = windowHeight * 0.4;
      
      // Add padding to prevent snapping too close to edges
      const padding = 10;
      
      // Force snap to top section if in bottom-right area
      if (x > windowWidth / 2 && y > bottomRightThreshold) {
          overlay.style.transition = 'all 0.3s ease';
          overlay.style.right = '0';
          overlay.style.left = 'auto';
          overlay.style.top = `${windowHeight * 0.35}px`; // Snap to 38% from top
          saveButtonPosition(`${windowHeight * 0.35}px`, 'right');
          return;
      }
      
      // Normal snapping behavior for other areas
      if (x < windowWidth / 2) {
          // Left side
          overlay.style.transition = 'all 0.3s ease';
          overlay.style.left = '0';
          overlay.style.right = 'auto';
          const topPos = `${Math.max(padding, Math.min(y, windowHeight - overlay.offsetHeight - padding))}px`;
          overlay.style.top = topPos;
          saveButtonPosition(topPos, 'left');
      } else {
          // Right side (not in bottom-right zone)
          overlay.style.transition = 'all 0.3s ease';
          overlay.style.right = '0';
          overlay.style.left = 'auto';
          const topPos = `${Math.max(padding, Math.min(y, windowHeight - overlay.offsetHeight - padding))}px`;
          overlay.style.top = topPos;
          saveButtonPosition(topPos, 'right');
      }
      
      // Reset transition
      setTimeout(() => {
          overlay.style.transition = '';
      }, 300);
  }

  function stopDragging(event) {
      const end = new Date().getTime();
      const duration = end - clickStart.time;
      const totalMovement = Math.abs(event.clientX - clickStart.x) + Math.abs(event.clientY - clickStart.y);
      
      if (duration > 200 || totalMovement > 5) {
          // It was a drag
          isDragging = false;
          dragBorder.style.display = 'none';
          dragBorder.style.border = 'none';
          
          const finalX = event.clientX - offset.x;
          const finalY = event.clientY - offset.y;
          
          snapToNearestEdge(finalX, finalY);
      } else {
          // It was a click
          isDragging = false;
          dragBorder.style.display = 'none';
          dragBorder.style.border = 'none';
      }
      
      document.removeEventListener('mousemove', moveOverlay);
      document.removeEventListener('mouseup', stopDragging);
  }

  function setupDragBorder() {
      dragBorder.style.position = 'fixed';
      dragBorder.style.top = '0';
      dragBorder.style.left = '0';
      dragBorder.style.width = '100%';
      dragBorder.style.height = '100%';
      dragBorder.style.border = '4px solid #fa5d00';
      dragBorder.style.pointerEvents = 'none';
      dragBorder.style.display = 'none';
      dragBorder.style.zIndex = '9998';
      dragBorder.style.boxSizing = 'border-box';
      // Ensure border shows on all sides
      dragBorder.style.borderStyle = 'solid';
      dragBorder.style.borderWidth = '4px';
      dragBorder.style.borderColor = '#fa5d00';
      // Reset any potential inherited styles
      dragBorder.style.margin = '0';
      dragBorder.style.padding = '0';
      dragBorder.style.minWidth = '100%';
      dragBorder.style.minHeight = '100%';
      dragBorder.style.maxWidth = '100%';
      dragBorder.style.maxHeight = '100%';
      document.body.appendChild(dragBorder);
  }

  // Call setupDragBorder after creating the overlay
  setupDragBorder();

  // Add this style to ensure the border is visible
  const dragBorderStyles = `
      .harvest-drag-border {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 4px solid #fa5d00 !important;
          pointer-events: none !important;
          z-index: 9998 !important;
          box-sizing: border-box !important;
          margin: 0 !important;
          padding: 0 !important;
      }
  `;

  // Add the styles to the document
  const dragStyleSheet = document.createElement("style");
  dragStyleSheet.textContent = dragBorderStyles;
  document.head.appendChild(dragStyleSheet);

  // Add class to dragBorder
  dragBorder.className = 'harvest-drag-border';

  function handleOutsideClick(event) {
      if (currentIframe && currentIframe.parentElement && !button.contains(event.target) && !overlay.contains(event.target)) {
          document.body.removeChild(currentIframe.parentElement);
          currentIframe = null;
      }
  }

  document.addEventListener('click', handleOutsideClick);

  // Load saved position when the overlay is created
  document.addEventListener('DOMContentLoaded', (event) => {
      loadButtonPosition();
  });

  // Also load position immediately in case DOMContentLoaded already fired
  loadButtonPosition();

  // Listen for page changes
  let lastUrl = location.href;
  new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
          lastUrl = url;
          updateIframeContent();
      }
  }).observe(document, { subtree: true, childList: true });

  // Also handle single-page app navigation
  window.addEventListener('popstate', function() {
      updateIframeContent();
  });

  // Handle pushState and replaceState
  const pushState = history.pushState;
  history.pushState = function() {
      pushState.apply(history, arguments);
      updateIframeContent();
  };

  const replaceState = history.replaceState;
  history.replaceState = function() {
      replaceState.apply(history, arguments);
      updateIframeContent();
  };
  
  // Function to remove HarvestHelper elements from the page
  function removeHarvestHelperElements() {
    console.log('Removing HarvestHelper from page');
    
    // Remove iframe if present
    if (currentIframe && currentIframe.parentElement) {
      document.body.removeChild(currentIframe.parentElement);
      currentIframe = null;
    }
    
    // Remove drag border
    if (dragBorder && dragBorder.parentElement) {
      document.body.removeChild(dragBorder);
    }
    
    // Remove overlay/button
    if (overlay && overlay.parentElement) {
      document.body.removeChild(overlay);
    }
    
    // Clean up event listeners
    document.removeEventListener('click', handleOutsideClick);
    window.removeEventListener('popstate', updateIframeContent);
    
    // Reset global flag to allow reinjection if needed
    window.harvestHelperInitialized = false;
  }
  
  // Listen for messages from background script
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'removeHarvestHelper') {
        removeHarvestHelperElements();
        sendResponse({ success: true });
      } else if (message.action === 'isHarvestHelperActive') {
        sendResponse({ active: window.harvestHelperInitialized });
      }
      return true; // Keep message channel open for async response
    });
  }
}