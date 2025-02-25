const { ipcMain } = require('electron');
const { productsRepo } = require('../../../models/database');
const csv = require('csv-parse');

function registerProductsHandlers() {
  // Import products from CSV
  ipcMain.handle('products:import-products', async (event, csvData) => {
    try {
      return new Promise((resolve, reject) => {
        const records = [];
        csv
          .parse(csvData, {
            columns: true,
            skip_empty_lines: true,
          })
          .on('data', (data) => {
            records.push(data);
          })
          .on('end', () => {
            resolve(productsRepo.importProducts(records));
          })
          .on('error', reject);
      });
    } catch (error) {
      console.error('Error importing products:', error);
      throw error;
    }
  });

  // Get all products (paginated)
  ipcMain.handle('products:get-products', async (event, params) => {
    try {
      return productsRepo.getProducts(params);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  });

  // Create new product
  ipcMain.handle('products:create-product', async (event, product) => {
    try {
      const result = productsRepo.create(product);
      return result;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  });

  // Update product
  ipcMain.handle('products:update-product', async (event, { id, product }) => {
    try {
      const result = productsRepo.update(id, product);
      return result;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  });

  // Delete product
  ipcMain.handle('products:delete-product', async (event, id) => {
    try {
      const result = productsRepo.delete(id);
      return result;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  });

  // Get product by barcode
  ipcMain.handle('products:get-product-by-barcode', async (event, barcode) => {
    try {
      const product = productsRepo.getByBarcode(barcode);
      return product;
    } catch (error) {
      console.error('Error finding product:', error);
      throw error;
    }
  });

  // Search products
  ipcMain.handle('products:search-products', async (event, query) => {
    try {
      const products = productsRepo.search(query);
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  });
}

module.exports = registerProductsHandlers;
