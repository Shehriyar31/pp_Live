const mongoose = require('mongoose');
const Video = require('./models/Video');
require('dotenv').config();

// Sample videos data
const sampleVideos = [
  {
    title: "How to Make Money Online",
    description: "Learn the best strategies to earn money from home",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Digital Marketing Tips",
    description: "Essential tips for successful digital marketing",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Cryptocurrency Basics",
    description: "Understanding the fundamentals of cryptocurrency",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Passive Income Ideas",
    description: "Top 10 passive income ideas for 2024",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Investment Strategies",
    description: "Smart investment strategies for beginners",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Online Business Guide",
    description: "Complete guide to starting an online business",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Social Media Marketing",
    description: "Effective social media marketing techniques",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "E-commerce Success",
    description: "How to build a successful e-commerce store",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Freelancing Tips",
    description: "Essential tips for successful freelancing",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  {
    title: "Financial Planning",
    description: "Personal financial planning strategies",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
];

async function seedVideos() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing videos
    await Video.deleteMany({});
    console.log('🗑️ Cleared existing videos');

    // Insert sample videos
    await Video.insertMany(sampleVideos);
    console.log('✅ Sample videos added successfully');

    console.log('🎬 Video seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding videos:', error);
    process.exit(1);
  }
}

seedVideos();