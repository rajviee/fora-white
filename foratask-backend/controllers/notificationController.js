const Notification = require('../models/notification');
const Task = require('../models/task')
const User = require('../models/user')
const mongoose = require('mongoose');

// import fetch from "node-fetch";


const sendPushNotification = async (expoPushToken, title, body, sound ) => {
  try {
    // Validate the token format
    if (!expoPushToken) {
      console.error('No push token provided');
      return { success: false, error: 'No push token' };
    }

    // Check if token is in correct format (should start with ExponentPushToken[...)
    if (!expoPushToken.startsWith('ExponentPushToken[') &&
      !expoPushToken.startsWith('ExpoPushToken[')) {
      console.error('Invalid token format:', expoPushToken);
      return { success: false, error: 'Invalid token format' };
    }

    console.log('Sending notification to:', expoPushToken);
    console.log('Title:', title);
    console.log('Body:', body);

    const message = {
      to: expoPushToken,
      sound: sound,
      title: title,
      body: body,
      data: {
        // Add any additional data you want to pass
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      channelId: 'default', // For Android
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();

    console.log('Notification response:', responseData);

    if (!response.ok) {
      console.error('Failed to send notification:', responseData);
      return { success: false, error: responseData };
    }

    // Check for Expo-specific errors
    if (responseData.data && responseData.data[0]) {
      const ticketData = responseData.data[0];

      if (ticketData.status === 'error') {
        console.error('Expo error:', ticketData.message, ticketData.details);
        return {
          success: false,
          error: ticketData.message,
          details: ticketData.details
        };
      }

      if (ticketData.status === 'ok') {
        console.log('Notification sent successfully!');
        return { success: true, ticket: ticketData };
      }
    }

    return { success: true, response: responseData };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

async function sendBulkPushNotifications(messages) {
  if (!messages.length) return;

  try {
    // Expo allows max 100 messages per request
    const chunks = [];
    while (messages.length) {
      chunks.push(messages.splice(0, 100));
    }

    const results = [];

    for (const chunk of chunks) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const json = await response.json();
      results.push(json);
    }

    return results;
  } catch (err) {
    console.error("Bulk push error:", err.message);
    return null;
  }
}

// Get user notifications
const getAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(req.user.company, '- req.user.company')
    console.log(userId, '- req.user.id')
    const companyId = req.user.company;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    await Notification.updateMany(
      { userId, isRead: false, company: companyId }, // filter
      { $set: { isRead: true } } // update
    );
    return res.status(200).json(notifications);
  }
  catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const unreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, isRead: false, company: req.user.company });
  res.status(200).json({ count });
};

const handleTaskApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const notification = await Notification.findById(id).where({
      userId,
      company: req.user.company,
      type: "taskApproval",
      "action.chosen": "" || null,
    });

    const task = await Task.findOne({
      _id: notification.taskId,
      company: req.user.company
    }).populate("assignees", "id");
    const people = await User.find({
      _id: {
        $in: [
          ...task.observers,
          ...task.assignees,
          task.createdBy
        ],
        $ne: userId
      }, expoPushToken: { $nin: [null, ""] }
    },
      { expoPushToken: 1 }
    );
    console.log(people, "pep");


    const isObserver = task.observers.map(String).includes(userId);

    if (notification && task && (req.user.role == "admin" || isObserver)) {
      notification.action.chosen = action;
      await notification.save();
    }
    else {
      return res.status(500).json({ message: "Unable to process request. Check if notification exists and you have proper permissions." })
    }
    if (action === "approve") {
      if (people.length) {
        const exponotifications = people.map(pep => ({
          to: pep.expoPushToken,
          sound: "foranotif.wav",
          title: "Task Approval",
          body: `${task.title} has been approved`,
          channelId: "default",
          data: { type: "taskApproval" }
        }))
        const response = await sendBulkPushNotifications(exponotifications);
        console.log("📨 Bulk push response:", response);
      }
      task.status = "Completed";
      await task.save();
      return res.status(200).json({ message: "Task approved successfully", task });
    }
    else if (action === "reject") {
      if (people.length) {
        const exponotifications = people.map(pep => ({
          to: pep.expoPushToken,
          sound: "foranotif.wav",
          title: "Task Rejected",
          body: `${task.title} has been rejected and moved back to Pending`,
          channelId: "default",
          data: { type: "taskApproval" }
        }))
        const response = await sendBulkPushNotifications(exponotifications);
        console.log("📨 Bulk push response:", response);
      }
      task.status = "Pending";
      await task.save();

      const rejectionNotifs = task.assignees.map(assigneeId => ({
        userId: assigneeId,
        senderId: userId,
        taskId: task.id,
        type: "taskRejected",
        message: `Your task ${task.title} has been rejected and moved back to Pending`,
        company: req.user.company
      }));
      await Notification.insertMany(rejectionNotifs);
      return res.status(200).json({ message: "Task rejected successfully", task });
    }
    res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllNotifications, unreadCount, handleTaskApproval, sendPushNotification, sendBulkPushNotifications }