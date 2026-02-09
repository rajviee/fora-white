const express = require("express");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const Notification = require('./models/notification');
const userRoute = require('./routes/user');
const taskRoute = require('./routes/task');
const adminRoute = require('./routes/admin');
const notificationRoute = require('./routes/notification');
const statsRoute = require('./routes/stats');
const reportRoute = require('./routes/report');
const paymentRoute = require('./routes/payment');
const masterAdminRoute = require('./routes/masterAdmin');
const { sendBulkPushNotifications } = require('./controllers/notificationController');
const { seedMasterAdmin } = require('./controllers/masterAdminController');
const Task = require('./models/task');
const User = require('./models/user');
const Subscription = require('./models/subscription');
const Company = require('./models/company');
const TaskCompletionHistory = require('./models/taskCompletionHistory');
const cron = require("node-cron");
const cors = require('cors');
const app = express();

const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const dotenv = require("dotenv");
const cookie = require("cookie-parser");

dotenv.config();
const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: process.env.FRONTEND_URI,
    methods: ["GET", "POST","PATCH"],
    credentials: true,
  },
});
app.use(cors());
app.use(cookie());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Routes
app.use('/auth', authRoute);
app.use('/me', authMiddleware, userRoute);
app.use('/task', authMiddleware, taskRoute);
app.use('/uploads', express.static('uploads'));
app.use('/stats', authMiddleware, statsRoute);
app.use('/notifications/', authMiddleware, notificationRoute);
app.use('/reports', authMiddleware, reportRoute);
app.use('/payment', paymentRoute);
app.use('/master-admin', masterAdminRoute);
app.use('/', authMiddleware, adminRoute);

const connectedUsers = {};
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Register user after login
  socket.on("registerUser", (userId) => {
    connectedUsers[userId] = socket.id;
    console.log("Registered:", userId, "->", socket.id);
  });

  // Remove user on disconnect
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});
global.io = io;
global.connectedUsers = connectedUsers;

