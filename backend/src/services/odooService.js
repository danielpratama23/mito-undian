/**
 * odooService.js
 * Integrasi ke Odoo 18 via XML-RPC untuk validasi IMEI / Serial Number
 * Odoo 18 menggunakan endpoint: /xmlrpc/2/common dan /xmlrpc/2/object
 */

const xmlrpc = require('xmlrpc');

const ODOO_URL = process.env.ODOO_URL;
const ODOO_DB = process.env.ODOO_DB;
const ODOO_USER = process.env.ODOO_USERNAME;
const ODOO_PASS = process.env.ODOO_PASSWORD;

// Parse host & port dari URL
function parseOdooUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || (parsed.protocol === 'https:' ? 443 : 8069),
    isHttps: parsed.protocol === 'https:',
  };
}

function createClient(path) {
  const { host, port, isHttps } = parseOdooUrl(ODOO_URL);
  const clientFn = isHttps ? xmlrpc.createSecureClient : xmlrpc.createClient;
  return clientFn({ host, port, path });
}

function callXmlRpc(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// Autentikasi ke Odoo, return uid
async function authenticate() {
  const client = createClient('/xmlrpc/2/common');
  const uid = await callXmlRpc(client, 'authenticate', [
    ODOO_DB, ODOO_USER, ODOO_PASS, {}
  ]);
  if (!uid) throw new Error('Odoo authentication failed');
  return uid;
}

// Cari produk berdasarkan IMEI di stock.lot (serial number tracking)
async function cekIMEI(imei) {
  const uid = await authenticate();
  const obj = createClient('/xmlrpc/2/object');

  // Cari di stock.lot (serial/lot tracking)
  const lots = await callXmlRpc(obj, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASS,
    'stock.lot',
    'search_read',
    [[['name', '=', imei]]],
    {
      fields: ['name', 'product_id', 'company_id', 'product_qty'],
      limit: 1
    }
  ]);

  if (!lots || lots.length === 0) {
    return { valid: false, message: 'IMEI tidak ditemukan dalam sistem MITO' };
  }

  const lot = lots[0];
  const productId = lot.product_id[0];
  const productName = lot.product_id[1];

  // Ambil harga jual produk dari product.template
  const products = await callXmlRpc(obj, 'execute_kw', [
    ODOO_DB, uid, ODOO_PASS,
    'product.product',
    'search_read',
    [[['id', '=', productId]]],
    { fields: ['name', 'list_price', 'categ_id'], limit: 1 }
  ]);

  const hargaJual = products[0]?.list_price || 0;

  return {
    valid: true,
    productId,
    productName,
    hargaJual,
    lotId: lot.id,
  };
}

// Cek apakah IMEI sudah pernah dipakai (dari database kita, bukan Odoo)
// Fungsi ini hanya validasi keberadaan di Odoo, duplikat dicek di PostgreSQL kita
async function validasiIMEI(imei) {
  try {
    const result = await cekIMEI(imei);
    return result;
  } catch (err) {
    console.error('[OdooService] Error:', err.message);
    throw new Error(`Gagal validasi IMEI ke sistem MITO: ${err.message}`);
  }
}

module.exports = { validasiIMEI };
