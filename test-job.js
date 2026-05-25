const http = require('http');

async function testPostJob() {
  // 1. Register to get token
  const registerRes = await fetch('http://localhost:9000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jobposter@example.com',
      password: 'password123',
      name: 'Job Poster'
    })
  });
  
  const authData = await registerRes.json();
  
  let token = authData.token;

  if (!token) {
    console.log('Registration failed (might already exist), attempting login...');
    const loginRes = await fetch('http://localhost:9000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jobposter@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
  }
  
  if (!token) {
    console.error('Failed to get token entirely');
    return;
  }
  
  console.log('Got token:', token.substring(0, 20) + '...');

  // 2. Post a job
  const jobRes = await fetch('http://localhost:9000/api/jobs', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Senior Software Engineer',
      description: 'We are looking for a senior developer with 5+ years of experience.',
      company: 'Tech Solutions Inc.',
      jobUrl: 'https://techsolutions.example.com/jobs/123'
    })
  });
  
  const jobData = await jobRes.json();
  console.log('Post Job Response:', JSON.stringify(jobData, null, 2));
}

testPostJob();
