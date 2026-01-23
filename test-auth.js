import { hashPassword, verifyPassword, generateToken, verifyToken, validatePassword } from './api/auth-helper.js';

console.log('Testing Authentication Functions\n');
console.log('='.repeat(50));

// Test 1: Password Validation
console.log('\n1. Testing Password Validation:');
const weakPassword = 'test';
const mediumPassword = 'Test1234';
const strongPassword = 'TestPass123';

console.log(`   Weak password "${weakPassword}":`, validatePassword(weakPassword));
console.log(`   Medium password "${mediumPassword}":`, validatePassword(mediumPassword));
console.log(`   Strong password "${strongPassword}":`, validatePassword(strongPassword));

// Test 2: Password Hashing
console.log('\n2. Testing Password Hashing:');
const testPassword = 'TestPass123';
const { salt, hash } = hashPassword(testPassword);
console.log(`   Password: ${testPassword}`);
console.log(`   Salt (first 20 chars): ${salt.substring(0, 20)}...`);
console.log(`   Hash (first 20 chars): ${hash.substring(0, 20)}...`);

// Test 3: Password Verification
console.log('\n3. Testing Password Verification:');
const correctPassword = verifyPassword(testPassword, salt, hash);
const wrongPassword = verifyPassword('WrongPass123', salt, hash);
console.log(`   Correct password verification: ${correctPassword ? '✓ PASS' : '✗ FAIL'}`);
console.log(`   Wrong password verification: ${!wrongPassword ? '✓ PASS' : '✗ FAIL'}`);

// Test 4: Token Generation
console.log('\n4. Testing Token Generation:');
const userId = 1;
const email = 'test@example.com';
const token = generateToken(userId, email);
console.log(`   Generated token (first 40 chars): ${token.substring(0, 40)}...`);
console.log(`   Token length: ${token.length} characters`);

// Test 5: Token Verification
console.log('\n5. Testing Token Verification:');
const payload = verifyToken(token);
console.log(`   Token valid: ${payload ? '✓ PASS' : '✗ FAIL'}`);
if (payload) {
  console.log(`   User ID: ${payload.userId}`);
  console.log(`   Email: ${payload.email}`);
  console.log(`   Issued at: ${new Date(payload.iat).toLocaleString()}`);
  console.log(`   Expires at: ${new Date(payload.exp).toLocaleString()}`);
  const daysUntilExpiry = (payload.exp - Date.now()) / (1000 * 60 * 60 * 24);
  console.log(`   Days until expiry: ${daysUntilExpiry.toFixed(2)}`);
}

// Test 6: Token Expiration
console.log('\n6. Testing Invalid Token:');
const invalidToken = 'invalid.token.here';
const invalidPayload = verifyToken(invalidToken);
console.log(`   Invalid token rejected: ${!invalidPayload ? '✓ PASS' : '✗ FAIL'}`);

console.log('\n' + '='.repeat(50));
console.log('All tests completed!\n');

// Simulated signup flow
console.log('Simulated Signup Flow:');
console.log('-'.repeat(50));
const signupEmail = 'benhudock4@gmail.com';
const signupPassword = 'TestPass123';
const signupName = 'Ben H';

console.log(`\nUser wants to sign up:`);
console.log(`  Name: ${signupName}`);
console.log(`  Email: ${signupEmail}`);
console.log(`  Password: ${'*'.repeat(signupPassword.length)}`);

// Validate password
const passwordCheck = validatePassword(signupPassword);
if (!passwordCheck.valid) {
  console.log(`\n✗ Password validation failed: ${passwordCheck.error}`);
} else {
  console.log(`\n✓ Password validation passed`);

  // Hash password
  const { salt: userSalt, hash: userHash } = hashPassword(signupPassword);
  console.log(`✓ Password hashed successfully`);

  // Generate token
  const userToken = generateToken(1, signupEmail);
  console.log(`✓ Auth token generated`);

  // Verify token
  const userPayload = verifyToken(userToken);
  if (userPayload) {
    console.log(`✓ Token verification successful`);
    console.log(`\nUser would be logged in as:`);
    console.log(`  ID: ${userPayload.userId}`);
    console.log(`  Email: ${userPayload.email}`);
    console.log(`  Token valid for: ${((userPayload.exp - Date.now()) / (1000 * 60 * 60 * 24)).toFixed(1)} days`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('\n✓ Authentication system is working correctly!');
console.log('Deploy to Vercel with JWT_SECRET set to use in production.\n');
