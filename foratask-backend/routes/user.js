const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadAvatarMiddleware");
const { userInfo, updateUser, deleteUser, usersList, saveExpoPushToken,removeExpoPushToken, resetPassword } = require("../controllers/userController");
router.get('/userinfo', userInfo);
router.patch('/update-user/:id', upload.single('avatar'), updateUser);
router.delete('/delete-user/:id', deleteUser);
router.get('/usersList', usersList);
// 🆕 Add this route for saving Expo push token
router.post('/save-token', saveExpoPushToken);
router.delete('/remove-token',removeExpoPushToken);
router.patch('/reset-password/:id',resetPassword);
module.exports = router;
