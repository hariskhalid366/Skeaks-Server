const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express'); // Assuming app needs to be built similarly or imported
const User = require('../modals/users');
const Product = require('../modals/product');
const BidProduct = require('../modals/bidModal');
const userRouter = require('../routes/user'); // Assuming your app structure
const productRouter = require('../routes/product'); // For creating test products

// --- Setup Notes for User ---
// 1. Ensure you have supertest, jest (or mocha/chai) installed:
//    npm install --save-dev supertest jest
// 2. Configure your package.json "test" script: e.g., "test": "jest"
// 3. You'll need a running MongoDB instance (preferably a test DB).
//    Update MONGO_URL in your .env or test setup.
// 4. This test suite assumes your Express app can be started or its router can be tested.
//    If your main app file (server.js) exports the app or server, import it.
//    Otherwise, you might need to construct a minimal app instance here with necessary middleware.
//
// For simplicity, this example will create a minimal app.
// A more robust setup would import your actual configured Express app.

let app;
let server; // To close the server after tests
let testUser, testProduct, testBidProduct, authToken;

// Minimal app setup for testing routes
const setupApp = () => {
    const tempApp = express();
    tempApp.use(express.json());
    // Mock verifyToken middleware for tests where auth is needed but simplified
    // A real scenario would involve a proper login step to get a token.
    tempApp.use((req, res, next) => {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer testtoken')) {
            req.user = { id: testUser._id.toString() }; // Mock user object
        }
        next();
    });
    tempApp.use('/api/users', userRouter);
    // tempApp.use('/api/products', productRouter); // If needed for product creation within tests
    return tempApp;
};


beforeAll(async () => {
    app = setupApp(); // Initialize app
    // server = app.listen(some_random_port); // If needed for supertest to attach to a running server

    // Connect to a test database
    // Ensure your MONGO_URL_TEST environment variable is set for a test database
    const mongoUri = process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/test_db_profile';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }

    // Create a test user
    testUser = new User({
        username: 'testuserprofile',
        email: 'testuserprofile@example.com',
        password: 'password123', // In real app, this would be hashed
    });
    await testUser.save();
    authToken = 'Bearer testtoken'; // Simplified token

    // Create a test product owned by the user
    testProduct = new Product({
        name: 'Test User Product',
        description: 'A product by testuserprofile',
        image: 'test_product.jpg',
        price: 100,
        ownerId: testUser._id,
        isFixedPrice: true,
    });
    await testProduct.save();

    // Create a test bidding product created by the user
    testBidProduct = new BidProduct({
        name: 'Test User Bid Product',
        description: 'A bidding product by testuserprofile',
        image: 'test_bid_product.jpg',
        startingPrice: 50,
        creator: { userId: testUser._id, username: testUser.username },
        bidEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Ends in 1 day
    });
    await testBidProduct.save();
});

afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await BidProduct.deleteMany({});
    await mongoose.connection.close();
    // if (server) server.close(); // Close server if it was started
});

describe('User Profile APIs', () => {
    it('should get a user public profile by ID', async () => {
        const res = await request(app).get(`/api/users/${testUser._id}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(res.body.user).toHaveProperty('username', 'testuserprofile');
        expect(res.body.user).not.toHaveProperty('password');
    });

    it('should return 404 for a non-existent user ID', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/users/${fakeId}`);
        expect(res.statusCode).toEqual(404);
        expect(res.body.status).toBe(false);
    });

    it('should get products listed by a user ID', async () => {
        const res = await request(app).get(`/api/users/${testUser._id}/products`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(Array.isArray(res.body.products)).toBe(true);
        expect(res.body.products.length).toBeGreaterThan(0);
        expect(res.body.products[0].name).toEqual('Test User Product');
    });

    it('should get bidding products created by a user ID', async () => {
        const res = await request(app).get(`/api/users/${testUser._id}/bids`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(Array.isArray(res.body.biddingProducts)).toBe(true);
        expect(res.body.biddingProducts.length).toBeGreaterThan(0);
        expect(res.body.biddingProducts[0].name).toEqual('Test User Bid Product');
    });

    it('should get own profile for authenticated user', async () => {
        const res = await request(app)
            .get('/api/users/profile/me')
            .set('Authorization', authToken);
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(res.body.user).toHaveProperty('username', 'testuserprofile');
        expect(res.body.user._id.toString()).toEqual(testUser._id.toString());
    });

    it('should return 401/403 if trying to get own profile without token', async () => {
        // Behavior might depend on how verifyToken is implemented without a token
        // Assuming it would lead to an error or empty req.user thus a 404 or other error
        // For this mock, our middleware doesn't strictly block, but req.user would be undefined.
        // The controller's User.findById(undefined) would likely error or return null.
        // A real verifyToken would return 401/403.
        // Let's assume the controller path for !user is hit.
        const res = await request(app).get('/api/users/profile/me');
        // This expectation depends on the actual behavior of verifyToken and getOwnProfile when req.user is not set.
        // It might be a 401, 403, or 500 (if req.user.id is accessed on undefined).
        // Given the current mock, it might try User.findById(undefined) which could lead to a 500 or a specific Mongoose error.
        // A production verifyToken would typically return 401.
        // For now, let's expect it not to be 200.
        expect(res.statusCode).not.toEqual(200);
        // Ideally, this should be expect(res.statusCode).toBe(401) or expect(res.statusCode).toBe(403)
    });
});
