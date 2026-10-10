import mongoose from 'mongoose';

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const normalizeObjectId = (id) => new mongoose.Types.ObjectId(id).toString();
