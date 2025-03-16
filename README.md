# Electron Cash Register

A modern, desktop point-of-sale application built with Electron and React. This application provides a complete solution for small retail businesses to manage sales, products, and generate receipts.

## Features

- **Point of Sale Interface**: Simple and intuitive interface for processing sales
- **Product Management**: Add, edit, and archive products with barcode support
- **Barcode Scanning**: Fast product lookup with barcode scanner support
- **Discounts**: Create and apply percentage and fixed amount discounts
- **Receipt Printing**: Print receipts directly to thermal printers
- **Email Receipts**: Send digital receipts to customers via email
- **Sales History**: View and search past sales and returns
- **Hold & Recall**: Put sales on hold and recall them later
- **Returns Processing**: Process customer returns easily
- **Offline-First**: Works without internet connection
- **Customizable Settings**: Configure tax rates, company information, and more

## Installation

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Electron 24.x

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/electron-cash-register.git
   cd electron-cash-register
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the application (dev):
   ```
   npm electron-dev
   ```

## Usage

### POS Mode

The main interface allows you to:

- Search for products by name or scan barcodes
- Add items to the cart
- Apply discounts
- Process payments
- Print or email receipts

### Product Management

Manage your inventory by:

- Adding new products with names, prices, and barcodes
- Updating existing product details
- Archiving discontinued products
- Importing/exporting product data

### Discounts

Create various types of discounts:

- Percentage-based discounts
- Fixed amount discounts
- Quick-access discount barcodes
- Hidden discounts (not visible in POS interface)

### Settings

Configure your POS system:

- Company information (name, address, VAT number)
- Receipt customization (thank you message, logo)
- Printer selection
- Tax rates
- Email settings for digital receipts
- Interface options (like barcode sound effects)

## Limitations

- Can only run on Electron 24 for now.
- On higher versions, silent printing on Windows does not work.

## Database

The application uses SQLite for local data storage. Database migrations handle schema updates automatically when the application starts.

## Development

### Project Structure

- `/src` - React frontend code
- `/models` - Database models
- `/migrations` - Database migration scripts
- `/services` - Business logic services
- `/electron` - Electron main process code

### Building for Production

```
npm run release
```

This will create distributables for your platform in the `/dist` directory.

## License

[MIT License](LICENSE)

## Support

For issues and feature requests, please file an issue on the GitHub repository.
