// backend/src/controllers/clubController.js
const Club = require('../models/Club');

// Kulüpleri getirirken, kullanıcının üye olup olmadığı bilgisini ve üye sayısını da ekle
exports.getClubs = async (req, res) => {
  try {
    // Tüm kulüpleri members dizileriyle birlikte getir
    const clubs = await Club.find({});
    
    // Kullanıcı için üyelik bilgisini ve üye sayısını ekle
    const clubsWithExtras = clubs.map(club => {
      const clubObj = club.toObject();
      
      // Üye sayısını ekle
      clubObj.memberCount = club.members ? club.members.length : 0;
      
      // Kullanıcının üye olup olmadığını kontrol et
      if (!club.members) {
        clubObj.isMember = false;
      } else {
        clubObj.isMember = club.members.some(memberId => 
          memberId.toString() === req.user._id.toString()
        );
      }
      
      return clubObj;
    });
    
    res.status(200).json(clubsWithExtras);
  } catch (error) {
    console.error('Error in getClubs:', error);
    res.status(500).json({ message: 'Server error while fetching clubs', error: error.message });
  }
};

// Public clubs without authentication
exports.getPublicClubs = async (req, res) => {
  try {
    console.log('Public clubs controller called');
    const clubs = await Club.find({}, 'name _id');
    console.log('Public clubs found:', clubs.length);
    res.status(200).json(clubs);
  } catch (error) {
    console.error('Error in getPublicClubs:', error);
    res.status(500).json({ message: 'Server error while fetching clubs', error: error.message });
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
      createdBy: req.user._id,
      members: [] // Boş bir members dizisi başlat
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

// Kulübe katılma
exports.joinClub = async (req, res) => {
  try {
    console.log('Join club request - Club ID:', req.params.id);
    console.log('Join club request - User:', req.user);
    
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Eğer members dizisi yoksa oluştur
    if (!club.members) {
      club.members = [];
    }
    
    // Kullanıcı zaten üye mi kontrol et
    if (club.members.some(memberId => memberId.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already a member of this club' });
    }
    
    // Kullanıcıyı üyeler listesine ekle
    club.members.push(req.user._id);
    await club.save();
    
    res.status(200).json({ message: 'Successfully joined the club' });
  } catch (error) {
    console.error('Error in joinClub:', error);
    res.status(500).json({ message: 'Server error while joining club', error: error.message });
  }
};

// Kulüpten çıkma
exports.leaveClub = async (req, res) => {
  try {
    console.log('Leave club request - Club ID:', req.params.id);
    console.log('Leave club request - User:', req.user);
    
    const club = await Club.findById(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Eğer members dizisi yoksa hata döndür
    if (!club.members) {
      return res.status(400).json({ message: 'You are not a member of this club' });
    }
    
    // Kullanıcı üye değilse hata döndür
    if (!club.members.some(memberId => memberId.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are not a member of this club' });
    }
    
    // Kullanıcıyı üyeler listesinden çıkar
    club.members = club.members.filter(memberId => memberId.toString() !== req.user._id.toString());
    await club.save();
    
    res.status(200).json({ message: 'Successfully left the club' });
  } catch (error) {
    console.error('Error in leaveClub:', error);
    res.status(500).json({ message: 'Server error while leaving club', error: error.message });
  }
};

// Kulüp üyelerini getirme
exports.getClubMembers = async (req, res) => {
  try {
    console.log('Get club members request - Club ID:', req.params.clubId);
    
    // Kulübü bul
    const club = await Club.findById(req.params.clubId);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }
    
    // Kulübün üyelerini popüle et
    const clubWithMembers = await Club.findById(req.params.clubId)
      .populate('members', 'fullName email _id');
    
    if (!clubWithMembers.members || clubWithMembers.members.length === 0) {
      return res.status(200).json([]);
    }
    
    // İstenilen formatta üye bilgilerini döndür
    const members = clubWithMembers.members.map(member => ({
      _id: member._id,
      name: member.fullName,
      email: member.email
    }));
    
    res.status(200).json(members);
  } catch (error) {
    console.error('Error in getClubMembers:', error);
    res.status(500).json({ message: 'Server error while fetching club members', error: error.message });
  }
};