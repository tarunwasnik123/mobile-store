const chai = require('chai');
const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');

const expect = chai.expect;

describe('News API', function () {
  before(async function () {
    await setup.start();
  });
  after(async function () {
    await setup.stop();
  });
  afterEach(async function () {
    await setup.clear();
  });

  it('should validate news creation body', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'n@test.com',
      passwordHash: 'h',
      role: 'admin',
    });
    const token = signToken(admin);
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect(res.status).to.equal(400);
  });

  it('should create news with valid body', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'n2@test.com',
      passwordHash: 'h',
      role: 'admin',
    });
    const token = signToken(admin);
    const body = {
      externalId: 'n100',
      title: 'News',
      summary: 'sum',
      metaTitle: 'Breaking Phone News',
      metaName: 'news, phones, latest',
      metaDescription: 'This is a news meta description for SEO.',
      content: 'content',
    };
    const res = await request(app)
      .post('/api/news')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).to.equal(201);
    expect(res.body).to.include({
      externalId: 'n100',
      title: 'News',
      metaTitle: 'Breaking Phone News',
      metaName: 'news, phones, latest',
      metaDescription: 'This is a news meta description for SEO.',
    });
  });
});
