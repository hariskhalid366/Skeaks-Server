const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../modals/users');
const Wallet = require('../modals/wallet');
const walletRouter = require('../routes/wallet'); // Your wallet router

// --- Setup Notes are similar to previous test files ---

let app;
let server;
let testUser, authToken;

const setupApp = () => {
    const tempApp = express();
    tempApp.use(express.json());
    tempApp.use((req, res, next) => {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer testtoken_wallet_user')) {
            req.user = { id: testUser._id.toString() };
        }
        next();
    });
    tempApp.use('/api/wallet', walletRouter);
    return tempApp;
};

beforeAll(async () => {
    app = setupApp();
    const mongoUri = process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/test_db_wallet';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }

    testUser = new User({ username: 'walletuser', email: 'walletuser@example.com', password: 'password' });
    await testUser.save();
    authToken = 'Bearer testtoken_wallet_user';

    // No need to pre-create a wallet, the controller should handle it.
});

afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await mongoose.connection.close();
});

describe('Wallet API', () => {
    it('should get the authenticated user wallet, creating it if it does not exist', async () => {
        const res = await request(app)
            .get('/api/wallet/')
            .set('Authorization', authToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(res.body.wallet).toHaveProperty('userId', testUser._id.toString());
        expect(res.body.wallet).toHaveProperty('balance', 0); // Initial balance

        // Verify wallet was created in DB
        const dbWallet = await Wallet.findOne({ userId: testUser._id });
        expect(dbWallet).not.toBeNull();
        expect(dbWallet.balance).toEqual(0);
    });

    it('should retrieve an existing wallet for the authenticated user', async () => {
        // Ensure wallet exists from previous test or create one
        let existingWallet = await Wallet.findOne({ userId: testUser._id });
        if (!existingWallet) {
            existingWallet = new Wallet({ userId: testUser._id, balance: 50 });
            await existingWallet.save();
        } else if (existingWallet.balance !== 50) {
            existingWallet.balance = 50;
            await existingWallet.save();
        }


        const res = await request(app)
            .get('/api/wallet/')
            .set('Authorization', authToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(res.body.wallet.balance).toEqual(50);
    });

    it('should not allow getting wallet without authentication', async () => {
        const res = await request(app).get('/api/wallet/');
        // Expecting 401 or 403 from a real verifyToken middleware
        expect(res.statusCode).not.toEqual(200);
    });

    // Tests for the internal `updateUserWallet` function would be more like unit tests
    // if we were to test it directly. Since it's not exposed via an API endpoint,
    // its functionality would typically be tested indirectly through actions that use it (e.g., completing a sale).
    // For now, we'll skip direct tests of updateUserWallet as it's not an API.
});
