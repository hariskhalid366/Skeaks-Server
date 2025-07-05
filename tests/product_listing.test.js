const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../modals/users');
const Product = require('../modals/product');
const productRouter = require('../routes/product'); // Your product router
const userRouter = require('../routes/user'); // For creating a user for auth

// --- Setup Notes are similar to profile.test.js ---

let app;
let server;
let testUser, otherUser, userProduct, authToken, otherAuthToken;

const setupApp = () => {
    const tempApp = express();
    tempApp.use(express.json());
    tempApp.use((req, res, next) => {
        if (req.headers.authorization) {
            if (req.headers.authorization === 'Bearer testtoken_user') {
                req.user = { id: testUser._id.toString() };
            } else if (req.headers.authorization === 'Bearer testtoken_otheruser') {
                req.user = { id: otherUser._id.toString() };
            }
        }
        next();
    });
    tempApp.use('/api/products', productRouter);
    // tempApp.use('/api/users', userRouter); // If needed for user creation/login within tests
    return tempApp;
};

beforeAll(async () => {
    app = setupApp();
    const mongoUri = process.env.MONGO_URL_TEST || 'mongodb://localhost:27017/test_db_product_listing';
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUri);
    }

    testUser = new User({ username: 'productowner', email: 'productowner@example.com', password: 'password' });
    await testUser.save();
    authToken = 'Bearer testtoken_user';

    otherUser = new User({ username: 'otheruserprod', email: 'otheruserprod@example.com', password: 'password' });
    await otherUser.save();
    otherAuthToken = 'Bearer testtoken_otheruser';


    userProduct = new Product({
        name: 'Owner Product',
        description: 'This is a product by productowner.',
        image: 'owner_product.jpg',
        price: 50,
        ownerId: testUser._id,
        isFixedPrice: true,
    });
    await userProduct.save();
});

afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
});

describe('Product Listing APIs', () => {
    it('should allow an authenticated user to post a new product', async () => {
        const newProductData = {
            name: 'Awesome New Gadget',
            description: 'The latest and greatest gadget.',
            image: 'gadget.jpg',
            images: ['gadget_front.jpg', 'gadget_back.jpg'],
            price: 199.99,
            sizes: ['M', 'L'],
        };

        const res = await request(app)
            .post('/api/products/')
            .set('Authorization', authToken)
            .send(newProductData);

        expect(res.statusCode).toEqual(201);
        expect(res.body.status).toBe(true);
        expect(res.body.product).toHaveProperty('name', newProductData.name);
        expect(res.body.product.ownerId.toString()).toEqual(testUser._id.toString());
        expect(res.body.product.isFixedPrice).toBe(true);
        expect(res.body.product.status).toBe('available');
    });

    it('should not allow posting a product without authentication', async () => {
        const newProductData = { name: 'No Auth Product', description: '...', image: 'img.jpg', price: 10 };
        const res = await request(app)
            .post('/api/products/')
            .send(newProductData);
        // Expecting 401 or 403, depends on middleware. Given mock, controller might error differently.
        // A real verifyToken would make this 401/403.
        expect(res.statusCode).not.toEqual(201); // Should not succeed
    });

    it('should allow a product owner to delete their product (soft delete)', async () => {
        const res = await request(app)
            .delete(`/api/products/${userProduct._id}`)
            .set('Authorization', authToken);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe(true);
        expect(res.body.message).toEqual('Product removed successfully.');

        const dbProduct = await Product.findById(userProduct._id);
        expect(dbProduct.status).toEqual('removed');
    });

    it('should not allow a user to delete a product they do not own', async () => {
        // Re-create userProduct if it was soft-deleted and you want to test this path again, or use a different product.
        // For this test, let's assume userProduct is still available or create a new one for clarity.
        // If userProduct was soft-deleted, we need a new product for this test or reset its status.
        // Let's make userProduct available again for this test case
        const productToTest = await Product.findById(userProduct._id);
        if (productToTest.status === 'removed') {
            productToTest.status = 'available';
            await productToTest.save();
        }


        const res = await request(app)
            .delete(`/api/products/${userProduct._id}`)
            .set('Authorization', otherAuthToken); // otherUser tries to delete testUser's product

        expect(res.statusCode).toEqual(403);
        expect(res.body.status).toBe(false);
        expect(res.body.message).toEqual('You are not authorized to delete this product.');
    });

    it('should return 404 when trying to delete a non-existent product', async () => {
        const fakeProductId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/products/${fakeProductId}`)
            .set('Authorization', authToken);

        expect(res.statusCode).toEqual(404);
        expect(res.body.status).toBe(false);
        expect(res.body.message).toEqual('Product not found.');
    });
});
