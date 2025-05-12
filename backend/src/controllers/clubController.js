const Club = require('../models/Club');

// Get all clubs
exports.getClubs = async (req, res) => {
  try {
    const clubs = await Club.find({});
    
    res.status(200).json(clubs);
  } catch (error) {
    console.error('Error in getClubs:', error);
    res.status(500).json({ message: 'Server error while fetching clubs', error: error.message });
  }
};

// Get a single club by ID
exports.getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    res.status(200).json(club);
  } catch (error) {
    console.error('Error in getClub:', error);
    res.status(500).json({ message: 'Server error while fetching club', error: error.message });
  }
};

// Create a new club
exports.createClub = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('User:', req.user);
    
    const { name, description, category } = req.body;
    
    // Check required fields
    if (!name || !description) {
      return res.status(400).json({ message: 'Name and description are required' });
    }
    
    // Handle file upload if available
    const clubImage = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Create new club with only the fields you're sending from frontend
    const club = new Club({
      name,
      description,
      category: category || undefined,
      clubImage,
      createdBy: req.user._id
    });
    
    console.log('Club to be saved:', club);
    
    const savedClub = await club.save();
    res.status(201).json(savedClub);
  } catch (error) {
    console.error('Error in createClub:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ message: 'Server error while creating club', error: error.message });
  }
};

// Update a club
exports.updateClub = async (req, res) => {
  try {
    console.log('Update club request - Club ID:', req.params.id);
    console.log('Update club request - User:', req.user);
    console.log('Update club request - Body:', req.body);
    console.log('Update club request - File:', req.file);
    
    const { name, description, category } = req.body;
    
    // Find the club first to check permissions
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      console.log('Club not found');
      return res.status(404).json({ message: 'Club not found' });
    }
    
    console.log('Club found:', club);
    console.log('Club createdBy:', club.createdBy);
    console.log('User ID:', req.user._id);
    
    // Check if the user is authorized to update this club
    if (club.createdBy && club.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'universityAdmin') {
      console.log('User is not authorized to update this club');
      return res.status(403).json({ message: 'Not authorized to update this club' });
    }
    
    // Update club data
    const updatedData = {
      name,
      description,
      category
    };
    
    // If there's a new image, add it to the update
    if (req.file) {
      updatedData.clubImage = `/uploads/${req.file.filename}`;
    }
    
    // Update the club
    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true } // Return the updated document
    );
    
    console.log('Club updated successfully');
    res.status(200).json(updatedClub);
  } catch (error) {
    console.error('Error in updateClub:', error);
    res.status(500).json({ message: 'Server error while updating club', error: error.message });
  }
};

// Delete a club
exports.deleteClub = async (req, res) => {
  try {
    console.log('Delete club request - Club ID:', req.params.id);
    console.log('Delete club request - User:', req.user);
    console.log('User role:', req.user.role);
    
    // Find the club first
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      console.log('Club not found');
      return res.status(404).json({ message: 'Club not found' });
    }
    
    console.log('Club found:', club);
    
    // Check if user is a universityAdmin (they should be able to delete any club)
    if (req.user.role === 'universityAdmin') {
      console.log('User is universityAdmin, proceeding with deletion');
      await Club.findByIdAndDelete(req.params.id);
      console.log('Club deleted successfully by admin');
      return res.status(200).json({ message: 'Club deleted successfully' });
    }
    
    console.log('User role is not universityAdmin, checking if user created the club');
    console.log('Club createdBy:', club.createdBy);
    console.log('User ID:', req.user._id);
    
    // For other users, check if they created the club
    if (club.createdBy && club.createdBy.toString() !== req.user._id.toString()) {
      console.log('User is not authorized to delete this club');
      return res.status(403).json({ message: 'Not authorized to delete this club' });
    }
    
    // Delete the club
    await Club.findByIdAndDelete(req.params.id);
    console.log('Club deleted successfully by creator');
    
    res.status(200).json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error in deleteClub:', error);
    res.status(500).json({ message: 'Server error while deleting club', error: error.message });
  }
};