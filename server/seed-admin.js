// server/seed-admin.js
// Run: node server/seed-admin.js
require("dotenv").config({ path: "../.env" });

console.log(process.env.MONGO_URI);
const mongoose = require('mongoose');
const User     = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const existing = await User.findOne({ email: 'directorunibotics@gmail.com' });
  if (existing) { console.log('Admin already exists.'); process.exit(); }

  await User.create({
    name: 'Unibotics Admin',
    email: 'directorunibotics@gmail.com',
    password: 'Admin@1234',   // change after first login
    role: 'admin',
    phone: '+919017902010'
  });

  console.log('✅ Admin created: directorunibotics@gmail.com / Admin@1234');
  process.exit();
})();