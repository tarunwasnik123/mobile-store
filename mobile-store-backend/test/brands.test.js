const chai = require('chai');
const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');

const expect = chai.expect;

describe('Brands API', function () {
  before(async function () {
    await setup.start();
  });
  after(async function () {
    await setup.stop();
  });
  afterEach(async function () {
    await setup.clear();
  });

  it('should validate brand creation', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'b@test.com',
      passwordHash: 'h',
      role: 'admin',
    });
    const token = signToken(admin);
    const res = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.status).to.equal(400);
  });

  it('should create brand', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'b2@test.com',
      passwordHash: 'h',
      role: 'admin',
    });
    const token = signToken(admin);
    const res = await request(app)
      .post('/api/brands')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'NewBrand' });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('name');
    expect(res.body.name.toLowerCase()).to.equal('newbrand');
  });
});
