// Script de teste para autenticação na API
// Execute com: node test-api-auth.js

const API_BASE = 'http://localhost:5000/api';
const EMAIL = 'martinsgomes527@gmail.com';
const PASSWORD = 'R21zd3d3ntr02025';

async function testAPI() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Fazer login
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.error('❌ Erro no login:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token || loginData.session?.access_token;
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user);
    console.log('🔑 Token:', token.substring(0, 50) + '...');
    
    // 2. Testar acesso a /api/vehicles
    console.log('\n📋 Buscando veículos...');
    const vehiclesResponse = await fetch(`${API_BASE}/vehicles`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!vehiclesResponse.ok) {
      const error = await vehiclesResponse.json();
      console.error('❌ Erro ao buscar veículos:', error);
      return;
    }

    const vehicles = await vehiclesResponse.json();
    console.log('✅ Veículos obtidos com sucesso!');
    console.log(`📊 Total de veículos: ${vehicles.length}`);
    console.log('\n📝 Lista de veículos:');
    vehicles.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.name} (${v.licensePlate}) - ${v.status}`);
    });

    // 3. Testar /api/auth/me
    console.log('\n👤 Verificando informações do usuário...');
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (meResponse.ok) {
      const userInfo = await meResponse.json();
      console.log('✅ Informações do usuário:', userInfo);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Verificar se fetch está disponível (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ Este script requer Node.js 18+ ou instale node-fetch');
  console.log('💡 Alternativa: Use o console do navegador ou curl');
} else {
  testAPI();
}

