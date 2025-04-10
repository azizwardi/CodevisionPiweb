const Notification = require("../models/notifications");

async function getUserNotification(req, res) {
    try {
        const userId = req.user.id;

        const notifications = await Notification.find({ userId }).sort({ _id: -1 });

        res.status(200).json({ notifications });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

async function markNotificationAsViewed(req, res) {
    try {
        const { notificationId } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.userId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized access to notification" });
        }

        notification.isViewedBy = true;
        await notification.save();

        return res.status(200).json({ message: "Notification marked as viewed" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error while updating notification" });
    }
}

module.exports = {
    getUserNotification,
    markNotificationAsViewed
};