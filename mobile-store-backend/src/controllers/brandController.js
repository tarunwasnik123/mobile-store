const brandService = require('../services/brand.service');

exports.list = async (req, res) => {
  try {
    const data = await brandService.list(req.query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Failed to fetch brands' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const brand = await brandService.create({ name });
    res.status(201).json(brand);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to create brand',
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Brand name is required' });
    }

    const brand = await brandService.update(id, { name });
    res.json(brand);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to update brand',
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await brandService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to delete brand',
    });
  }
};
