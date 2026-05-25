import { prisma } from './src/utils/prisma';

async function main() {
  try {
    console.log('Attempting to connect to the database...');
    // A simple query to check the connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Database connection successful!', result);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
