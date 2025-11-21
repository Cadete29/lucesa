const fs = require('fs');
const path = require('path');

function debugXML() {
  try {
    const xmlPath = path.join(__dirname, 'data', 'ftp', 'raw', 'productos.xml');
    
    if (!fs.existsSync(xmlPath)) {
      console.log('❌ Archivo XML no encontrado:', xmlPath);
      return;
    }

    console.log('📄 Analizando archivo XML...');
    
    // Leer primeras 100 líneas
    const data = fs.readFileSync(xmlPath, 'utf8');
    const lines = data.split('\n').slice(0, 100);
    
    console.log('📋 Primeras 100 líneas del XML:');
    console.log('=' .repeat(80));
    lines.forEach((line, index) => {
      console.log(`${index + 1}: ${line.substring(0, 200)}${line.length > 200 ? '...' : ''}`);
    });
    console.log('=' .repeat(80));
    
    // Verificar si tiene estructura XML
    const hasXMLStructure = data.includes('<?xml') || data.includes('<catalogo') || data.includes('<productos');
    console.log(`🔍 ¿Tiene estructura XML?: ${hasXMLStructure}`);
    
    // Contar líneas totales
    const totalLines = data.split('\n').length;
    console.log(`📊 Total de líneas: ${totalLines}`);
    
    // Ver tamaño del archivo
    const stats = fs.statSync(xmlPath);
    console.log(`📦 Tamaño del archivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Error analizando XML:', error);
  }
}

debugXML();