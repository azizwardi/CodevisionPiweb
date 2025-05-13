const TeamChatMessage = require("../models/teamChat");
const Team = require("../models/team");
const User = require("../models/user");

/**
 * Get all messages for a team
 */
exports.getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    console.log(`Getting messages for team: ${teamId}, limit: ${limit}, skip: ${skip}`);

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      console.log(`Team not found with ID: ${teamId}`);
      return res.status(404).json({ message: "Team not found" });
    }
    console.log(`Team found: ${team.name}`);

    // Get messages for the team, sorted by creation date
    const messages = await TeamChatMessage.find({ team: teamId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("sender", "username firstName lastName email avatarUrl")
      .populate("readBy", "username firstName lastName");

    console.log(`Found ${messages.length} messages for team ${teamId}`);

    // If no messages are found, create a welcome message
    if (messages.length === 0 && skip === 0) {
      console.log("No messages found, creating welcome message");

      // Find team leader
      const teamLeader = await User.findById(team.teamLeader);

      if (teamLeader) {
        console.log(`Team leader found: ${teamLeader.username || teamLeader.email}`);

        // Create welcome message
        const welcomeMessage = new TeamChatMessage({
          team: teamId,
          sender: team.teamLeader,
          content: "Welcome to the team chat! This is where you can communicate with your team members.",
          readBy: [team.teamLeader.toString()]
        });

        console.log("Saving welcome message to database");
        const savedMessage = await welcomeMessage.save();

        // Populate sender information
        const populatedMessage = await TeamChatMessage.findById(savedMessage._id)
          .populate("sender", "username firstName lastName email avatarUrl")
          .populate("readBy", "username firstName lastName");

        console.log("Welcome message saved and populated");

        // Return the welcome message
        return res.status(200).json({
          messages: [populatedMessage]
        });
      }
    }

    res.status(200).json({
      messages: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error("Error fetching team messages:", error);
    res.status(500).json({
      message: "Error fetching team messages",
      error: error.message
    });
  }
};

/**
 * Send a new message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { teamId, senderId, content } = req.body;

    console.log("Received message request:", { teamId, senderId, content });

    if (!teamId || !senderId || !content) {
      console.log("Missing required fields:", { teamId, senderId, content });
      return res.status(400).json({
        message: "Team ID, sender ID, and message content are required"
      });
    }

    // Verify team exists
    const team = await Team.findById(teamId);
    if (!team) {
      console.log(`Team not found with ID: ${teamId}`);
      return res.status(404).json({ message: "Team not found" });
    }
    console.log(`Team found: ${team.name}`);

    // Verify sender exists and is a member of the team
    const sender = await User.findById(senderId);
    if (!sender) {
      console.log(`Sender not found with ID: ${senderId}`);
      return res.status(404).json({ message: "Sender not found" });
    }
    console.log(`Sender found: ${sender.username || sender.email}`);

    // Check if sender is a member of the team or the team leader
    const isMember = team.members.some(member =>
      member.user.toString() === senderId
    );
    const isLeader = team.teamLeader.toString() === senderId;

    console.log(`Sender is member: ${isMember}, is leader: ${isLeader}`);

    // For development, allow all users to send messages
    // In production, uncomment the following check
    /*
    if (!isMember && !isLeader) {
      return res.status(403).json({
        message: "User is not a member of this team"
      });
    }
    */

    // Create and save the message
    const message = new TeamChatMessage({
      team: teamId,
      sender: senderId,
      content,
      readBy: [senderId] // Sender has read their own message
    });

    console.log("Saving message to database:", message);
    const savedMessage = await message.save();
    console.log("Message saved with ID:", savedMessage._id);

    // Populate sender information for the response
    const populatedMessage = await TeamChatMessage.findById(savedMessage._id)
      .populate("sender", "username firstName lastName email avatarUrl");

    console.log("Populated message:", populatedMessage);

    // Emit socket event for real-time updates
    // Note: We're not emitting here anymore because the socket.io event in server.js
    // will handle the real-time updates to avoid duplication
    console.log("Message saved to database, socket.io events will handle real-time updates");

    res.status(201).json({
      message: "Message sent successfully",
      chatMessage: populatedMessage
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Error sending message",
      error: error.message
    });
  }
};

/**
 * Mark messages as read
 */
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, messageIds } = req.body;

    if (!userId || !messageIds || !messageIds.length) {
      return res.status(400).json({
        message: "User ID and message IDs are required"
      });
    }

    // Update all specified messages to add the user to readBy
    const updateResult = await TeamChatMessage.updateMany(
      {
        _id: { $in: messageIds },
        team: teamId,
        readBy: { $ne: userId } // Only update if user hasn't already read
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    res.status(200).json({
      message: "Messages marked as read",
      updatedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      message: "Error marking messages as read",
      error: error.message
    });
  }
};
