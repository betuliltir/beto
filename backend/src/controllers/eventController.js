const Event = require('../models/Event');
const User = require('../models/User');

// Create event (ClubAdmin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, eventType, start, end } = req.body;
    const user = req.user;

    if (user.role !== 'clubAdmin') {
      return res.status(403).json({ message: 'Only club admins can create events' });
    }

    const newEvent = await Event.create({
      title,
      description,
      location,
      eventType,
      start,
      end,
      clubName: user.clubName,
      createdBy: user._id
    });

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ message: 'Event creation failed', error: err.message });
  }
};

// Get events (role-based)
exports.getEvents = async (req, res) => {
  const user = req.user;

  try {
    let events;

    if (user.role === 'clubAdmin') {
      events = await Event.find({ clubName: user.clubName });
    } else if (user.role === 'universityAdmin') {
      events = await Event.find();
    } else if (user.role === 'student') {
      events = await Event.find({ status: 'approved' });
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving events', error: err.message });
  }
};

// UniversityAdmin updates status (approve/reject)
exports.updateEventStatus = async (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;
  const user = req.user;

  if (user.role !== 'universityAdmin') {
    return res.status(403).json({ message: 'Only university admins can update status' });
  }

  try {
    const updated = await Event.findByIdAndUpdate(
      id,
      { status, feedback },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Status update failed', error: err.message });
  }
};

// ClubAdmin edits own pending/rejected event
exports.updateEvent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (user.role !== 'clubAdmin' || event.clubName !== user.clubName) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    if (event.status === 'approved') {
      return res.status(400).json({ message: 'Approved events cannot be edited' });
    }

    const updated = await Event.findByIdAndUpdate(id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed', error: err.message });
  }
};

// Student joins an event
exports.joinEvent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved events can be joined' });
    }

    if (event.participants.includes(user._id)) {
      return res.status(400).json({ message: 'Already joined' });
    }

    event.participants.push(user._id);
    await event.save();

    res.json({ message: 'Joined successfully', event });
  } catch (err) {
    res.status(500).json({ message: 'Join failed', error: err.message });
  }
};

// Student leaves an event
exports.leaveEvent = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const event = await Event.findById(id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.participants = event.participants.filter(
      (participantId) => participantId.toString() !== user._id.toString()
    );

    await event.save();

    res.json({ message: 'Left successfully', event });
  } catch (err) {
    res.status(500).json({ message: 'Leave failed', error: err.message });
  }
};
