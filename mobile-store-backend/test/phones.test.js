const chai = require('chai');
const request = require('supertest');
const app = require('../src/app');
const setup = require('./setup');
const User = require('../src/models/User');
const { signToken } = require('../src/utils/jwt');

const expect = chai.expect;

describe('Phones API', function () {
  before(async function () {
    this.timeout(10000);
    await setup.start();
  });

  after(async function () {
    await setup.stop();
  });

  afterEach(async function () {
    await setup.clear();
  });

  it('should reject creating phone without auth', async function () {
    const res = await request(app)
      .post('/api/phones')
      .send({ externalId: 'px', name: 'X', brand: 'B', price: 100 });
    expect(res.status).to.equal(401);
  });

  it('should reject invalid phone body', async function () {
    // create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'a@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const token = signToken(admin);
    const res = await request(app)
      .post('/api/phones')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Missing externalId' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('message');
  });

  it('should create phone with valid body and admin', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'a2@test.com',
      passwordHash: 'hash',
      role: 'admin',
    });
    const token = signToken(admin);
    const body = {
      externalId: 'p100',
      name: 'New Phone',
      brand: 'Test',
      price: 19999,
      metaTitle: 'Best New Phone 2025',
      metaName: 'smartphone, flagship, premium',
      metaDescription:
        'Learn about our newest premium smartphone with advanced features.',
    };
    const res = await request(app)
      .post('/api/phones')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).to.equal(201);
    expect(res.body).to.include({
      externalId: 'p100',
      name: 'New Phone',
      metaTitle: 'Best New Phone 2025',
      metaName: 'smartphone, flagship, premium',
      metaDescription:
        'Learn about our newest premium smartphone with advanced features.',
    });
  });

  it('should return ranked best phones and support minScore filter', async function () {
    const Phone = require('../src/models/Phone');

    // Insert sample phones
    await Phone.insertMany([
      {
        externalId: 't1',
        name: 'Test High',
        brand: 'Test',
        price: 15000,
        specs: {
          Performance: { RAM: '16 GB', Fabrication: '4 nm' },
          Display: { Type: 'AMOLED', RefreshRate: '144 Hz' },
          Battery: { Capacity: '6000 mAh', QuickCharging: '65W' },
          General: { ReleaseDate: new Date().toISOString() },
          RearCamera: { Camera: { Primary: '200 MP' } },
          FrontCamera: { Camera: '32 MP' },
        },
      },
      {
        externalId: 't2',
        name: 'Test Mid',
        brand: 'Test',
        price: 25000,
        specs: {
          Performance: { RAM: '8 GB', Fabrication: '6 nm' },
          Display: { Type: 'AMOLED', RefreshRate: '120 Hz' },
          Battery: { Capacity: '5000 mAh', QuickCharging: '33W' },
          General: { ReleaseDate: new Date().toISOString() },
          RearCamera: { Camera: { Primary: '50 MP' } },
          FrontCamera: { Camera: '16 MP' },
        },
      },
    ]);

    // default should return both ranked
    const res = await request(app).get('/api/phones/best');
    expect(res.status).to.equal(200);
    const defaultBestPhones = Array.isArray(res.body)
      ? res.body
      : res.body.results || [];
    expect(defaultBestPhones.length).to.be.greaterThan(0);
    expect(defaultBestPhones[0]).to.have.property('bestScore');

    // minScore filter should apply
    const res2 = await request(app).get('/api/phones/best?minScore=60');
    const minScorePhones = Array.isArray(res2.body)
      ? res2.body
      : res2.body.results || [];
    expect(res2.status).to.equal(200);
    expect(minScorePhones.every((p) => p.bestScore >= 60)).to.be.true;

    // pagination should return results with metadata
    const res3 = await request(app).get('/api/phones/best?page=1&limit=1');
    expect(res3.status).to.equal(200);
    expect(res3.body).to.have.property('results');
    expect(res3.body.results).to.have.lengthOf(1);
    expect(res3.body).to.have.property('total').that.is.a('number');
  });

  it('should filter phones by minReleaseDate using nested specs.General.LaunchDate', async function () {
    const Phone = require('../src/models/Phone');

    // Insert phones with different release dates
    await Phone.insertMany([
      {
        externalId: 'r1',
        name: 'Old Phone',
        brand: 'Test',
        price: 10000,
        specs: {
          General: { LaunchDate: new Date('2020-01-01').toISOString() },
        },
      },
      {
        externalId: 'r2',
        name: 'New Phone',
        brand: 'Test',
        price: 20000,
        specs: {
          General: { LaunchDate: new Date('2025-01-01').toISOString() },
        },
      },
    ]);

    const res = await request(app).get('/api/phones?minReleaseDate=2024-01-01');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('results');
    const ids = res.body.results.map((p) => p.externalId || p._id);
    expect(ids).to.include('r2');
    expect(ids).to.not.include('r1');
  });

  it('should migrate expired upcoming phones into phones and support upcoming detail fallback', async function () {
    const UpcomingPhone = require('../src/models/UpcomingPhone');
    const Phone = require('../src/models/Phone');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const upcoming = await UpcomingPhone.create({
      externalId: 'expired-upcoming-1',
      name: 'Expired Upcoming',
      brand: 'Test',
      price: 9999,
      specs: {
        General: { ReleaseDate: yesterday.toISOString() },
      },
    });

    const upcomingListRes = await request(app).get('/api/upcoming');
    expect(upcomingListRes.status).to.equal(200);
    expect(upcomingListRes.body).to.have.property('results');
    expect(upcomingListRes.body.results).to.have.lengthOf(0);

    const phoneRes = await request(app).get(
      `/api/phones/${upcoming.externalId}`,
    );
    expect(phoneRes.status).to.equal(200);
    expect(phoneRes.body).to.have.property('externalId', 'expired-upcoming-1');
    expect(phoneRes.body.specs?.General?.LaunchDate).to.exist;

    const upcomingGetRes = await request(app).get(
      `/api/upcoming/${upcoming.externalId}`,
    );
    expect(upcomingGetRes.status).to.equal(200);
    expect(upcomingGetRes.body).to.have.property(
      'externalId',
      'expired-upcoming-1',
    );
    expect(upcomingGetRes.body.specs?.General?.ReleaseDate).to.exist;

    const migrated = await Phone.findOne({ externalId: 'expired-upcoming-1' });
    expect(migrated).to.exist;
  });

  it('should search phones by brand, name, and model number', async function () {
    const Phone = require('../src/models/Phone');

    // Insert a Samsung phone for testing
    await Phone.create({
      externalId: 's50',
      name: 'Galaxy Model 50',
      brand: 'samsung',
      price: 49999,
    });

    // search by brand
    const byBrand = await request(app).get('/api/phones?q=samsung');
    expect(byBrand.status).to.equal(200);
    expect(byBrand.body).to.have.property('results');
    expect(byBrand.body.results.some((p) => p.name === 'Galaxy Model 50')).to.be
      .true;

    // search by model fragment
    const byModel = await request(app).get('/api/phones?q=50');
    expect(byModel.status).to.equal(200);
    expect(byModel.body).to.have.property('results');
    expect(byModel.body.results.some((p) => p.name === 'Galaxy Model 50')).to.be
      .true;

    // search by name token
    const byName = await request(app).get('/api/phones?q=galaxy');
    expect(byName.status).to.equal(200);
    expect(byName.body.results.some((p) => p.name === 'Galaxy Model 50')).to.be
      .true;
  });

  it('should persist nested specs when creating phone via admin and return same data on GET', async function () {
    const admin = await User.create({
      name: 'Admin',
      email: 'p@test.com',
      passwordHash: 'h',
      role: 'admin',
    });
    const token = signToken(admin);

    const body = {
      name: 'Nested Phone',
      brand: 'TestBrand',
      price: 19999,
      specs: {
        KeySpecs: { RearCamera: '108 MP', FrontCamera: '32 MP' },
        General: { LaunchDate: '2025-10-10' },
      },
    };

    const createRes = await request(app)
      .post('/api/phones')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(createRes.status).to.equal(201);
    // id returned should include generated externalId or _id
    const id = createRes.body.externalId || createRes.body._id;

    const getRes = await request(app).get(`/api/phones/${id}`);
    expect(getRes.status).to.equal(200);
    expect(getRes.body.specs).to.exist;
    expect(getRes.body.specs.General.LaunchDate).to.exist;
    expect(
      new Date(getRes.body.specs.General.LaunchDate)
        .toISOString()
        .startsWith('2025-10-10'),
    ).to.be.true;
  });
});
