import type { IUser } from './constants/interfaces/model.interfaces.js';
declare global {
  namespace Express {
    interface Request {
      user?: IUser; // or whatever type your User model is
    }
  }
}
