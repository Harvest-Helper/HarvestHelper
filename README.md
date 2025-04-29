# HarvestHelper

HarvestHelper is your personal time tracking assistant for Harvest, designed to make time tracking effortless and more efficient. This browser extension streamlines your daily time management workflow by providing quick access to Harvest's time tracking features right from your browser, eliminating the need to constantly switch between tabs or applications.

Whether you're a freelancer, project manager, or part of a team using Harvest, HarvestHelper simplifies the process of logging time, managing projects, and maintaining accurate time records. With features like quick entry, smart suggestions, and customizable shortcuts, you can focus more on your work and less on time management.

![HarvestHelper Icon](icon_128x128.png)

## Features

- **Quick Time Entry**: Log time entries with just a few clicks directly from your browser
- **Smart Integration**: Seamless integration with Harvest's time tracking system
- **Project Management**: Easy access to your Harvest projects and tasks
- **Background Syncing**: Efficient synchronization with Harvest in the background
- **Customizable Settings**: Personalize shortcuts and preferences to match your workflow
- **Context Menu Support**: Right-click to quickly start timing for different tasks
- **Cross-browser Support**: Works on both Chrome and Firefox browsers
- **Offline Capability**: Queue time entries when offline and sync when connected

## Installation

### From Source
1. Clone this repository
   ```bash
   git clone https://github.com/FelixMichaels/HarvestHelper.git
   ```
2. Open Chrome/Firefox and navigate to the extensions page
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
3. Enable Developer Mode
4. Click "Load unpacked extension"
5. Select the directory containing this extension

### Requirements
- Chrome 88+ or Firefox 86+
- JavaScript enabled
- Permissions for accessing tabs and storage

## Usage

1. Click the HarvestHelper icon in your browser toolbar
2. Use the popup interface to manage your content
3. Access settings through the options page
4. Customize your experience through the available preferences

## Development

This extension is built using:
- Vanilla JavaScript
- Browser Extension APIs
- HTML/CSS for the user interface

### Project Structure
```
HarvestHelper/
├── manifest.json      # Extension configuration
├── background.js      # Background service worker
├── content.js         # Content scripts
├── options.html       # Settings page
├── options.js        # Settings functionality
└── icons/            # Extension icons
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Changelog

See [Changelog](Changelog) for a list of changes and updates.

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2024 HarvestHelper

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Support

If you encounter any issues or have questions, please:
1. Check the [existing issues](https://github.com/FelixMichaels/HarvestHelper/issues)
2. Create a new issue if your problem isn't already reported
3. Provide as much detail as possible when reporting issues

## Acknowledgments

- Icon design inspired by modern UI principles
- Built with web extension best practices in mind
- Thanks to all contributors who help improve this project 