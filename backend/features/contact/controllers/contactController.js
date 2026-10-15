import contactModel from "../models/contactModel.js";

// Submit a new contact message
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Create new contact message
    const contactMessage = new contactModel({
      name,
      email,
      subject,
      message
    });

    await contactMessage.save();

    res.json({ 
      success: true, 
      message: "Message sent successfully! We'll get back to you soon." 
    });

  } catch (error) {
    console.log(error);
    res.json({ 
      success: false, 
      message: "Failed to send message. Please try again." 
    });
  }
};

// Get all contact messages (Admin only)
const getAllMessages = async (req, res) => {
  try {
    const messages = await contactModel.find({}).sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      messages 
    });

  } catch (error) {
    console.log(error);
    res.json({ 
      success: false, 
      message: "Failed to fetch messages" 
    });
  }
};

// Update message status (Admin only)
const updateMessageStatus = async (req, res) => {
  try {
    const { messageId, status, adminNotes, priority } = req.body;

    const updateData = { updatedAt: Date.now() };
    
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (priority) updateData.priority = priority;

    const message = await contactModel.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    );

    if (!message) {
      return res.json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Message updated successfully",
      data: message
    });

  } catch (error) {
    console.log(error);
    res.json({ 
      success: false, 
      message: "Failed to update message" 
    });
  }
};

// Delete message (Admin only)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;

    const message = await contactModel.findByIdAndDelete(messageId);

    if (!message) {
      return res.json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Message deleted successfully" 
    });

  } catch (error) {
    console.log(error);
    res.json({ 
      success: false, 
      message: "Failed to delete message" 
    });
  }
};

// Get message statistics (Admin only)
const getMessageStats = async (req, res) => {
  try {
    const totalMessages = await contactModel.countDocuments();
    const newMessages = await contactModel.countDocuments({ status: 'new' });
    const readMessages = await contactModel.countDocuments({ status: 'read' });
    const repliedMessages = await contactModel.countDocuments({ status: 'replied' });
    const closedMessages = await contactModel.countDocuments({ status: 'closed' });

    const stats = {
      total: totalMessages,
      new: newMessages,
      read: readMessages,
      replied: repliedMessages,
      closed: closedMessages
    };

    res.json({ 
      success: true, 
      stats 
    });

  } catch (error) {
    console.log(error);
    res.json({ 
      success: false, 
      message: "Failed to fetch statistics" 
    });
  }
};

export { 
  submitContactMessage, 
  getAllMessages, 
  updateMessageStatus, 
  deleteMessage, 
  getMessageStats 
};