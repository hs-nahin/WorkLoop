// server/updateUsers.js - Update Firestore users with Firebase Auth UIDs
require('dotenv').config();
const { adminDb } = require('./firebase-admin');
const bcrypt = require('bcryptjs');

const updateUsers = async () => {
  try {
    const db = adminDb;
    console.log('🔄 Updating users with Firebase Auth UIDs...\n');

    // Delete existing users
    const usersSnapshot = await db.collection('users').get();
    for (const doc of usersSnapshot.docs) {
      await doc.ref.delete();
    }
    console.log('🗑️  Deleted old users\n');

    // Create users with Firebase Auth UIDs
    const users = [
      {
        uid: 'el4d2e49kHTcLHwGZDjw5qPghuE2',
        email: 'hasnat@workloop.com',
        name: 'System Administrator',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      },
      {
        uid: 'ntBm7kdTU9gZYrfb4JZstj6dPTN2',
        email: 'hasnat@workloop.com',
        name: 'Hasnat',
        password: await bcrypt.hash('hasnat2026', 10),
        role: 'IT OFFICER'
      },
      {
        uid: 'Nj2s89V84AQ0wtrd8xeKu2TE6tx2',
        email: 'shakil@workloop.com',
        name: 'Shakil',
        password: await bcrypt.hash('shakil2026', 10),
        role: 'IT OFFICER'
      },
      {
        uid: 'nFQdbhDFM5R0DWCamHcpBJ0eVrj2',
        email: 'shaikat@workloop.com',
        name: 'Shaikat',
        password: await bcrypt.hash('shaikat2026', 10),
        role: 'IT OFFICER'
      },
      {
        uid: '9G6waYDsK1RLSlrmw7IgsJ8laNr2',
        email: 'safiqul@workloop.com',
        name: 'Safiqul',
        password: await bcrypt.hash('safiqul2026', 10),
        role: 'ASSISTANT'
      },
      {
        uid: 'U08tPBYBshV9DyOpvWBttZfJKah1',
        email: 'ashiq@workloop.com',
        name: 'Ashiq',
        password: await bcrypt.hash('ashiq2026', 10),
        role: 'ASSISTANT'
      }
    ];

    for (const user of users) {
      await db.collection('users').doc(user.uid).set(user);
      console.log(`✅ Created: ${user.name} (${user.role}) - UID: ${user.uid}`);
    }

    console.log('\n🎉 Users updated successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: hasnat@workloop.com / admin123');
    console.log('   Hasnat: hasnat@workloop.com / hasnat2026 (IT OFFICER)');
    console.log('   Shakil: shakil@workloop.com / shakil2026 (IT OFFICER)');
    console.log('   Shaikat: shaikat@workloop.com / shaikat2026 (IT OFFICER)');
    console.log('   Safiqul: safiqul@workloop.com / safiqul2026 (ASSISTANT)');
    console.log('   Ashiq: ashiq@workloop.com / ashiq2026 (ASSISTANT)');

  } catch (error) {
    console.error('❌ Update error:', error);
  } finally {
    process.exit(0);
  }
};

updateUsers();