function getRemainingTime(now, due) {
  let diffMs = due - now;
  if (diffMs < 0) diffMs = 0;

  const minutes = Math.floor(diffMs / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const overdueTasks = await Task.find({
      dueDateTime: { $lt: now },
      status: { $nin: ["Completed", "Overdue", "For Approval"] }
    });

    if (overdueTasks.length) {
      // Mark overdue in bulk
      await Task.updateMany(
        { _id: { $in: overdueTasks.map((t) => t._id) } },
        { $set: { status: "Overdue" } }
      );

      // Create overdue notifications
      const overdueNotifs = overdueTasks.flatMap((task) => {
        const uniqueUsers = [...new Set([...task.assignees, ...task.observers].map(id => id.toString()))];
        return uniqueUsers.map((userId) => ({
          userId,
          taskId: task._id,
          type: "Overdue",
          message: `Task "${task.title}" is Overdue!`,
          company: task.company
        }));
      });

      const insertedNotifs = await Notification.insertMany(overdueNotifs);


      // Link notifications to each task
      for (const task of overdueTasks) {
        const matched = insertedNotifs.filter((n) =>
          n.taskId.equals(task._id)
        );

        task.notification.push(
          ...matched.map((n) => ({
            date: now,
            notifId: n._id,
            type: n.type
          }))
        );

        await task.save();
      }
    }

    const tasks = await Task.find({
      "notification.date": { $lte: now },
      status: { $nin: ["Completed", "For Approval"] }
    });

    for (const task of tasks) {
      let saveNeeded = false;

      for (const n of task.notification) {
        if (!n.notifId && new Date(n.date) <= now) {
          // Generate remaining time text
          const remaining = getRemainingTime(now, new Date(task.dueDateTime));

          const message = `Task "${task.title}" is due within ${remaining}`;

          // Create notifications for each assignee
          const notifDocs = task.assignees.map((assigneeId) => ({
            reminderTime: n.date,
            dueDateTime: task.dueDateTime,
            userId: assigneeId,
            taskId: task._id,
            type: "reminder",
            message,
            company: task.company
          }));

          const inserted = await Notification.insertMany(notifDocs);

          // Save notification ID back to task
          n.notifId = inserted[0]._id;
          n.type = "reminder";
          saveNeeded = true;
        }
      }

      if (saveNeeded) await task.save();
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});
cron.schedule("* * * * *", async () => {
  try {
    console.log("🔔 Bulk Notification Cron Started...");

    // 1️⃣ Fetch all notifications that need to be sent
    const pending = await Notification.find({
      isSend: false,
      type: { $in: ["reminder", "Overdue"] }
    }).lean();

    if (pending.length === 0) {
      console.log("No pending notifications.");
      return;
    }

    console.log(`📦 Pending notifications: ${pending.length}`);

    // 2️⃣ Collect user IDs
    const userIds = [...new Set(pending.map(n => n.userId.toString()))];

    // fetch expoPushToken for these users
    const users = await User.find(
      { _id: { $in: userIds } },
      { expoPushToken: 1 }
    ).lean();

    // Map user → token
    const userTokenMap = {};
    users.forEach(u => {
      if (u.expoPushToken) {
        userTokenMap[u._id.toString()] = u.expoPushToken;
      }
    });

    // 3️⃣ Build messages
    const expoMessages = [];
    const toMarkSent = []; // ALL notifications that should be marked sent

    for (const notif of pending) {
      const token = userTokenMap[notif.userId.toString()];

      // If user has NO token → mark as sent (skip sending)
      if (!token) {
        toMarkSent.push(notif._id);
        continue;
      }

      const title =
        notif.type === "Overdue" ? "Task Overdue" : "Task Reminder";

      expoMessages.push({
        to: token,
        sound: "foranotif.wav",
        title: title,
        body: notif.message,
        channelId: "default",
        data: { taskId: notif.taskId }
      });

      // add this notif to sent list
      toMarkSent.push(notif._id);
    }

    if (expoMessages.length === 0) {
      console.log("⚠ No users had valid pushTokens. Marking them as sent.");
      await Notification.updateMany(
        { _id: { $in: toMarkSent } },
        { $set: { isSend: true } }
      );
      return;
    }

    // 4️⃣ Send in bulk
    const response = await sendBulkPushNotifications(expoMessages);
    console.log("📨 Bulk push response:", response);

    // 5️⃣ Mark all as sent
    await Notification.updateMany(
      { _id: { $in: toMarkSent } },
      { $set: { isSend: true } }
    );

    console.log("✅ Updated sent notifications:", toMarkSent.length);

  } catch (err) {
    console.error("Bulk Cron Error:", err.message);
  }
});

cron.schedule("0 0 * * *", async () => {
  try {
    await Notification.deleteMany({ expiresAt: { $lt: new Date() } });
    
    // Find recurring tasks that are completed or need reset
    const recurringTasks = await Task.find({
      taskType: 'Recurring',
      recurringSchedule: { $ne: null },
      status: { $in: ["Completed", "Overdue", "In Progress"] }
    });
    
    for (const task of recurringTasks) {
      const currentDue = new Date(task.dueDateTime);
      let nextDue = new Date(currentDue);
      
      // Calculate cycle number from existing history
      const historyCount = await TaskCompletionHistory.countDocuments({ task: task._id });
      const cycleNumber = historyCount + 1;

      // Save completion history before resetting
      if (task.status === "Completed" || task.status === "Overdue") {
        try {
          await TaskCompletionHistory.create({
            task: task._id,
            company: task.company,
            taskSnapshot: {
              title: task.title,
              description: task.description,
              priority: task.priority,
              taskType: task.taskType,
              recurringSchedule: task.recurringSchedule,
              isSelfTask: task.isSelfTask
            },
            completedBy: task.assignees[0],
            completedAt: new Date(),
            statusAtCompletion: task.status,
            originalDueDate: task.dueDateTime,
            completedOnTime: task.status === "Completed",
            daysOverdue: task.status === "Overdue" ? Math.ceil((new Date() - currentDue) / (1000 * 60 * 60 * 24)) : 0,
            assigneesSnapshot: task.assignees,
            observersSnapshot: task.observers,
            cycleNumber,
            cycleStartDate: currentDue,
            cycleEndDate: new Date(),
            wasAutoApproved: task.isSelfTask
          });
          console.log(`📝 Saved completion history for recurring task "${task.title}" - Cycle ${cycleNumber}`);
        } catch (historyError) {
          console.error(`Failed to save history for task ${task._id}:`, historyError.message);
        }
      }

      // Calculate next due date based on recurring schedule
      switch (task.recurringSchedule) {
        case "Daily":
          nextDue.setUTCDate(nextDue.getUTCDate() + 1);
          break;
        case "Weekly":
          nextDue.setUTCDate(nextDue.getUTCDate() + 7);
          break;
        case "Monthly":
          nextDue.setUTCMonth(nextDue.getUTCMonth() + 1);
          break;
        case "3-Months":
          nextDue.setUTCMonth(nextDue.getUTCMonth() + 3);
          break;
      }

      // Reset task for next cycle
      task.dueDateTime = nextDue;
      task.status = "Pending";

      // Reset notifications for next cycle
      if (task.notification && task.notification.length > 0) {
        const timeDiff = nextDue.getTime() - currentDue.getTime();
        task.notification = task.notification.map(notif => ({
          ...notif,
          date: new Date(new Date(notif.date).getTime() + timeDiff),
          notifId: null
        }));
      }

      await task.save();
      console.log(`✅ Recurring task "${task.title}" reset for ${nextDue.toISOString()}`);
    }
  }
  catch (err) {
    console.error("Recurring task cron error:", err.message);
  }
});

// Subscription expiry notification cron - runs every hour
cron.schedule("0 * * * *", async () => {
  try {
    console.log("📅 Checking subscription expiry notifications...");
    const now = new Date();

    // Find all active/trial subscriptions
    const subscriptions = await Subscription.find({
      status: { $in: ['trial', 'active'] }
    }).populate('company');

    for (const subscription of subscriptions) {
      const daysLeft = subscription.getDaysUntilExpiry();
      const company = subscription.company;
      
      if (!company) continue;

      // Get company admin(s)
      const admins = await User.find({
        company: company._id,
        role: 'admin'
      });

      if (admins.length === 0) continue;

      let notificationType = null;
      let message = null;

      // 7 days notification
      if (daysLeft <= 7 && daysLeft > 3 && !subscription.expiryNotificationsSent.sevenDay) {
        notificationType = 'sevenDay';
        message = `Your ${subscription.status === 'trial' ? 'free trial' : 'subscription'} expires in ${daysLeft} days. Renew now to continue using ForaTask.`;
      }
      // 3 days notification
      else if (daysLeft <= 3 && daysLeft > 1 && !subscription.expiryNotificationsSent.threeDay) {
        notificationType = 'threeDay';
        message = `Urgent: Your ${subscription.status === 'trial' ? 'free trial' : 'subscription'} expires in ${daysLeft} days. Renew to avoid service interruption.`;
      }
      // 1 day notification
      else if (daysLeft <= 1 && daysLeft > 0 && !subscription.expiryNotificationsSent.oneDay) {
        notificationType = 'oneDay';
        message = `Final Notice: Your ${subscription.status === 'trial' ? 'free trial' : 'subscription'} expires tomorrow! Renew immediately to prevent access loss.`;
      }
      // Expired notification
      else if (daysLeft <= 0 && !subscription.expiryNotificationsSent.expired) {
        notificationType = 'expired';
        message = `Your ${subscription.status === 'trial' ? 'free trial' : 'subscription'} has expired. Renew now to restore full access.`;
        subscription.status = 'expired';
      }

      if (notificationType && message) {
        // Create notifications for admins
        const notifications = admins.map(admin => ({
          userId: admin._id,
          message,
          type: 'system',
          company: company._id
        }));

        await Notification.insertMany(notifications);

        // Send push notifications
        const pushMessages = admins
          .filter(admin => admin.expoPushToken)
          .map(admin => ({
            to: admin.expoPushToken,
            sound: 'foranotif.wav',
            title: 'Subscription Alert',
            body: message,
            channelId: 'default',
            data: { type: 'subscription_expiry' }
          }));

        if (pushMessages.length > 0) {
          await sendBulkPushNotifications(pushMessages);
        }

        // Mark notification as sent
        subscription.expiryNotificationsSent[notificationType] = true;
        await subscription.save();

        console.log(`📧 Sent ${notificationType} expiry notification for company: ${company.companyName}`);
      }
    }
  } catch (err) {
    console.error("Subscription expiry cron error:", err.message);
  }
});


mongoose.connect(MONGO_URI).then(async () => {
  console.log("MongoDB Connected");
  
  // Seed master admin on startup
  await seedMasterAdmin();
  
  server.listen(PORT, () => {
    console.log('Server running on 3000');
  })
}).catch((err) => {
  console.log(err);
})

