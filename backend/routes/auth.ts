import jwt from  "jsonwebtoken";
import express from 'express';
import { authenticateJwt, SECRET } from "../middleware";
import { User } from "../db";
import {z} from "zod";
const router = express.Router();

let userDetailsProp = z.object({
  username: z.string().min(1),
  password: z.string().min(5),
});

  router.post('/signup', async (req, res) => {
    const userDetails = userDetailsProp.safeParse(req.body);
    if (!userDetails.success) {
      return res.status(400).json({
        message: 'Invalid user details',
        errors: userDetails.error.errors
      });
    }
    const username = userDetails.data.username;
    const user = await User.findOne({ username });
    if (user) {
      res.status(403).json({ message: 'User already exists' });
    } else {
      const newUser = new User(userDetails);
      await newUser.save();
      const token = jwt.sign({ id: newUser._id }, SECRET, { expiresIn: '1h' });
      res.json({ message: 'User created successfully', token });
    }
  });
  
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
      const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });
    } else {
      res.status(403).json({ message: 'Invalid username or password' });
    }
  });

    router.get('/me', authenticateJwt, async (req, res) => {
      const userId = req.headers['userId'] 
      const user = await User.findOne({ _id: userId });
      if (user) {
        res.json({ username: user.username });
      } else {
        res.status(403).json({ message: 'User not logged in' });
      }
    });

export default router;