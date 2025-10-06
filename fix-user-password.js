const bcrypt = require('bcryptjs');
const supabase = require('./src/config/supabase');

async function fixUserPassword() {
  console.log('🔧 Arreglando contraseña del usuario admin...');
  
  try {
    // Generar hash correcto para la contraseña
    const password = 'admin123'; // Contraseña que vamos a usar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    console.log('🔐 Hash generado para contraseña:', password);
    
    // Actualizar el usuario admin en Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        is_active: true 
      })
      .eq('email', 'admin@test.com')
      .select();
    
    if (error) {
      throw error;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Usuario actualizado correctamente:', data[0].email);
      console.log('📧 Email:', data[0].email);
      console.log('👤 Username:', data[0].username);
      console.log('🔑 Nueva contraseña:', password);
    } else {
      console.log('❌ No se encontró el usuario admin@test.com');
      
      // Crear el usuario si no existe
      console.log('🆕 Creando usuario admin...');
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          email: 'admin@test.com',
          password: hashedPassword,
          is_active: true
        }])
        .select();
      
      if (createError) {
        throw createError;
      }
      
      console.log('✅ Usuario admin creado:', newUser[0].email);
      console.log('🔑 Contraseña:', password);
    }
    
    console.log('\n🎉 ¡Usuario arreglado!');
    console.log('Ahora puedes hacer login con:');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Contraseña:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserPassword();