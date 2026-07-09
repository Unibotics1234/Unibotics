// server/seed-courses.js
// Run: node server/seed-courses.js

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Course   = require('./models/Course');

const courses = [
  { icon:'🧠', title:'Artificial Intelligence',    category:'AI',       description:'Learn intelligent systems and neural networks.' },
  { icon:'🤖', title:'Machine Learning',           category:'AI',       description:'Models, prediction and deep learning.' },
  { icon:'📊', title:'Data Science & Analytics',  category:'Data',     description:'Python, SQL and visualization.' },
  { icon:'☁️', title:'Cloud Computing',            category:'Cloud',    description:'AWS, Azure and GCP fundamentals.' },
  { icon:'🛡️', title:'Cybersecurity',              category:'Security', description:'Ethical hacking and network defense.' },
  { icon:'💻', title:'Software Development',       category:'Software', description:'Full Stack web and mobile development.' },
  { icon:'⚙️', title:'DevOps & Automation',        category:'Software', description:'CI/CD, Docker and Kubernetes.' },
  { icon:'⛓️', title:'Blockchain Technology',      category:'Emerging', description:'Web3 and Smart Contracts.' },
  { icon:'📡', title:'Robotics & IoT',             category:'Emerging', description:'Embedded systems and IoT.' },
  { icon:'✨', title:'Generative AI',              category:'AI',       description:'LLMs and Prompt Engineering.' }
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Course.deleteMany();
  await Course.insertMany(courses);
  console.log('✅ Courses seeded.');
  process.exit();
})();