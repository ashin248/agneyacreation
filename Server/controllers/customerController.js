const User = require('../src/schema/UserSchema');
const Order = require('../src/schema/OrderSchema');

// Fetch all customers, implicitly blocking password fields for absolute security
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
                                .sort({ createdAt: -1 })
                                .select('-password');
    
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
};

// Toggle the isBlocked status for a specific user ID natively
exports.toggleBlockStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Toggle boolean directly
    user.isBlocked = !user.isBlocked;
    await user.save();

    // Re-fetch cleanly stripping the password so the client state stays perfectly secure
    const updatedUser = await User.findById(userId).select('-password');

    return res.status(200).json({ 
        success: true, 
        message: `Customer successfully ${updatedUser.isBlocked ? 'blocked' : 'unblocked'}.`, 
        data: updatedUser 
    });
  } catch (error) {
    console.error('Error toggling block status:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle status.' });
  }
};

// Fetch a single highly defined customer profile bypassing auth binaries
exports.getCustomerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customer profile.' });
  }
};

// Map all external orders globally linked via raw Email mappings precisely
exports.getCustomerOrders = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    // Isolate cross-schema queries linking Orders to Users inherently dynamically
    const orders = await Order.find({ 'customer.email': user.email }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch tracking details.' });
  }
};



// ==========================================
// B2B GST VERIFICATION SYSTEM
// ==========================================

// Fetch all customers holding active or pending business verification requests securely
exports.getGstApplications = async (req, res) => {
  try {
    // Isolate nodes specifically mapping valid validation scopes purely tracking businesses
    const applications = await User.find({ 'businessProfile.gstStatus': { $ne: 'None' } })
                                   .sort({ createdAt: -1 })
                                   .select('-password');
                                   
    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error('Error fetching GST applications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch business verifications.' });
  }
};

// Execute targeted validations flipping enumerations explicitly securely 
exports.updateGstStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Architected backend guard capturing invalid vectors seamlessly
    const validStatuses = ['None', 'Pending', 'Verified', 'Rejected'];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ success: false, message: 'Invalid GST validation enum provided.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { 'businessProfile.gstStatus': status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Target Business Account not found.' });
    }

    return res.status(200).json({ success: true, message: `GST successfully marked as ${status}`, data: updatedUser });
  } catch (error) {
    console.error('Error updating GST validation:', error);
    return res.status(500).json({ success: false, message: 'Failed to perform GST evaluation node update.' });
  }
};

