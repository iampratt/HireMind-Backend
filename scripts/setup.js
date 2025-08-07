#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up HireMind Backend...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '..', 'env.example');

  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
    console.log(
      '⚠️  Please edit .env file with your configuration before starting the server\n'
    );
  } else {
    console.log('❌ env.example file not found');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check if uploads directory exists
const uploadsPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  console.log('📁 Creating uploads directory...');
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.log('❌ Failed to install dependencies');
  process.exit(1);
}

// Test database connection
console.log('\n🔧 Testing database connection...');
try {
  const { connectDB } = require('../src/config/database');
  connectDB()
    .then(() => {
      console.log('✅ Database connection successful');
      process.exit(0);
    })
    .catch((error) => {
      console.log('❌ Failed to connect to database');
      console.log(
        '⚠️  Make sure MongoDB is running and DATABASE_URL is configured in .env'
      );
      process.exit(1);
    });
} catch (error) {
  console.log('❌ Failed to test database connection');
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your configuration');
console.log('2. Start MongoDB (if using local instance)');
console.log('3. Run: npm run dev');
console.log('4. Test the API at: http://localhost:3000/health');
console.log('\n📚 Check README.md for detailed documentation');
