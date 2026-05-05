// server/seed.js - Seed script to populate Firestore with initial data
require('dotenv').config();
const { admin, adminDb } = require('./firebase-admin');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    const db = adminDb;
    const FieldValue = admin.firestore.FieldValue;
    
    console.log('🌱 Starting database seed...');

    // 1. Create Admin User in Firestore
    const adminUser = {
      userId: 'admin',
      name: 'System Administrator',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN'
    };
    
    await db.collection('users').doc('admin').set(adminUser);
    console.log('✅ Admin user created (userId: admin, password: admin123)');

    // 2. Create IT Officers
    const officers = [
      {
        userId: 'officer1',
        name: 'Shaikat',
        password: await bcrypt.hash('officer123', 10),
        role: 'IT OFFICER'
      },
      {
        userId: 'officer2',
        name: 'Hasnat',
        password: await bcrypt.hash('officer123', 10),
        role: 'IT OFFICER'
      },
      {
        userId: 'officer3',
        name: 'Shakil',
        password: await bcrypt.hash('officer123', 10),
        role: 'IT OFFICER'
      }
    ];

    for (const officer of officers) {
      await db.collection('users').doc(officer.userId).set(officer);
    }
    console.log('✅ IT Officers created (Shaikat, Hasnat, Shakil)');

    // 3. Create Support Technicians (Assistants)
    const assistants = [
      {
        userId: 'assistant1',
        name: 'Safiqul',
        password: await bcrypt.hash('assist123', 10),
        role: 'ASSISTANT'
      },
      {
        userId: 'assistant2',
        name: 'Ashiq',
        password: await bcrypt.hash('assist123', 10),
        role: 'ASSISTANT'
      }
    ];

    for (const assistant of assistants) {
      await db.collection('users').doc(assistant.userId).set(assistant);
    }
    console.log('✅ Support Technicians created (Safiqul, Ashiq)');

    // 4. Create sample company profile
    const companyProfile = {
      name: 'WorkLoop IT Department',
      address: 'Corporate HQ',
      contact: 'it-support@company.com',
      updatedAt: FieldValue.serverTimestamp()
    };

    await db.collection('company').doc('profile').set(companyProfile);
    console.log('✅ Company profile created');

    // 5. Create sample tasks
    const sampleTasks = [
      {
        title: 'Network Infrastructure Upgrade',
        description: 'Upgrade the main server room network switches to 10Gbps fiber backbone',
        location: 'Server Room A',
        officerId: 'officer1',
        assistants: ['assistant1'],
        status: 'pending',
        priority: 'high',
        deadline: '2026-05-15',
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'admin',
        completionReport: null,
        adminFeedback: null
      },
      {
        title: 'Workstation Deployment',
        description: 'Deploy 50 new workstations to Floor 3 marketing team',
        location: 'Floor 3',
        officerId: 'officer2',
        assistants: ['assistant1', 'assistant2'],
        status: 'pending',
        priority: 'medium',
        deadline: '2026-05-20',
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'admin',
        completionReport: null,
        adminFeedback: null
      }
    ];

    for (const task of sampleTasks) {
      await db.collection('tasks').add(task);
    }
    console.log('✅ Sample tasks created');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: userId=admin, password=admin123');
    console.log('   Officer 1: userId=officer1, password=officer123 (Shaikat)');
    console.log('   Officer 2: userId=officer2, password=officer123 (Hasnat)');
    console.log('   Officer 3: userId=officer3, password=officer123 (Shakil)');
    console.log('   Tech 1: userId=assistant1, password=assist123 (Safiqul)');
    console.log('   Tech 2: userId=assistant2, password=assist123 (Ashiq)');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
