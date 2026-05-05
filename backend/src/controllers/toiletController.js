const prisma = require('../config/prisma');
const { getDistanceInKm } = require('../utils/haversine');
const { formatToilet } = require('../utils/serializers');

async function createToilet(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { name, lat, lng, price, status, type, images } = req.body;

    if (!name || lat === undefined || lng === undefined || !type) {
      return res.status(400).json({
        success: false,
        message: 'name, lat, lng and type are required'
      });
    }

    const toilet = await prisma.toilet.create({
      data: {
        ownerId,
        name,
        lat: Number(lat),
        lng: Number(lng),
        price: Number(price || 0),
        status: (status || 'OPEN').toUpperCase(),
        type: String(type).toUpperCase(),
        images: JSON.stringify(Array.isArray(images) ? images : [])
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Toilet created successfully',
      data: formatToilet(toilet)
    });
  } catch (error) {
    next(error);
  }
}

async function getAllToilets(req, res, next) {
  try {
    const where = {};

    if (req.query.status) {
      where.status = String(req.query.status).toUpperCase();
    }

    if (req.query.ownerId) {
      where.ownerId = Number(req.query.ownerId);
    }

    const toilets = await prisma.toilet.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      count: toilets.length,
      data: toilets.map(formatToilet)
    });
  } catch (error) {
    next(error);
  }
}

async function getNearbyToilets(req, res, next) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Valid lat and lng query parameters are required'
      });
    }

    const allToilets = await prisma.toilet.findMany({
      where: { status: 'OPEN' }
    });

    const toilets = allToilets
      .map(t => {
        const distance = getDistanceInKm(lat, lng, t.lat, t.lng);
        return {
          ...formatToilet(t),
          distance
        };
      })
      .filter(t => t.distance <= 5)
      .sort((a, b) => a.distance - b.distance);

    return res.json({
      success: true,
      count: toilets.length,
      data: toilets
    });
  } catch (error) {
    next(error);
  }
}

async function getToiletById(req, res, next) {
  try {
    const id = Number(req.params.id);

    const toilet = await prisma.toilet.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    return res.json({
      success: true,
      data: formatToilet(toilet)
    });
  } catch (error) {
    next(error);
  }
}

async function updateToilet(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const { name, lat, lng, price, status, type, images } = req.body;

    const toilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    if (toilet.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this toilet'
      });
    }

    const updatedToilet = await prisma.toilet.update({
      where: { id },
      data: {
        name,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        price: price !== undefined ? Number(price) : undefined,
        status: status ? String(status).toUpperCase() : undefined,
        type: type ? String(type).toUpperCase() : undefined,
        images: Array.isArray(images) ? JSON.stringify(images) : undefined
      }
    });

    return res.json({
      success: true,
      message: 'Toilet updated successfully',
      data: formatToilet(updatedToilet)
    });
  } catch (error) {
    next(error);
  }
}

async function deleteToilet(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    const toilet = await prisma.toilet.findUnique({
      where: { id }
    });

    if (!toilet) {
      return res.status(404).json({
        success: false,
        message: 'Toilet not found'
      });
    }

    if (toilet.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this toilet'
      });
    }

    await prisma.toilet.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Toilet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createToilet,
  getAllToilets,
  getNearbyToilets,
  getToiletById,
  updateToilet,
  deleteToilet
};
