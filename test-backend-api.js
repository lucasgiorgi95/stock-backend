const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

async function testBackendAPI() {
  console.log('🧪 Probando API del Backend...\n');
  
  try {
    // 1. Probar endpoint de salud
    console.log('1. Probando endpoint de salud...');
    const healthResponse = await axios.get('http://localhost:3001');
    console.log('✅ Salud:', healthResponse.data.message);

    // 2. Probar registro de usuario
    console.log('\n2. Probando registro de usuario...');
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123456'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE}/auth/register`, registerData);
      console.log('✅ Registro exitoso:', registerResponse.data.message);
      console.log('   Token recibido:', registerResponse.data.data.token ? 'SÍ' : 'NO');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('Ya existe')) {
        console.log('ℹ️  Usuario ya existe, continuando...');
      } else {
        throw error;
      }
    }

    // 3. Probar login
    console.log('\n3. Probando login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: '123456'
    });
    console.log('✅ Login exitoso:', loginResponse.data.message);
    const token = loginResponse.data.data.token;
    console.log('   Token recibido:', token ? 'SÍ' : 'NO');

    // 4. Probar endpoint protegido
    console.log('\n4. Probando endpoint protegido (/auth/me)...');
    const meResponse = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Información del usuario obtenida:', meResponse.data.data.username);

    // 5. Probar productos
    console.log('\n5. Probando endpoint de productos...');
    const productsResponse = await axios.get(`${API_BASE}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Productos obtenidos:', productsResponse.data.data.length, 'productos');

    // 6. Crear un producto de prueba
    console.log('\n6. Probando creación de producto...');
    const productData = {
      code: 'TEST-' + Date.now(),
      name: 'Producto de Prueba API',
      description: 'Creado desde test de API',
      stock: 15,
      min_stock: 5,
      price: 29.99
    };

    const createProductResponse = await axios.post(`${API_BASE}/products`, productData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Producto creado:', createProductResponse.data.data.name);

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('✅ Backend conectado correctamente con Supabase');
    console.log('✅ Autenticación funcionando');
    console.log('✅ CRUD de productos funcionando');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Asegúrate de que el backend esté corriendo en el puerto 3001');
      console.log('   Ejecuta: npm run dev en la carpeta stock-backend');
    }
  }
}

testBackendAPI();