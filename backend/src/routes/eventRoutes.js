const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  updateEventStatus,
  updateEvent,
  joinEvent,
  leaveEvent
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createEvent);
router.get('/', protect, getEvents);
router.patch('/:id/status', protect, updateEventStatus);
router.patch('/:id', protect, updateEvent);
router.post('/:id/join', protect, joinEvent);
router.post('/:id/leave', protect, leaveEvent);

module.exports = router;
